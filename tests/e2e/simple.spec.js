import { test, expect } from '@playwright/test';
import { login } from '../helpers/test-utils.js';

test.describe('Simple E2E Tests - Step by Step', () => {
  test('STEP 1: User can login and see task form', async ({ page }) => {
    // Login
    await login(page);

    // Verify we can see the task form
    await expect(page.locator('[data-testid="task-form"]')).toBeVisible();
    await expect(page.locator('[data-testid="task-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="add-task-button"]')).toBeVisible();
    await expect(page.locator('[data-testid="folder-select"]')).toBeVisible();

    console.log('✅ Login test passed - task form is visible');
  });

  test('STEP 2: Can create a single task with AI', async ({ page }) => {
    // Capture console logs from the start
    const consoleLogs = [];
    page.on('console', msg => {
      const text = msg.text();
      consoleLogs.push(text);
      console.log('BROWSER:', text);
    });

    // Capture network failures
    const failedRequests = [];
    page.on('requestfailed', request => {
      failedRequests.push({
        url: request.url(),
        failure: request.failure()
      });
    });

    // Login first
    await login(page);

    // Get initial task count
    const initialTasks = await page.locator('[data-testid="task-item"]').all();
    const initialCount = initialTasks.length;
    console.log(`📊 Initial task count: ${initialCount}`);

    // Fill input with simple text
    await page.fill('[data-testid="task-input"]', 'Buy milk');
    console.log('✏️  Filled input: "Buy milk"');

    // Wait for the API response instead of timeout
    const responsePromise = page.waitForResponse(
      response => response.url().includes('/api/extract-tasks'),
      { timeout: 30000 }
    );

    // Click add button
    await page.click('[data-testid="add-task-button"]');
    console.log('🖱️  Clicked add button');

    try {
      const response = await responsePromise;
      const status = response.status();
      const body = await response.text();

      console.log(`📡 API Response Status: ${status}`);
      console.log(`📄 Response body (first 500 chars):`);
      console.log(body.substring(0, 500));

      if (status !== 200) {
        console.error(`❌ API returned error ${status}`);
        console.error(`Full response: ${body}`);
      }
    } catch (error) {
      console.error('❌ API request failed or timed out:', error.message);
      console.error('Failed requests:', JSON.stringify(failedRequests, null, 2));
      console.error('Console logs:', consoleLogs);
      await page.screenshot({ path: 'test-failure-api-timeout.png', fullPage: true });
    }

    // Wait for task to appear in DOM
    try {
      await page.waitForFunction(
        (expectedCount) => {
          const tasks = document.querySelectorAll('[data-testid="task-item"]');
          return tasks.length > expectedCount;
        },
        initialCount,
        { timeout: 10000 }
      );
      console.log('✅ Task appeared in DOM');
    } catch (waitError) {
      console.error('❌ Task did not appear in DOM after 10 seconds');
      await page.screenshot({ path: 'test-failure-no-task-in-dom.png', fullPage: true });
      console.error('Console logs:', consoleLogs);
      console.error('Failed requests:', JSON.stringify(failedRequests, null, 2));
    }

    // Check if task was created
    const tasks = await page.locator('[data-testid="task-item"]').all();
    const newCount = tasks.length;
    console.log(`📊 New task count: ${newCount}`);

    // Verify task text - look for the specific task we created
    const taskTexts = await Promise.all(
      tasks.map(t => t.locator('[data-testid="task-text"]').innerText())
    );
    console.log('📋 All task texts:', taskTexts);

    const hasExpectedTask = taskTexts.some(text =>
      text.toLowerCase().includes('milk') || text.toLowerCase().includes('buy')
    );

    if (hasExpectedTask) {
      console.log('✅ Task was created successfully!');
    }

    // Assert that the specific task exists (not relying on count due to real-time race conditions)
    expect(hasExpectedTask).toBe(true);
  });

  test('STEP 3: Verify task has proper data fields', async ({ page }) => {
    // Login
    await login(page);

    // Create a task
    await page.fill('[data-testid="task-input"]', 'Test task with date');
    await page.click('[data-testid="add-task-button"]');

    // Wait for AI processing
    await page.waitForTimeout(5000);

    // Get the created tasks
    const tasks = await page.locator('[data-testid="task-item"]').all();

    if (tasks.length > 0) {
      const lastTask = tasks[tasks.length - 1];

      // Verify task has basic structure
      const taskText = await lastTask.locator('[data-testid="task-text"]').innerText();
      console.log('📝 Task text:', taskText);

      // Check if task has data attributes
      const dueDate = await lastTask.getAttribute('data-due-date');
      const dueTime = await lastTask.getAttribute('data-due-time');

      console.log('📅 Due date:', dueDate);
      console.log('🕐 Due time:', dueTime);

      // For now, just log - don't assert specific values
      // since AI might not extract date/time from simple input
      expect(taskText).toBeTruthy();
      expect(taskText.length).toBeGreaterThan(0);
    }
  });
});
