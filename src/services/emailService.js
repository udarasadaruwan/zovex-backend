import dns from 'node:dns';
import nodemailer from 'nodemailer';
import {
  orderConfirmationTemplate,
  passwordChangeOtpTemplate,
  passwordResetOtpTemplate,
  welcomeEmailTemplate
} from './emailTemplates.js';
import ApiError from '../utils/ApiError.js';

const ipv4Lookup = (hostname, options, callback) => {
  dns.lookup(hostname, { ...options, family: 4 }, callback);
};

const buildTransporter = () => {
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

  const transportOptions = {
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT || 587),
    secure: Number(process.env.EMAIL_PORT) === 465,
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
    lookup: ipv4Lookup,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  };

  return nodemailer.createTransport(transportOptions);
};

export const sendEmail = async ({ to, subject, html }) => {
  const transporter = buildTransporter();

  let message;

  try {
    message = await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER || 'Zovex <no-reply@zovex.local>',
      to,
      subject,
      html
    });
  } catch (error) {
    console.error(`Email delivery failed for ${to}:`, error);
    throw new ApiError('Email delivery failed. Please check the email service configuration and try again.', 502);
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
