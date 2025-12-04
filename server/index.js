const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config({ path: './server/.env' });

const app = express();
const PORT = process.env.PORT || 3001;

// Enable CORS for frontend
app.use(cors({
  origin: 'http://localhost:3000',
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

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Task Assistant Backend running on http://localhost:${PORT}`);
  console.log(`✅ CORS enabled for http://localhost:3000`);
  console.log(`📡 Ready to proxy HuggingFace API requests`);
});
