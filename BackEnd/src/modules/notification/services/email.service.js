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
  wrapInHtmlEmail(subject, bodyHtml, meta = {}) {
    const priority = meta.priority || '';
    const requestNumber = meta.requestNumber || '';
    const status = meta.status || '';
    const departmentName = meta.departmentName || '';

    const priorityBadge = priority ? `
      <span style="display:inline-block;padding:3px 10px;font-size:11px;font-weight:700;border-radius:6px;text-transform:uppercase;letter-spacing:0.5px;background:${priority === 'CRITICAL' ? '#fee2e2;color:#b91c1c' : priority === 'HIGH' ? '#fef3c7;color:#b45309' : '#e0e7ff;color:#4338ca'};">
        ${priority} PRIORITY
      </span>` : '';

    const summaryCard = (requestNumber || departmentName) ? `
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:12px 18px;margin-bottom:20px">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
          <tr>
            <td align="left">
              ${requestNumber ? `<span style="font-size:11px;color:#64748b;font-weight:600">TICKET REF: </span><strong style="color:#0f172a;font-size:13px">${requestNumber}</strong>` : ''}
              ${departmentName ? `<span style="margin-left:14px;font-size:11px;color:#64748b;font-weight:600">DEPARTMENT: </span><strong style="color:#0f172a;font-size:13px">${departmentName}</strong>` : ''}
            </td>
            <td align="right">
              ${priorityBadge}
            </td>
          </tr>
        </table>
      </div>` : '';

    const portalUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f1f5f9;padding:32px 12px">
    <tr>
      <td align="center">
        <div style="max-width:620px;width:100%;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 10px 25px -5px rgba(0,0,0,0.06),0 8px 10px -6px rgba(0,0,0,0.04);border:1px solid #e2e8f0">
          <!-- Corporate Header -->
          <div style="background:linear-gradient(135deg,#4f46e5 0%,#3730a3 100%);padding:28px 32px">
            <div style="font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:rgba(255,255,255,0.7);margin-bottom:6px">
              Enterprise Issue Tracking Management System
            </div>
            <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:800;line-height:1.3">
              ${subject}
            </h1>
          </div>
          <!-- Body Content -->
          <div style="padding:32px;color:#334155;font-size:14px;line-height:1.7">
            ${summaryCard}
            <div style="color:#334155;font-size:14px;line-height:1.75">
              ${bodyHtml}
            </div>
            <!-- Action Button -->
            <div style="margin-top:28px;text-align:center">
              <a href="${portalUrl}" target="_blank" style="display:inline-block;background:linear-gradient(135deg,#4f46e5,#4338ca);color:#ffffff;text-decoration:none;font-weight:700;font-size:13px;padding:12px 28px;border-radius:10px;box-shadow:0 4px 12px rgba(79,70,229,0.35)">
                Access ITMS Portal &rarr;
              </a>
            </div>
          </div>
          <!-- Compliance & Security Footer -->
          <div style="padding:20px 32px;background:#f8fafc;border-top:1px solid #e2e8f0;text-align:center">
            <p style="margin:0;color:#94a3b8;font-size:11px;line-height:1.5">
              This is an automated system transmission generated by the Enterprise ITMS notification engine.<br>
              Confidentiality Notice: Intended solely for the designated recipient.
            </p>
            <p style="margin:8px 0 0;color:#94a3b8;font-size:11px">
              &copy; ${new Date().getFullYear()} Enterprise Issue Tracking & Management System. All rights reserved.
            </p>
          </div>
        </div>
      </td>
    </tr>
  </table>
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
