// Vercel Serverless Function - Email Notifications
// Sends email task reminders via Gmail

const nodemailer = require('nodemailer');

export default async function handler(req, res) {
  // Only accept POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { to, subject, taskDetails } = req.body;

    // Validate required fields
    if (!to || !taskDetails) {
      return res.status(400).json({ error: 'Email and task details are required' });
    }

    // Check if email is configured
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      return res.status(500).json({
        error: 'Email notifications not configured. Add EMAIL_USER and EMAIL_PASSWORD environment variables.'
      });
    }

    // Configure email transporter (using Gmail)
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
    res.status(200).json({ success: true, message: 'Email sent successfully' });

  } catch (error) {
    console.error('❌ [EMAIL] Error:', error.message);
    res.status(500).json({
      error: 'Failed to send email',
      details: error.message
    });
  }
}
