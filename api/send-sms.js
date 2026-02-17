// Vercel Serverless Function - SMS Notifications
// Sends SMS task reminders via Twilio

export default async function handler(req, res) {
  // Only accept POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { to, message } = req.body;

    // Validate required fields
    if (!to || !message) {
      return res.status(400).json({ error: 'Phone number and message are required' });
    }

    // Check if Twilio is configured
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_PHONE_NUMBER) {
      return res.status(500).json({
        error: 'Twilio is not configured. Please add TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER environment variables.'
      });
    }

    // Dynamically import Twilio (only if configured)
    let twilio;
    try {
      twilio = require('twilio');
    } catch (e) {
      return res.status(500).json({
        error: 'Twilio package not installed. Run: npm install twilio'
      });
    }

    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );

    await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: to
    });

    console.log(`✅ [SMS] Sent to ${to}`);
    res.status(200).json({ success: true, message: 'SMS sent successfully' });

  } catch (error) {
    console.error('❌ [SMS] Error:', error.message);
    res.status(500).json({
      error: 'Failed to send SMS',
      details: error.message
    });
  }
}
