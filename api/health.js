// Vercel Serverless Function - Health Check
// Verifies that the backend API is running

export default function handler(req, res) {
  res.status(200).json({
    status: 'ok',
    message: 'TaskCue Backend is running on Vercel Serverless'
  });
}
