const express = require('express');
const cors = require('cors');
const axios = require('axios');
const nodemailer = require('nodemailer');
require('dotenv').config(); // Railway provides env vars directly

const app = express();
const PORT = process.env.PORT || 3001;

// Enable CORS for frontend
const allowedOrigins = [
  'http://localhost:3000',
  process.env.FRONTEND_URL
].filter(Boolean);

console.log('🔧 [SERVER] FRONTEND_URL from env:', process.env.FRONTEND_URL);
console.log('✅ [SERVER] Allowed CORS origins:', allowedOrigins);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('❌ CORS blocked origin:', origin);
      console.log('✅ Allowed origins:', allowedOrigins);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Parse JSON bodies
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Task Assistant Backend is running' });
});

// Proxy endpoint for HuggingFace API
app.post('/api/extract-tasks', async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    // Get API key from server environment
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

    if (!OPENAI_API_KEY || OPENAI_API_KEY === 'your_openai_api_key_here') {
      return res.status(500).json({
        error: 'OpenAI API key not configured on server. Get one at: https://platform.openai.com/api-keys'
      });
    }

    console.log('📤 [SERVER] Forwarding request to OpenAI API...');

    // Prepare request body for OpenAI
    const requestBody = {
      model: 'gpt-4o-mini',  // Cheapest and fastest option
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 2000,
      temperature: 0.3,
    };

    console.log('📤 [SERVER] Request body:', JSON.stringify(requestBody, null, 2));
    console.log('📤 [SERVER] Prompt length:', prompt.length, 'characters');

    // Forward request to OpenAI API
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      requestBody,
      {
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      }
    );

    console.log('✅ [SERVER] Received response from OpenAI');
    console.log('📥 [SERVER] Response data:', JSON.stringify(response.data, null, 2));

    // Transform OpenAI response to HuggingFace legacy format for frontend compatibility
    // OpenAI format: response.data.choices[0].message.content
    // Legacy format: response.data[0].generated_text
    const transformedResponse = [{
      generated_text: response.data.choices[0].message.content
    }];

    // Return transformed response to frontend
    res.json(transformedResponse);

  } catch (error) {
    console.error('❌ [SERVER] Error:', error.message);

    if (error.response) {
      // HuggingFace API error - log full details
      console.error('❌ [SERVER] HuggingFace Error Status:', error.response.status);
      console.error('❌ [SERVER] HuggingFace Error Data:', JSON.stringify(error.response.data, null, 2));
      console.error('❌ [SERVER] HuggingFace Error Headers:', error.response.headers);

      // Extract meaningful error message
      let errorMessage = 'HuggingFace API error';
      if (error.response.data) {
        if (typeof error.response.data === 'string') {
          errorMessage = error.response.data;
        } else if (error.response.data.error) {
          errorMessage = error.response.data.error;
        } else if (error.response.data.message) {
          errorMessage = error.response.data.message;
        } else {
          errorMessage = JSON.stringify(error.response.data);
        }
      }

      res.status(error.response.status).json({
        error: `HuggingFace API Error (${error.response.status}): ${errorMessage}`
      });
    } else if (error.code === 'ECONNABORTED') {
      // Timeout
      console.error('❌ [SERVER] Request timeout after 30 seconds');
      res.status(504).json({ error: 'Request timeout' });
    } else {
      // Other errors (network, etc.)
      console.error('❌ [SERVER] Unexpected error:', error);
      res.status(500).json({ error: error.message });
    }
  }
});

// Email notification endpoint
app.post('/api/send-email', async (req, res) => {
  try {
    const { to, subject, taskDetails } = req.body;

    if (!to || !taskDetails) {
      return res.status(400).json({ error: 'Email and task details are required' });
    }

    // Configure email transporter (using Gmail as example)
    // Users need to configure EMAIL_USER and EMAIL_PASSWORD in .env
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD, // App-specific password for Gmail
      },
    });

    // Email HTML content
    const emailHTML = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">📋 Task Reminder</h2>
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">${taskDetails.task}</h3>
          ${taskDetails.dueDate ? `<p><strong>Due Date:</strong> ${taskDetails.dueDate}</p>` : ''}
          ${taskDetails.dueTime ? `<p><strong>Due Time:</strong> ${taskDetails.dueTime}</p>` : ''}
          ${taskDetails.folder ? `<p><strong>Folder:</strong> ${taskDetails.folder}</p>` : ''}
        </div>
        <p style="color: #6b7280; font-size: 14px;">
          This is an automated reminder from your Task Assistant.
        </p>
      </div>
    `;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: to,
      subject: subject || `Task Reminder: ${taskDetails.task}`,
      html: emailHTML,
    };

    await transporter.sendMail(mailOptions);

    console.log(`✅ [EMAIL] Sent to ${to}`);
    res.json({ success: true, message: 'Email sent successfully' });

  } catch (error) {
    console.error('❌ [EMAIL] Error:', error.message);
    res.status(500).json({
      error: 'Failed to send email',
      details: error.message
    });
  }
});

// SMS notification endpoint (Twilio)
app.post('/api/send-sms', async (req, res) => {
  try {
    const { to, message } = req.body;

    if (!to || !message) {
      return res.status(400).json({ error: 'Phone number and message are required' });
    }

    // Check if Twilio is configured
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_PHONE_NUMBER) {
      return res.status(500).json({
        error: 'Twilio is not configured. Please add TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER to server/.env'
      });
    }

    // Dynamically import Twilio (only if configured)
    let twilio;
    try {
      twilio = require('twilio');
    } catch (e) {
      return res.status(500).json({
        error: 'Twilio package not installed. Run: cd server && npm install twilio'
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
    res.json({ success: true, message: 'SMS sent successfully' });

  } catch (error) {
    console.error('❌ [SMS] Error:', error.message);
    res.status(500).json({
      error: 'Failed to send SMS',
      details: error.message
    });
  }
});

// Start server - bind to 0.0.0.0 to accept external connections (required for Railway)
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 TaskCue Backend running on port ${PORT}`);
  console.log(`🔧 FRONTEND_URL: ${process.env.FRONTEND_URL || 'Not set'}`);
  console.log(`✅ CORS allowed origins:`, allowedOrigins);
  console.log(`📡 Ready to proxy OpenAI API requests`);
});
