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

const toBase64Url = (value) => Buffer.from(value).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');

const parseFromAddress = (value = fromAddress()) => {
  const match = value.match(/^(.*)<([^>]+)>$/);

  if (!match) {
    return {
      name: process.env.BREVO_SENDER_NAME || 'Zovex',
      email: value.trim()
    };
  }

  return {
    name: (process.env.BREVO_SENDER_NAME || match[1]).trim() || 'Zovex',
    email: match[2].trim()
  };
};
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

const sendWithBrevo = async ({ to, subject, html }) => {
  if (!process.env.BREVO_API_KEY) return null;

  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'api-key': process.env.BREVO_API_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      sender: parseFromAddress(),
      to: [{ email: to }],
      subject,
      htmlContent: html
    })
  });

  return assertEmailApiResponse(response, 'Brevo');
};

const getGmailAccessToken = async () => {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      client_id: process.env.GMAIL_API_CLIENT_ID,
      client_secret: process.env.GMAIL_API_CLIENT_SECRET,
      refresh_token: process.env.GMAIL_API_REFRESH_TOKEN,
      grant_type: 'refresh_token'
    })
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok || !data.access_token) {
    console.error(`Gmail token request failed: ${response.status} ${JSON.stringify(data)}`);
    throw new ApiError('Email delivery failed. Please check the email service configuration and try again.', 502);
  }

  return data.access_token;
};

const sendWithGmailApi = async ({ to, subject, html }) => {
  if (!process.env.GMAIL_API_CLIENT_ID || !process.env.GMAIL_API_CLIENT_SECRET || !process.env.GMAIL_API_REFRESH_TOKEN) {
    return null;
  }

  const accessToken = await getGmailAccessToken();
  const gmailUser = process.env.GMAIL_API_USER || 'me';
  const rawMessage = [
    `From: ${fromAddress()}`,
    `To: ${to}`,
    `Subject: ${subject}`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset=UTF-8',
    '',
    html
  ].join('\r\n');

  const response = await fetch(`https://gmail.googleapis.com/gmail/v1/users/${encodeURIComponent(gmailUser)}/messages/send`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      raw: toBase64Url(rawMessage)
    })
  });

  return assertEmailApiResponse(response, 'Gmail API');
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
  const apiMessage =
    (await sendWithGmailApi({ to, subject, html })) ||
    (await sendWithBrevo({ to, subject, html })) ||
    (await sendWithEmailWebhook({ to, subject, html })) ||
    (await sendWithResend({ to, subject, html }));

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
