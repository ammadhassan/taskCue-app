import { expect } from '@playwright/test';

/**
 * Helper to login to the application
 * @param {Page} page - Playwright page object
 * @param {string} email - User email
 * @param {string} password - User password
 */
export async function login(page, email = 'ammhasun@gmail.com', password = '123456') {
  await page.goto('/');

  // Check if already logged in using proper Playwright pattern
  try {
    await page.locator('[data-testid="task-form"]').waitFor({ state: 'visible', timeout: 1000 });
    return; // Already logged in
  } catch {
    // Not logged in, continue
  }

  // Fill login form
  await page.fill('[data-testid="email-input"]', email);
  await page.fill('[data-testid="password-input"]', password);
  await page.click('[data-testid="login-button"]');

  // Wait for redirect to app
  await page.waitForSelector('[data-testid="task-form"]', { timeout: 10000 });
}

/**
 * Helper to create a task via UI
 * @param {Page} page - Playwright page object
 * @param {Object} taskData - Task data
 */
export async function createTask(page, taskData) {
  const { text, folder, dueDate, dueTime, priority } = taskData;

  // Fill task input
  await page.fill('[data-testid="task-input"]', text);

  if (folder) {
    await page.selectOption('[data-testid="folder-select"]', folder);
  }

  if (dueDate) {
    await page.fill('[data-testid="date-input"]', dueDate);
  }

  if (dueTime) {
    await page.fill('[data-testid="time-input"]', dueTime);
  }

  if (priority) {
    await page.selectOption('[data-testid="priority-select"]', priority);
  }

  // Submit task
  await page.click('[data-testid="add-task-button"]');

  // Wait for task to appear in list
  await page.waitForTimeout(1000);
}

/**
 * Helper to wait for a notification to appear
 * @param {Page} page - Playwright page object
 * @param {number} timeout - Timeout in ms
 */
export async function waitForNotification(page, timeout = 5000) {
  try {
    await page.waitForSelector('[data-testid="notification"]', { timeout });
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Helper to mock the current time
 * @param {Page} page - Playwright page object
 * @param {Date} date - Date to mock
 */
export async function mockTime(page, date) {
  try {
    await page.clock.install({ time: date });
  } catch (e) {
    // Clock already installed, just set time
    await page.clock.setTime(date);
  }
}

/**
 * Helper to get all tasks from the UI
 * @param {Page} page - Playwright page object
 */
export async function getTasks(page) {
  const taskElements = await page.locator('[data-testid="task-item"]').all();
  const tasks = [];

  for (const taskEl of taskElements) {
    let text = '';
    let folder = '';
    let dueDate = null;
    let dueTime = null;

    try {
      text = await taskEl.locator('[data-testid="task-text"]').innerText();
    } catch { /* element not found */ }

    try {
      folder = await taskEl.locator('[data-testid="task-folder"]').innerText();
    } catch { /* element not found */ }

    try {
      dueDate = await taskEl.getAttribute('data-due-date');
    } catch { /* attribute not found */ }

    try {
      dueTime = await taskEl.getAttribute('data-due-time');
    } catch { /* attribute not found */ }

    tasks.push({
      text,
      folder,
      dueDate: dueDate || null,
      dueTime: dueTime || null
    });
  }

  return tasks;
}

/**
 * Helper to verify a task exists with specific properties
 * @param {Page} page - Playwright page object
 * @param {Object} expectedTask - Expected task properties
 */
export async function verifyTaskExists(page, expectedTask) {
  const tasks = await getTasks(page);

  console.log('🔍 Looking for task with:', expectedTask);
  console.log('📋 Current tasks:', tasks.map(t => ({ text: t.text, folder: t.folder })));

  const matchingTask = tasks.find(task => {
    return Object.keys(expectedTask).every(key => {
      if (key === 'text') {
        // Extract meaningful words (ignore common/filler words)
        const stopWords = ['a', 'an', 'the', 'from', 'to', 'at', 'in', 'on', 'up', 'my'];
        const expectedWords = expectedTask[key]
          .toLowerCase()
          .split(/\s+/)
          .filter(word => word.length > 2 && !stopWords.includes(word));

        const actualText = task[key].toLowerCase();

        // Check if at least one key word is present
        // This allows AI to clean up text while still matching the task
        return expectedWords.some(word => actualText.includes(word));
      }
      // Strict match for other properties (especially folder - this is what we're testing!)
      return task[key] === expectedTask[key];
    });
  });

  if (!matchingTask) {
    console.error('❌ No matching task found!');
    console.error('Expected:', expectedTask);
    console.error('Available tasks:', tasks);
  }

  expect(matchingTask).toBeTruthy();
  return matchingTask;
}

/**
 * Helper to verify date/time fields are never empty
 * @param {Page} page - Playwright page object
 */
export async function verifyNoEmptyDateTimeFields(page) {
  const tasks = await getTasks(page);

  for (const task of tasks) {
    expect(task.dueDate).toBeTruthy();
    expect(task.dueTime).toBeTruthy();
    expect(task.dueDate).not.toBe('');
    expect(task.dueTime).not.toBe('');
    expect(task.dueDate).not.toBeNull();
    expect(task.dueTime).not.toBeNull();
    expect(task.dueDate).not.toBeUndefined();
    expect(task.dueTime).not.toBeUndefined();
  }
}

/**
 * Helper to add a folder
 * @param {Page} page - Playwright page object
 * @param {string} folderName - Name of the folder
 */
export async function addFolder(page, folderName) {
  await page.click('[data-testid="add-folder-button"]');
  await page.fill('[data-testid="folder-name-input"]', folderName);
  await page.click('[data-testid="save-folder-button"]');
  await page.waitForTimeout(500);
}

/**
 * Helper to switch view
 * @param {Page} page - Playwright page object
 * @param {string} view - 'list' or 'calendar'
 */
export async function switchView(page, view) {
  await page.click(`[data-testid="${view}-view-button"]`);
  await page.waitForTimeout(500);
}

/**
 * Helper to change theme
 * @param {Page} page - Playwright page object
 * @param {string} theme - 'light' or 'dark'
 */
export async function changeTheme(page, theme) {
  await page.click('[data-testid="settings-button"]');
  await page.selectOption('[data-testid="theme-select"]', theme);
  await page.click('[data-testid="close-settings-button"]');
  await page.waitForTimeout(500);
}

/**
 * Helper to logout
 * @param {Page} page - Playwright page object
 */
export async function logout(page) {
  // Handle the confirmation dialog
  page.once('dialog', async dialog => {
    await dialog.accept();
  });

  await page.click('[data-testid="logout-button"]');

  // Wait for login form to appear (app doesn't change URL, just shows Auth component)
  await page.waitForSelector('[data-testid="login-form"]', { timeout: 5000 });
}

/**
 * Helper to get analytics data
 * @param {Page} page - Playwright page object
 */
export async function getAnalytics(page) {
  await page.click('[data-testid="analytics-button"]');

  const dueToday = await page.locator('[data-testid="due-today-count"]').innerText();
  const overdue = await page.locator('[data-testid="overdue-count"]').innerText();
  const completionRate = await page.locator('[data-testid="completion-rate"]').innerText();

  return {
    dueToday: parseInt(dueToday),
    overdue: parseInt(overdue),
    completionRate: parseFloat(completionRate),
  };
}

/**
 * Helper to clear all tasks directly via Supabase (fast cleanup for tests)
 * @param {Page} page - Playwright page object
 */
export async function clearAllTasks(page) {
  // Execute JavaScript in the browser context to delete all tasks
  await page.evaluate(async () => {
    // Access the Supabase client that's already initialized in the app
    const { supabase } = await import('/src/supabaseClient.js');

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      // Delete all tasks for this user
      await supabase
        .from('tasks')
        .delete()
        .eq('user_id', user.id);

      console.log('✅ All tasks cleared for user:', user.email);
    }
  });

  // Wait for UI to update
  await page.waitForTimeout(500);
}
