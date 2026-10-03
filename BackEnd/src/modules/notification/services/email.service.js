import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

let transporter = null;
let etherealAccount = null;
let transportType = 'none';

/**
 * Enterprise Email Service — Sends real emails via SMTP (Nodemailer).
 *
 * Transport priority:
 *   1. Gmail / Custom SMTP (production — from .env)
 *   2. Ethereal sandbox (development fallback — auto-generated)
 *
 * On Gmail auth failure, automatically falls back to Ethereal and retries.
 */
export const emailService = {
  /**
   * Force reset transporter (used by retry-on-failure logic).
   */
  _resetTransporter() {
    transporter = null;
    etherealAccount = null;
    transportType = 'none';
  },

  async getTransporter() {
    if (transporter) return transporter;

    // Sanitize all env values — strip Windows \r line endings and whitespace
    const clean = (v) => (v || '').replace(/\r/g, '').trim();
    const smtpService = clean(process.env.SMTP_SERVICE);
    const smtpHost = clean(process.env.SMTP_HOST) || (smtpService.toLowerCase() === 'gmail' ? 'smtp.gmail.com' : '');
    const smtpPort = parseInt(clean(process.env.SMTP_PORT) || '587', 10);
    const smtpUser = clean(process.env.SMTP_USER);
    const smtpPass = clean(process.env.SMTP_PASS).replace(/\s/g, '');

    if ((smtpService && smtpService.toLowerCase() === 'gmail') || (smtpUser && smtpUser.includes('gmail'))) {
      transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
          user: smtpUser,
          pass: smtpPass
        },
        tls: {
          rejectUnauthorized: false
        }
      });
      transportType = 'gmail-ssl';
      console.log(`📧 Email service initialized with Gmail SSL SMTP (${smtpUser})`);
    } else if (smtpHost && smtpUser && smtpPass) {
      transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: process.env.SMTP_SECURE === 'true' || smtpPort === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass
        },
        tls: {
          rejectUnauthorized: false
        }
      });
      transportType = 'smtp';
      console.log(`📧 Email service initialized with SMTP: ${smtpHost}:${smtpPort}`);
    } else {
      return this._createEtherealTransport();
    }

    return transporter;
  },

  async _createEtherealTransport() {
    try {
      etherealAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: etherealAccount.user,
          pass: etherealAccount.pass
        }
      });
      transportType = 'ethereal';
      console.log(`📧 Email service using Ethereal test sandbox: ${etherealAccount.user}`);
      console.log(`📧 NOTE: Ethereal emails don't reach real inboxes. View them at https://ethereal.email/login`);
      console.log(`📧       Ethereal Login → user: ${etherealAccount.user} | pass: ${etherealAccount.pass}`);
    } catch (err) {
      console.error('Failed to create Ethereal test account:', err.message);
      transporter = {
        sendMail: async (opts) => {
          console.log(`📧 [DEV NO-OP] To: ${opts.to} | Subject: ${opts.subject}`);
          return { messageId: `dev-${Date.now()}@localhost` };
        }
      };
      transportType = 'noop';
    }
    return transporter;
  },

  /**
   * Send an email.
   * On SMTP auth failure → auto-fallback to Ethereal and retry once.
   * @param {Object} options - { to, subject, html, text }
   * @returns {Object} - { success, messageId, previewUrl, transport }
   */
  async sendEmail({ to, subject, html, text }) {
    try {
      const transport = await this.getTransporter();
      const fromAddr = (process.env.SMTP_FROM || '"Enterprise ITMS" <noreply@enterprise.com>').replace(/\r/g, '').trim();

      const info = await transport.sendMail({
        from: fromAddr,
        to,
        subject,
        html: html || undefined,
        text: text || undefined
      });

      // If using Ethereal, log preview URL
      let previewUrl = null;
      if (etherealAccount) {
        previewUrl = nodemailer.getTestMessageUrl(info);
        if (previewUrl) {
          console.log(`📧 ✅ Ethereal Preview URL (open in browser to view email):`);
          console.log(`📧    ${previewUrl}`);
        }
      }

      console.log(`📧 ✅ Email sent to ${to} | Subject: "${subject}" | via: ${transportType}`);

      return {
        success: true,
        messageId: info.messageId,
        previewUrl,
        transport: transportType
      };
    } catch (err) {
      console.error(`📧 ❌ Email delivery failed to ${to} via ${transportType}:`, err.message);

      // On SMTP authentication failure, fallback to Ethereal and retry
      if (transportType !== 'ethereal' && transportType !== 'noop' && err.message.includes('Invalid login')) {
        console.warn(`📧 ⚠️  Gmail/SMTP credentials rejected. Falling back to Ethereal sandbox for this email.`);
        console.warn(`📧 ⚠️  To fix: Generate a new Gmail App Password at https://myaccount.google.com/apppasswords`);

        this._resetTransporter();
        await this._createEtherealTransport();

        try {
          const retryTransport = transporter;
          const retryInfo = await retryTransport.sendMail({
            from: '"Enterprise ITMS" <noreply@enterprise.com>',
            to,
            subject,
            html: html || undefined,
            text: text || undefined
          });

          let previewUrl = null;
          if (etherealAccount) {
            previewUrl = nodemailer.getTestMessageUrl(retryInfo);
            if (previewUrl) {
              console.log(`📧 ✅ Ethereal Fallback Succeeded! View the email here:`);
              console.log(`📧    ${previewUrl}`);
            }
          }

          return {
            success: true,
            messageId: retryInfo.messageId,
            previewUrl,
            transport: 'ethereal-fallback'
          };
        } catch (retryErr) {
          console.error(`📧 ❌ Ethereal fallback also failed:`, retryErr.message);
        }
      }

      return {
        success: false,
        error: err.message,
        previewUrl: null,
        transport: transportType
      };
    }
  },

  /**
   * Render a template body by replacing {{key}} placeholders with context values.
   */
  renderTemplate(templateStr, contextMap = {}) {
    if (!templateStr) return '';
    let rendered = templateStr;
    for (const [key, value] of Object.entries(contextMap)) {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      rendered = rendered.replace(regex, value != null ? String(value) : '');
    }
    return rendered;
  },

  /**
   * Build a professional HTML email wrapper around content.
   */
  wrapInHtmlEmail(subject, bodyHtml) {
    return `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif">
  <div style="max-width:600px;margin:24px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,0.08)">
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#6366f1,#4f46e5);padding:28px 32px">
      <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:700">🔔 ${subject}</h1>
      <p style="margin:6px 0 0;color:rgba(255,255,255,0.8);font-size:13px">Enterprise Issue Tracking Management System</p>
    </div>
    <!-- Body -->
    <div style="padding:28px 32px;color:#334155;font-size:14px;line-height:1.7">
      ${bodyHtml}
    </div>
    <!-- Footer -->
    <div style="padding:16px 32px;background:#f8fafc;border-top:1px solid #e2e8f0;text-align:center">
      <p style="margin:0;color:#94a3b8;font-size:11px">This is an automated notification. Please do not reply directly to this email.</p>
      <p style="margin:4px 0 0;color:#94a3b8;font-size:11px">© ${new Date().getFullYear()} Enterprise ITMS Platform</p>
    </div>
  </div>
</body>
</html>`;
  },

  /**
   * Alias for sendEmail for backwards compatibility.
   */
  async sendMail(options) {
    return this.sendEmail(options);
  }
};

export default emailService;
