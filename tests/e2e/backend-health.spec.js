import { test, expect } from '@playwright/test';

test.describe('Backend Health Check', () => {
  test('Backend server is responding', async ({ request }) => {
    // Check if backend is running
    const response = await request.get('http://localhost:3001/health');

    // Verify response is OK
    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);

    // Verify response body
    const body = await response.json();
    expect(body.status).toBe('ok');
    expect(body.message).toContain('Backend');

    console.log('✅ Backend health check passed:', body);
  });
});
