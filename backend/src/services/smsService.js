// SMS Service for OTP - Supports TextBelt (Free), Fast2SMS (India), and Twilio (International)

const FAST2SMS_API_URL = 'https://www.fast2sms.com/dev/bulkV2';
const TEXTBELT_API_URL = 'https://textbelt.com/text';

// Check which SMS service is configured
function getSMSProvider() {
  // TextBelt is free (1 SMS/day) - use as default for development
  if (process.env.SMS_PROVIDER === 'textbelt' || (!process.env.FAST2SMS_API_KEY && !process.env.TWILIO_ACCOUNT_SID)) {
    return 'textbelt';
  }
  if (process.env.FAST2SMS_API_KEY) {
    return 'fast2sms';
  }
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    return 'twilio';
  }
  return 'textbelt'; // Default to free TextBelt
}

// Initialize Twilio (fallback for international)
let twilioClient = null;
function initializeTwilio() {
  if (twilioClient) return twilioClient;

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (!accountSid || !authToken) {
    return null;
  }

  try {
    const twilio = require('twilio');
    twilioClient = twilio(accountSid, authToken);
    console.log('✅ Twilio SMS service ready');
    return twilioClient;
  } catch (error) {
    console.error('❌ Failed to initialize Twilio:', error.message);
    return null;
  }
}

// Send SMS via TextBelt (Free - 1 SMS/day)
async function sendViaTextBelt(phoneNumber, message) {
  try {
    // Clean phone number and add country code
    let cleanNumber = phoneNumber.replace(/\D/g, '');
    // Add India country code if not present
    if (cleanNumber.length === 10) {
      cleanNumber = '91' + cleanNumber;
    }
    // Add + prefix
    const formattedNumber = '+' + cleanNumber;

    const response = await fetch(TEXTBELT_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        phone: formattedNumber,
        message: message,
        key: 'textbelt' // Free tier key
      })
    });

    const data = await response.json();

    if (data.success) {
      console.log(`✅ SMS sent via TextBelt to ${formattedNumber}: ${data.textId}`);
      return { success: true, textId: data.textId, provider: 'textbelt' };
    } else {
      console.error('❌ TextBelt error:', data);
      // Check for quota exceeded
      if (data.error && data.error.includes('quota')) {
        return { success: false, reason: 'Daily free SMS limit reached (1/day). Try again tomorrow or upgrade.' };
      }
      return { success: false, reason: data.error || 'Failed to send SMS via TextBelt' };
    }
  } catch (error) {
    console.error('❌ TextBelt request failed:', error);
    return { success: false, reason: error.message };
  }
}

// Send SMS via Fast2SMS (Free for India - requires ₹100 recharge)
async function sendViaFast2SMS(phoneNumber, message) {
  const apiKey = process.env.FAST2SMS_API_KEY;

  if (!apiKey) {
    return { success: false, reason: 'Fast2SMS API key not configured' };
  }

  try {
    // Clean phone number - remove +91, spaces, dashes
    let cleanNumber = phoneNumber.replace(/\D/g, '');
    // Remove country code if present
    if (cleanNumber.startsWith('91') && cleanNumber.length > 10) {
      cleanNumber = cleanNumber.substring(2);
    }

    // Validate 10-digit Indian number
    if (cleanNumber.length !== 10) {
      return { success: false, reason: 'Invalid Indian phone number. Must be 10 digits.' };
    }

    // Use Quick SMS route (doesn't require website verification)
    // OTP route requires DLT registration, so we use 'q' route for simplicity
    const requestBody = {
      route: 'q', // Quick SMS route - works without verification
      message: message,
      numbers: cleanNumber,
      flash: 0
    };

    const response = await fetch(FAST2SMS_API_URL, {
      method: 'POST',
      headers: {
        'authorization': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    const data = await response.json();

    if (data.return === true || data.status_code === 200) {
      console.log(`✅ SMS sent via Fast2SMS to ${cleanNumber}: ${data.request_id || 'success'}`);
      return { success: true, requestId: data.request_id, provider: 'fast2sms' };
    } else {
      console.error('❌ Fast2SMS error:', data);
      return { success: false, reason: data.message || 'Failed to send SMS via Fast2SMS' };
    }
  } catch (error) {
    console.error('❌ Fast2SMS request failed:', error);
    return { success: false, reason: error.message };
  }
}

// Send SMS via Twilio (International)
async function sendViaTwilio(phoneNumber, message) {
  const client = initializeTwilio();

  if (!client) {
    return { success: false, reason: 'Twilio not configured' };
  }

  const fromNumber = process.env.TWILIO_PHONE_NUMBER;
  if (!fromNumber) {
    return { success: false, reason: 'Twilio phone number not configured' };
  }

  try {
    let formattedNumber = phoneNumber;
    if (!phoneNumber.startsWith('+')) {
      formattedNumber = `+91${phoneNumber.replace(/\D/g, '')}`;
    }

    const response = await client.messages.create({
      body: message,
      from: fromNumber,
      to: formattedNumber
    });

    console.log(`✅ SMS sent via Twilio to ${formattedNumber}: ${response.sid}`);
    return { success: true, sid: response.sid, provider: 'twilio' };
  } catch (error) {
    console.error('❌ Twilio failed:', error);
    return { success: false, reason: error.message };
  }
}

// Main send SMS function - auto-selects provider
async function sendSMS(to, message) {
  const provider = getSMSProvider();

  console.log(`📱 Sending SMS via ${provider} to ${to}`);

  if (provider === 'textbelt') {
    return sendViaTextBelt(to, message);
  } else if (provider === 'fast2sms') {
    return sendViaFast2SMS(to, message);
  } else if (provider === 'twilio') {
    return sendViaTwilio(to, message);
  }

  return { success: false, reason: 'Unknown SMS provider' };
}

// Send OTP via SMS
async function sendOTPSMS(phoneNumber, otp, purpose = 'login') {
  const purposeText = {
    login: 'login',
    phone_verify: 'verify your phone number',
    password_reset: 'reset your password'
  };

  const message = `Your VitalFlow verification code to ${purposeText[purpose] || 'verify'} is: ${otp}. Valid for ${process.env.OTP_EXPIRY_MINUTES || 10} minutes. Do not share this code.`;

  return sendSMS(phoneNumber, message);
}

// Log which provider is active on startup
function initializeSMSService() {
  const provider = getSMSProvider();
  if (provider === 'textbelt') {
    console.log('✅ TextBelt SMS service ready (Free - 1 SMS/day limit)');
  } else if (provider === 'fast2sms') {
    console.log('✅ Fast2SMS service ready (India)');
  } else if (provider === 'twilio') {
    console.log('✅ Twilio SMS service ready (International)');
  }
}

module.exports = {
  sendSMS,
  sendOTPSMS,
  initializeSMSService,
  getSMSProvider
};
