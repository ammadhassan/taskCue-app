// Vercel Serverless Function - OpenAI Task Extraction Proxy
// Forwards task extraction requests to OpenAI API

import axios from 'axios';

export default async function handler(req, res) {
  // Only accept POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('📨 [SERVERLESS] Received extract-tasks request');
    const { prompt } = req.body;

    // Validate prompt
    if (!prompt) {
      console.log('❌ [SERVERLESS] No prompt provided in request');
      return res.status(400).json({ error: 'Prompt is required' });
    }

    // Get API key from environment
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

    if (!OPENAI_API_KEY || OPENAI_API_KEY === 'your_openai_api_key_here') {
      return res.status(500).json({
        error: 'OpenAI API key not configured on server. Get one at: https://platform.openai.com/api-keys'
      });
    }

    console.log('📤 [SERVERLESS] Forwarding request to OpenAI API...');

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

    console.log('📤 [SERVERLESS] Prompt length:', prompt.length, 'characters');

    // Forward request to OpenAI API
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      requestBody,
      {
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000, // 30 second timeout
      }
    );

    console.log('✅ [SERVERLESS] Received response from OpenAI');

    // Transform OpenAI response to legacy format for frontend compatibility
    // OpenAI format: response.data.choices[0].message.content
    // Legacy format: [{ generated_text: "..." }]
    const transformedResponse = [{
      generated_text: response.data.choices[0].message.content
    }];

    // Return transformed response to frontend
    res.status(200).json(transformedResponse);

  } catch (error) {
    console.error('❌ [SERVERLESS] Error:', error.message);

    if (error.response) {
      // OpenAI API error - log full details
      console.error('❌ [SERVERLESS] OpenAI Error Status:', error.response.status);
      console.error('❌ [SERVERLESS] OpenAI Error Data:', JSON.stringify(error.response.data, null, 2));

      // Extract meaningful error message
      let errorMessage = 'OpenAI API error';
      if (error.response.data) {
        if (typeof error.response.data === 'string') {
          errorMessage = error.response.data;
        } else if (error.response.data.error) {
          errorMessage = error.response.data.error.message || error.response.data.error;
        } else if (error.response.data.message) {
          errorMessage = error.response.data.message;
        } else {
          errorMessage = JSON.stringify(error.response.data);
        }
      }

      res.status(error.response.status).json({
        error: `OpenAI API Error (${error.response.status}): ${errorMessage}`
      });
    } else if (error.code === 'ECONNABORTED') {
      // Timeout
      console.error('❌ [SERVERLESS] Request timeout after 30 seconds');
      res.status(504).json({ error: 'Request timeout' });
    } else {
      // Other errors (network, etc.)
      console.error('❌ [SERVERLESS] Unexpected error:', error);
      res.status(500).json({ error: error.message });
    }
  }
}
