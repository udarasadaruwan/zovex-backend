import dns from 'node:dns/promises';
import nodemailer from 'nodemailer';
import {
  orderConfirmationTemplate,
  passwordChangeOtpTemplate,
  passwordResetOtpTemplate,
  welcomeEmailTemplate
} from './emailTemplates.js';
import ApiError from '../utils/ApiError.js';

const normalizeEmailPassword = (password = '') => password.replace(/\s+/g, '');
const fromAddress = () => process.env.EMAIL_FROM || process.env.EMAIL_USER || 'Zovex <no-reply@zovex.local>';
const redirectStatuses = new Set([301, 302, 303, 307, 308]);

const postJsonFollowingRedirects = async (url, options, redirectsLeft = 5) => {
  const response = await fetch(url, {
    ...options,
    redirect: 'manual'
  });

  if (!redirectStatuses.has(response.status)) {
    return response;
  }

  if (redirectsLeft <= 0) {
    return response;
  }

  const location = response.headers.get('location');

  if (!location) {
    return response;
  }

  const nextUrl = new URL(location, url).toString();
  return postJsonFollowingRedirects(nextUrl, options, redirectsLeft - 1);
};

const assertEmailApiResponse = async (response, providerName) => {
  const body = await response.text().catch(() => '');
  let data = {};

  if (body) {
    try {
      data = JSON.parse(body);
    } catch {
      data = { raw: body };
    }
  }

  if (response.ok && data.ok !== false) {
    return data;
  }

  console.error(`${providerName} email API failed: ${response.status} ${body}`);
  throw new ApiError('Email delivery failed. Please check the email service configuration and try again.', 502);
};

const sendWithResend = async ({ to, subject, html }) => {
  if (!process.env.RESEND_API_KEY) return null;

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: fromAddress(),
      to,
      subject,
      html
    })
  });

  return assertEmailApiResponse(response, 'Resend');
};

const sendWithEmailWebhook = async ({ to, subject, html }) => {
  if (!process.env.EMAIL_WEBHOOK_URL) return null;

  const response = await postJsonFollowingRedirects(process.env.EMAIL_WEBHOOK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(process.env.EMAIL_WEBHOOK_SECRET ? { 'X-Zovex-Email-Secret': process.env.EMAIL_WEBHOOK_SECRET } : {})
    },
    body: JSON.stringify({
      secret: process.env.EMAIL_WEBHOOK_SECRET,
      from: fromAddress(),
      to,
      subject,
      html
    })
  });

  return assertEmailApiResponse(response, 'Email webhook');
};

const resolveSmtpHost = async (host) => {
  try {
    const addresses = await dns.resolve4(host);
    return addresses[0] || host;
  } catch (error) {
    console.warn(`Unable to resolve SMTP IPv4 address for ${host}: ${error.message}`);
    return host;
  }
};

const buildTransporter = async (overrides = {}) => {
  const hasSmtpConfig = process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS;

  if (!hasSmtpConfig) {
    if (process.env.EMAIL_PREVIEW !== 'true') {
      throw new ApiError('Email service is not configured. Fill EMAIL_HOST, EMAIL_USER, and EMAIL_PASS in backend/.env.', 500);
    }

    return nodemailer.createTransport({
      streamTransport: true,
      newline: 'unix',
      buffer: true
    });
  }

  const smtpHost = process.env.EMAIL_HOST.trim();
  const smtpPort = Number(overrides.port || process.env.EMAIL_PORT || 587);
  const resolvedHost = await resolveSmtpHost(smtpHost);

  const transportOptions = {
    host: resolvedHost,
    port: smtpPort,
    secure: overrides.secure ?? smtpPort === 465,
    family: 4,
    dnsTimeout: 10000,
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
    requireTLS: smtpPort === 587,
    tls: {
      servername: smtpHost
    },
    auth: {
      user: process.env.EMAIL_USER.trim(),
      pass: normalizeEmailPassword(process.env.EMAIL_PASS)
    }
  };

  return nodemailer.createTransport(transportOptions);
};

export const sendEmail = async ({ to, subject, html }) => {
  const apiMessage = (await sendWithEmailWebhook({ to, subject, html })) || (await sendWithResend({ to, subject, html }));

  if (apiMessage) {
    return apiMessage;
  }

  const sendMessage = async (transportOverrides) => {
    const transporter = await buildTransporter(transportOverrides);

    return transporter.sendMail({
      from: fromAddress(),
      to,
      subject,
      html
    });
  };

  let message;

  try {
    message = await sendMessage();
  } catch (error) {
    const configuredPort = Number(process.env.EMAIL_PORT || 587);
    const shouldRetryGmailSsl = process.env.EMAIL_HOST?.includes('gmail') && configuredPort !== 465;

    if (!shouldRetryGmailSsl) {
      console.error(`Email delivery failed for ${to}:`, error);
      throw new ApiError('Email delivery failed. Please check the email service configuration and try again.', 502);
    }

    console.warn(`Primary SMTP delivery failed for ${to}; retrying with Gmail SSL port 465: ${error.message}`);

    try {
      message = await sendMessage({ port: 465, secure: true });
    } catch (retryError) {
      console.error(`Email delivery failed for ${to}:`, retryError);
      throw new ApiError('Email delivery failed. Please check the email service configuration and try again.', 502);
    }
  }

  if (message.message?.toString && process.env.NODE_ENV !== 'production') {
    console.warn('SMTP is not configured. Email preview only; fill EMAIL_HOST, EMAIL_USER, and EMAIL_PASS to send real emails.');
    console.log(message.message.toString());
  }

  return message;
};

export const sendWelcomeEmail = (user) => {
  return sendEmail({
    to: user.email,
    subject: 'Welcome to Zovex',
    html: welcomeEmailTemplate(user)
  }).catch((error) => {
    console.warn(`Welcome email was not sent to ${user.email}: ${error.message}`);
  });
};

export const sendPasswordResetOtpEmail = (user, otp) => {
  return sendEmail({
    to: user.email,
    subject: 'Your Zovex password reset OTP',
    html: passwordResetOtpTemplate(user, otp)
  });
};

export const sendPasswordChangeOtpEmail = (user, otp) => {
  return sendEmail({
    to: user.email,
    subject: 'Confirm your Zovex password change',
    html: passwordChangeOtpTemplate(user, otp)
  });
};

export const sendOrderConfirmationEmail = (user, order) => {
  return sendEmail({
    to: user.email,
    subject: `Order confirmed: ${order._id}`,
    html: orderConfirmationTemplate(user, order)
  }).catch((error) => {
    console.warn(`Order confirmation email was not sent to ${user.email}: ${error.message}`);
  });
};
