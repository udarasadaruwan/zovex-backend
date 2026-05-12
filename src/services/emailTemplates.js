const escapeHtml = (value = '') =>
  value
    .toString()
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

const baseEmail = ({ title, preview, body }) => `
  <!doctype html>
  <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>${escapeHtml(title)}</title>
    </head>
    <body style="margin:0;background:#f5f7fa;color:#20252d;font-family:Arial,Helvetica,sans-serif;">
      <span style="display:none;opacity:0;color:transparent;height:0;width:0;overflow:hidden;">${escapeHtml(preview)}</span>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f5f7fa;padding:28px 12px;">
        <tr>
          <td align="center">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;background:#ffffff;border:1px solid #dbe1e8;border-radius:16px;overflow:hidden;">
              <tr>
                <td style="padding:28px 30px;background:#111827;color:#ffffff;">
                  <div style="font-size:24px;font-weight:800;letter-spacing:.2px;">Zovex</div>
                  <div style="margin-top:8px;color:#cbd5e1;font-size:14px;">Clean shopping, selling, and management.</div>
                </td>
              </tr>
              <tr>
                <td style="padding:30px;">
                  ${body}
                </td>
              </tr>
              <tr>
                <td style="padding:20px 30px;background:#f8fafc;border-top:1px solid #dbe1e8;color:#626c78;font-size:13px;line-height:1.6;">
                  This email was sent by Zovex. If you did not request it, you can safely ignore it.
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
  </html>
`;

const otpBlock = (otp) => `
  <div style="margin:22px 0;padding:20px;border-radius:14px;background:#eef4ff;border:1px solid #c7d8ff;text-align:center;">
    <div style="color:#626c78;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:.7px;">Your secure OTP</div>
    <div style="margin-top:8px;color:#2563eb;font-size:42px;font-weight:900;letter-spacing:8px;">${escapeHtml(otp)}</div>
  </div>
`;

export const welcomeEmailTemplate = (user) =>
  baseEmail({
    title: 'Welcome to Zovex',
    preview: 'Your Zovex account is ready.',
    body: `
      <h1 style="margin:0 0 14px;font-size:28px;line-height:1.2;color:#20252d;">Welcome, ${escapeHtml(user.name)}.</h1>
      <p style="margin:0 0 18px;color:#626c78;font-size:16px;line-height:1.7;">
        Your Zovex account is ready. You can browse products, manage your cart, and open your role-based dashboard.
      </p>
      <div style="padding:16px;border-radius:12px;background:#e7f5f2;color:#087568;font-weight:700;">
        Account role: ${escapeHtml(user.role || 'user')}
      </div>
    `
  });

export const passwordResetOtpTemplate = (user, otp) =>
  baseEmail({
    title: 'Reset your Zovex password',
    preview: 'Use this OTP to reset your Zovex password.',
    body: `
      <h1 style="margin:0 0 14px;font-size:28px;line-height:1.2;color:#20252d;">Password reset request</h1>
      <p style="margin:0;color:#626c78;font-size:16px;line-height:1.7;">
        Hi ${escapeHtml(user.name)}, enter this code in Zovex to create a new password.
      </p>
      ${otpBlock(otp)}
      <p style="margin:0;color:#626c78;font-size:14px;line-height:1.7;">
        This OTP expires in 10 minutes.
      </p>
    `
  });

export const passwordChangeOtpTemplate = (user, otp) =>
  baseEmail({
    title: 'Confirm your Zovex password change',
    preview: 'Use this OTP to confirm your password change.',
    body: `
      <h1 style="margin:0 0 14px;font-size:28px;line-height:1.2;color:#20252d;">Confirm password change</h1>
      <p style="margin:0;color:#626c78;font-size:16px;line-height:1.7;">
        Hi ${escapeHtml(user.name)}, use this code in your profile settings before updating your password.
      </p>
      ${otpBlock(otp)}
      <p style="margin:0;color:#626c78;font-size:14px;line-height:1.7;">
        This OTP expires in 10 minutes. Do not share it with anyone.
      </p>
    `
  });

export const orderConfirmationTemplate = (user, order) =>
  baseEmail({
    title: 'Your Zovex order is confirmed',
    preview: `Order ${order._id} is confirmed.`,
    body: `
      <h1 style="margin:0 0 14px;font-size:28px;line-height:1.2;color:#20252d;">Order confirmed</h1>
      <p style="margin:0 0 18px;color:#626c78;font-size:16px;line-height:1.7;">
        Thanks ${escapeHtml(user.name)}. Your order has been received and is ready for processing.
      </p>
      <div style="display:grid;gap:10px;padding:18px;border:1px solid #dbe1e8;border-radius:14px;background:#f8fafc;">
        <div><strong>Order ID:</strong> ${escapeHtml(order._id)}</div>
        <div><strong>Total:</strong> $${Number(order.total || 0).toFixed(2)}</div>
      </div>
    `
  });
