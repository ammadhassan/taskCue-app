import { test, expect } from '@playwright/test';
import { login, logout, createTask } from '../helpers/test-utils.js';

test.describe('Authentication', () => {
  test('Logout works properly', async ({ page }) => {
    // Login first
    await login(page);

    // Verify we're logged in (task form is visible)
    await expect(page.locator('[data-testid="task-form"]')).toBeVisible();

    // Create a task to verify we're in the app
    await createTask(page, { text: 'Test task before logout' });
    await page.waitForTimeout(1000);

    // Verify task is visible (use .first() to avoid strict mode violation)
    await expect(page.locator('[data-testid="task-item"]').first()).toBeVisible();

    // Click logout button
    await logout(page);

    // Verify redirected to login page
    await expect(page).toHaveURL(/.*login.*/);

    // Verify task form is not accessible
    await expect(page.locator('[data-testid="task-form"]')).not.toBeVisible();

    // Verify login form is visible
    await expect(page.locator('[data-testid="login-form"]')).toBeVisible();
  });

  test('Cannot access app without login', async ({ page }) => {
    // Try to access the app directly
    await page.goto('/');

    // Should be redirected to login
    await page.waitForTimeout(1000);

    // Verify login form is visible
    const isLoginVisible =
      (await page.locator('[data-testid="login-form"]').isVisible()) ||
      (await page.locator('[data-testid="email-input"]').isVisible());

    expect(isLoginVisible).toBe(true);

    // Verify task form is not accessible
    const isTaskFormVisible = await page
      .locator('[data-testid="task-form"]')
      .isVisible()
      .catch(() => false);
    expect(isTaskFormVisible).toBe(false);
  });

  test('Session persists after page refresh', async ({ page }) => {
    // Login
    await login(page);

    // Create a task
    await createTask(page, { text: 'Task to persist' });
    await page.waitForTimeout(1000);

    // Verify task exists
    let tasks = await page.locator('[data-testid="task-item"]').all();
    const initialTaskCount = tasks.length;
    expect(initialTaskCount).toBeGreaterThan(0);

    // Refresh the page
    await page.reload();

    // Wait for page to load
    await page.waitForSelector('[data-testid="task-form"]');

    // Verify still logged in (task form is visible)
    await expect(page.locator('[data-testid="task-form"]')).toBeVisible();

    // Verify tasks are still visible
    tasks = await page.locator('[data-testid="task-item"]').all();
    expect(tasks.length).toBe(initialTaskCount);

    // Verify our task is still there
    const taskTexts = await Promise.all(
      tasks.map((task) => task.locator('[data-testid="task-text"]').innerText())
    );
    expect(taskTexts.some((text) => text.includes('Task to persist'))).toBe(true);
  });

  test('Session persists across browser tabs', async ({ page, context }) => {
    // Login in the first tab
    await login(page);

    // Create a task
    await createTask(page, { text: 'Task from first tab' });
    await page.waitForTimeout(1000);

    // Open a new tab
    const newTab = await context.newPage();
    await newTab.goto('/');

    // Wait for page to load
    await newTab.waitForSelector('[data-testid="task-form"]', { timeout: 10000 });

    // Verify we're automatically logged in (session is shared)
    await expect(newTab.locator('[data-testid="task-form"]')).toBeVisible();

    // Verify the task created in the first tab is visible in the new tab
    const tasksInNewTab = await newTab.locator('[data-testid="task-item"]').all();
    const taskTexts = await Promise.all(
      tasksInNewTab.map((task) => task.locator('[data-testid="task-text"]').innerText())
    );

    expect(taskTexts.some((text) => text.includes('Task from first tab'))).toBe(true);

    await newTab.close();
  });

  test('Logout clears all data from UI', async ({ page }) => {
    // Login and create tasks
    await login(page);

    await createTask(page, { text: 'Task 1' });
    await createTask(page, { text: 'Task 2' });
    await createTask(page, { text: 'Task 3' });
    await page.waitForTimeout(2000);

    // Verify tasks are visible
    let tasks = await page.locator('[data-testid="task-item"]').all();
    expect(tasks.length).toBeGreaterThanOrEqual(3);

    // Logout
    await logout(page);

    // Verify we're on login page
    await expect(page).toHaveURL(/.*login.*/);

    // Try to go back to app
    await page.goto('/');

    // Should still be on login page or redirected to login
    await page.waitForTimeout(1000);

    // Verify tasks are not visible
    const isTaskVisible = await page
      .locator('[data-testid="task-item"]')
      .isVisible()
      .catch(() => false);
    expect(isTaskVisible).toBe(false);
  });

  test('Login with invalid credentials fails', async ({ page }) => {
    await page.goto('/');

    // Try to login with invalid credentials
    await page.fill('[data-testid="email-input"]', 'invalid@example.com');
    await page.fill('[data-testid="password-input"]', 'wrongpassword');
    await page.click('[data-testid="login-button"]');

    // Wait for error message
    await page.waitForTimeout(2000);

    // Verify error message is displayed
    const errorMessage = page.locator('[data-testid="login-error"]');
    await expect(errorMessage).toBeVisible();

    // Verify we're still on login page
    await expect(page.locator('[data-testid="login-form"]')).toBeVisible();

    // Verify we can't access the app
    const isTaskFormVisible = await page
      .locator('[data-testid="task-form"]')
      .isVisible()
      .catch(() => false);
    expect(isTaskFormVisible).toBe(false);
  });

  test('Session expires after logout and requires re-login', async ({ page }) => {
    // Login
    await login(page);

    // Verify logged in
    await expect(page.locator('[data-testid="task-form"]')).toBeVisible();

    // Logout
    await logout(page);

    // Try to access app again
    await page.goto('/');
    await page.waitForTimeout(1000);

    // Should require login
    const isLoginVisible =
      (await page.locator('[data-testid="login-form"]').isVisible()) ||
      (await page.locator('[data-testid="email-input"]').isVisible());
    expect(isLoginVisible).toBe(true);

    // Login again
    await login(page);

    // Verify we can access the app again
    await expect(page.locator('[data-testid="task-form"]')).toBeVisible();
  });

  test('User settings persist after logout and re-login', async ({ page }) => {
    // Login
    await login(page);

    // Change theme to dark
    await page.click('[data-testid="settings-button"]');
    await page.selectOption('[data-testid="theme-select"]', 'dark');
    await page.click('[data-testid="close-settings-button"]');

    await page.waitForTimeout(500);

    // Get current theme
    const darkBg = await page.locator('body').evaluate((el) =>
      window.getComputedStyle(el).backgroundColor
    );

    // Logout
    await logout(page);

    // Login again
    await login(page);

    // Verify theme is still dark
    const bgAfterRelogin = await page.locator('body').evaluate((el) =>
      window.getComputedStyle(el).backgroundColor
    );

    expect(bgAfterRelogin).toBe(darkBg);
  });

  test('Tasks persist across logout and re-login', async ({ page }) => {
    // Login
    await login(page);

    // Create a unique task
    const uniqueTaskText = `Unique task ${Date.now()}`;
    await createTask(page, { text: uniqueTaskText });
    await page.waitForTimeout(1000);

    // Verify task exists
    await expect(page.locator('[data-testid="task-item"]')
      .filter({ hasText: uniqueTaskText })).toBeVisible();

    // Logout
    await logout(page);

    // Login again
    await login(page);

    // Verify task still exists
    await expect(page.locator('[data-testid="task-item"]')
      .filter({ hasText: uniqueTaskText })).toBeVisible();
  });

  test('Multiple login attempts with wrong credentials are handled', async ({ page }) => {
    await page.goto('/');

    // Try to login multiple times with wrong credentials
    for (let i = 0; i < 3; i++) {
      await page.fill('[data-testid="email-input"]', 'wrong@example.com');
      await page.fill('[data-testid="password-input"]', 'wrongpassword');
      await page.click('[data-testid="login-button"]');
      await page.waitForTimeout(2000);

      // Verify error message
      const errorMessage = page.locator('[data-testid="login-error"]');
      await expect(errorMessage).toBeVisible();
    }

    // Verify we're still on login page
    await expect(page.locator('[data-testid="login-form"]')).toBeVisible();

    // Now try with correct credentials
    await login(page);

    // Verify we can access the app
    await expect(page.locator('[data-testid="task-form"]')).toBeVisible();
  });
});
