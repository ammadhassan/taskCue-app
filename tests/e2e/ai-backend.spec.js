import { test, expect } from '@playwright/test';

test.describe('AI Backend Endpoint', () => {
  test('AI extraction endpoint responds to requests', async ({ request }) => {
    // Test the actual AI extraction endpoint
    const response = await request.post('http://localhost:3001/api/extract-tasks', {
      data: {
        prompt: `Extract tasks from: "Buy milk tomorrow at 3pm"
Default timing: tomorrow_morning
Existing tasks: []
Folders: ["Personal","Work","Shopping"]

Return JSON array of actions.`
      }
    });

    // Log the response for debugging
    console.log('📡 Response status:', response.status());
    const responseText = await response.text();
    console.log('📡 Response body:', responseText);

    // Check if we got a successful response
    if (!response.ok()) {
      try {
        const errorBody = JSON.parse(responseText);
        console.error('❌ Backend error:', errorBody);
      } catch (e) {
        console.error('❌ Non-JSON error:', responseText);
      }
    }

    // Verify we got a 200 OK response
    expect(response.status()).toBe(200);

    // Verify response format (should be HuggingFace format)
    const body = JSON.parse(responseText);
    expect(Array.isArray(body)).toBeTruthy();
    expect(body[0]).toHaveProperty('generated_text');

    console.log('✅ AI extraction test passed');
    console.log('Generated text:', body[0].generated_text.substring(0, 100) + '...');
  });

  test('AI extraction endpoint handles invalid requests', async ({ request }) => {
    // Test with missing prompt
    const response = await request.post('http://localhost:3001/api/extract-tasks', {
      data: {}
    });

    console.log('📡 Invalid request status:', response.status());

    // Should return an error (400 or 500)
    expect(response.ok()).toBeFalsy();
  });
});
