const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');

// Email provider: 'resend' (HTTP API, works on Render) or 'smtp' (Gmail, local dev)
const EMAIL_PROVIDER = process.env.RESEND_API_KEY ? 'resend' : 'smtp';

// SMTP transporter (for local dev with Gmail)
let transporter = null;
let initPromise = null;

const SEND_TIMEOUT = 30000;

// Send email via Resend HTTP API (no SMTP ports needed)
async function sendViaResend({ to, subject, html, text }) {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: `${process.env.EMAIL_FROM_NAME || 'VitalFlow'} <${process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'}>`,
      to: [to],
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, '')
    })
  });

  const data = await response.json();

  if (response.ok) {
    console.log(`✅ Email sent via Resend to ${to}: ${data.id}`);
    return { success: true, messageId: data.id };
  } else {
    console.error('❌ Resend API error:', data);
    return { success: false, error: data.message || 'Resend API error' };
  }
}

// Initialize SMTP transporter (Gmail for local dev)
async function initializeTransporter() {
  if (transporter) return transporter;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      console.warn('⚠️ SMTP credentials not configured.');
      initPromise = null;
      return null;
    }

    const transport = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || 'gmail',
      pool: true,
      maxConnections: 3,
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });

    console.log('✅ SMTP email service configured (user:', process.env.EMAIL_USER, ')');
    transporter = transport;
    return transporter;
  })();

  return initPromise;
}

// Send email via SMTP (Gmail)
async function sendViaSMTP({ to, subject, html, text }) {
  const transport = await initializeTransporter();

  if (!transport) {
    return { success: false, reason: 'Email service not configured' };
  }

  try {
    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || 'VitalFlow'}" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, '')
    };

    const info = await Promise.race([
      transport.sendMail(mailOptions),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Email send timed out after 30s')), SEND_TIMEOUT)
      )
    ]);

    console.log(`✅ Email sent via SMTP to ${to}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Failed to send email via SMTP:', error.message);
    if (error.code === 'ECONNECTION' || error.code === 'ETIMEDOUT' || error.message.includes('timed out')) {
      transporter = null;
      initPromise = null;
    }
    return { success: false, error: error.message };
  }
}

// Load email template
function loadTemplate(templateName) {
  const templatePath = path.join(__dirname, '../templates/emails', `${templateName}.html`);
  try {
    return fs.readFileSync(templatePath, 'utf8');
  } catch (error) {
    console.error(`Failed to load email template: ${templateName}`, error);
    return null;
  }
}

// Replace template placeholders
function processTemplate(template, variables) {
  let processed = template;
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`{{${key}}}`, 'g');
    processed = processed.replace(regex, value || '');
  }
  return processed;
}

// Main send email function - routes to Resend or SMTP
async function sendEmail({ to, subject, html, text }) {
  if (EMAIL_PROVIDER === 'resend') {
    return sendViaResend({ to, subject, html, text });
  }
  return sendViaSMTP({ to, subject, html, text });
}

// Send welcome email
async function sendWelcomeEmail(user) {
  const template = loadTemplate('welcome');

  if (!template) {
    const fallbackHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #10b981;">Welcome to VitalFlow!</h1>
        <p>Hi ${user.first_name || 'there'},</p>
        <p>Thank you for joining VitalFlow. We're excited to help you on your health journey!</p>
        <p>Get started by completing your health profile to receive personalized recommendations.</p>
        <p>Best regards,<br>The VitalFlow Team</p>
      </div>
    `;
    return sendEmail({
      to: user.email,
      subject: 'Welcome to VitalFlow - Your AI Health Companion',
      html: fallbackHtml
    });
  }

  const html = processTemplate(template, {
    firstName: user.first_name || 'there',
    email: user.email,
    year: new Date().getFullYear()
  });

  return sendEmail({
    to: user.email,
    subject: 'Welcome to VitalFlow - Your AI Health Companion',
    html
  });
}

// Send OTP email
async function sendOTPEmail(email, otp, purpose = 'login') {
  const template = loadTemplate('otp');

  const purposeText = {
    login: 'Login Verification',
    phone_verify: 'Phone Verification',
    email_verify: 'Email Verification',
    password_reset: 'Password Reset'
  };

  if (!template) {
    const fallbackHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #10b981;">VitalFlow ${purposeText[purpose] || 'Verification'}</h1>
        <p>Your verification code is:</p>
        <div style="background: #f3f4f6; padding: 20px; text-align: center; margin: 20px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1f2937;">${otp}</span>
        </div>
        <p>This code will expire in 10 minutes.</p>
        <p style="color: #6b7280; font-size: 14px;">If you didn't request this code, please ignore this email.</p>
      </div>
    `;
    return sendEmail({
      to: email,
      subject: `VitalFlow - Your ${purposeText[purpose] || 'Verification'} Code`,
      html: fallbackHtml
    });
  }

  const html = processTemplate(template, {
    purpose: purposeText[purpose] || 'Verification',
    otp,
    expiryMinutes: process.env.OTP_EXPIRY_MINUTES || 10,
    year: new Date().getFullYear()
  });

  return sendEmail({
    to: email,
    subject: `VitalFlow - Your ${purposeText[purpose] || 'Verification'} Code`,
    html
  });
}

// Send notification email
async function sendNotificationEmail(user, notification) {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 20px; text-align: center;">
        <h1 style="color: white; margin: 0;">VitalFlow</h1>
      </div>
      <div style="padding: 30px; background: #ffffff;">
        <h2 style="color: #1f2937; margin-top: 0;">${notification.title}</h2>
        <p style="color: #4b5563;">${notification.message}</p>
        <div style="margin-top: 30px;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/notifications"
             style="background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
            View in App
          </a>
        </div>
      </div>
      <div style="padding: 20px; background: #f9fafb; text-align: center; color: #6b7280; font-size: 12px;">
        <p>You received this email because you have email notifications enabled.</p>
        <p>&copy; ${new Date().getFullYear()} VitalFlow. All rights reserved.</p>
      </div>
    </div>
  `;

  return sendEmail({
    to: user.email,
    subject: `VitalFlow - ${notification.title}`,
    html
  });
}

// Log which provider is being used
console.log(`📧 Email provider: ${EMAIL_PROVIDER === 'resend' ? 'Resend (HTTP API)' : 'SMTP (Gmail)'}`);

module.exports = {
  sendEmail,
  sendWelcomeEmail,
  sendOTPEmail,
  sendNotificationEmail,
  initializeTransporter
};
