import dotenv from 'dotenv';
import nodemailer from 'nodemailer';

dotenv.config();

const clean = (v) => (v || '').replace(/\r/g, '').trim();

const smtpUser = clean(process.env.SMTP_USER);
const smtpPass = clean(process.env.SMTP_PASS).replace(/\s/g, '');

console.log('='.repeat(60));
console.log('ADVANCED GMAIL SMTP CONNECTION TEST');
console.log('='.repeat(60));
console.log(`SMTP_USER: ${smtpUser ? '***CONFIGURED***' : 'NOT SET'}`);
console.log(`SMTP_PASS: ${smtpPass ? '***REDACTED***' : 'NOT SET'}`);
console.log('='.repeat(60));
async function runTests() {
  const configs = [
    {
      name: 'Gmail Direct (smtp.gmail.com:465 SSL)',
      opts: {
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: { user: smtpUser, pass: smtpPass },
        tls: { rejectUnauthorized: false }
      }
    },
    {
      name: 'Gmail STARTTLS (smtp.gmail.com:587 TLS)',
      opts: {
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        requireTLS: true,
        auth: { user: smtpUser, pass: smtpPass },
        tls: { rejectUnauthorized: false }
      }
    },
    {
      name: 'Nodemailer Service Gmail',
      opts: {
        service: 'gmail',
        auth: { user: smtpUser, pass: smtpPass }
      }
    }
  ];

  for (const cfg of configs) {
    console.log(`\n📧 Testing: ${cfg.name}...`);
    try {
      const transporter = nodemailer.createTransport(cfg.opts);
      await transporter.verify();
      console.log(`📧 ✅ VERIFIED SUCCESSFUL with ${cfg.name}!`);

      console.log(`📧 Dispatching test email to ${smtpUser}...`);
      const info = await transporter.sendMail({
        from: `"Enterprise ITMS Service Desk" <${smtpUser}>`,
        to: smtpUser,
        subject: `[ITMS SUCCESS] Credential Dispatch Test — ${new Date().toLocaleTimeString()}`,
        html: `<div style="font-family:sans-serif;padding:20px;background:#f8fafc;border-radius:10px">
          <h2 style="color:#4f46e5">✅ Credentials Email Delivery Confirmed!</h2>
          <p>Your ITMS system successfully authenticated with Gmail SMTP and delivered this email.</p>
        </div>`
      });

      console.log(`📧 ✅ EMAIL DELIVERED! Message ID: ${info.messageId}`);
      return true;
    } catch (err) {
      console.error(`📧 ❌ Failed: ${err.message}`);
    }
  }

  // Fallback to Ethereal sandbox test
  console.log('\n📧 Falling back to Ethereal sandbox mode...');
  const testAcc = await nodemailer.createTestAccount();
  const ethTransporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: { user: testAcc.user, pass: testAcc.pass }
  });
  const info = await ethTransporter.sendMail({
    from: `"Enterprise ITMS Service Desk" <${smtpUser}>`,
    to: smtpUser,
    subject: '[ITMS DEMO] Employee Credentials Welcome Email',
    html: `<h3>Welcome to ITMS</h3><p>Your temporary password: Temp#9481A</p>`
  });
  console.log(`📧 ✅ Ethereal Sandbox Link: ${nodemailer.getTestMessageUrl(info)}`);
  return false;
}

runTests().catch(console.error);
