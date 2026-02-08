import { expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://edadytvzscxwjtfnhmtz.supabase.co';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVkYWR5dHZ6c2N4d2p0Zm5obXR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc0MzQwNzEsImV4cCI6MjA4MzAxMDA3MX0.UVAla1hVpm-AAbMVvrTlRC3v5GkuU-PofsCmVI_YoJY';
const TEST_EMAIL = 'ammhasun@gmail.com';
const TEST_PASSWORD = '123456';

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

  // Retry logic for rate limit errors
  let retries = 3;
  while (retries > 0) {
    try {
      await page.waitForSelector('[data-testid="task-form"]', { timeout: 10000 });
      return; // Success
    } catch (error) {
      // Check if rate limit error is visible
      const rateLimitMsg = await page.locator('text=Request rate limit reached').count();

      if (rateLimitMsg > 0 && retries > 1) {
        const delay = (4 - retries) * 2000; // 2s, 4s
        console.log(`⚠️  Rate limit hit. Waiting ${delay}ms before retry...`);
        await page.waitForTimeout(delay);
        await page.click('[data-testid="login-button"]'); // Retry login
        retries--;
      } else {
        throw error; // Give up or different error
      }
    }
  }
}

/**
 * Helper to create a task directly in the database (bypassing UI and AI)
 * @param {BrowserContext} context - Playwright browser context
 * @param {Object} taskData - Task data
 */
export async function createTaskDirectly(context, taskData) {
  const { text, folder = 'Personal', dueDate, dueTime, priority = 'medium' } = taskData;

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  // Sign in
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
  });

  if (authError) {
    throw new Error(`Failed to sign in: ${authError.message}`);
  }

  // Create task directly
  const { data, error } = await supabase
    .from('tasks')
    .insert([{
      user_id: authData.user.id,
      text,
      folder,
      due_date: dueDate,
      due_time: dueTime,
      priority,
      completed: false,
    }])
    .select();

  if (error) {
    throw new Error(`Failed to create task: ${error.message}`);
  }

  await supabase.auth.signOut();

  return data[0];
}

/**
 * Helper to create a task via UI
 * @param {Page} page - Playwright page object
 * @param {Object} taskData - Task data
 */
export async function createTask(page, taskData) {
  const { text, folder, dueDate, dueTime, priority } = taskData;

  // Set up console listener BEFORE creating task
  // This waits for React to finish processing and scheduling notifications
  const schedulingComplete = new Promise((resolve) => {
    const listener = (msg) => {
      const msgText = msg.text();

      // Debug: Show what AI extracted and scheduling details
      if (msgText.includes('Raw AI response:') ||
          msgText.includes('[SCHEDULE]') ||
          msgText.includes('Task created successfully:')) {
        console.log(`[DEBUG] ${msgText}`);
      }

      // Wait for the specific log that confirms scheduling completed
      // The useEffect logs "✅ [APP] Scheduled N notification(s)" when done
      if (msgText.includes('[APP] Scheduled') && msgText.includes('notification')) {
        page.off('console', listener); // Remove listener
        resolve(true);
      }
    };
    page.on('console', listener);
  });

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

  // Monitor API call to extract-tasks
  const responsePromise = page.waitForResponse(
    response => response.url().includes('/api/extract-tasks') && response.request().method() === 'POST',
    { timeout: 35000 }
  );

  // Submit task
  await page.click('[data-testid="add-task-button"]');

  // Wait for API response and validate
  let response;
  try {
    response = await responsePromise;
  } catch (error) {
    throw new Error(
      `❌ API TIMEOUT: /api/extract-tasks did not respond within 35 seconds.\n` +
      `This is likely an OpenAI API rate limit or network issue, NOT a test failure.\n` +
      `Check: 1) Backend server logs, 2) OpenAI API status, 3) OPENAI_API_KEY in server/.env`
    );
  }

  const status = response.status();

  if (status !== 200) {
    const body = await response.text().catch(() => 'Unable to read response body');
    throw new Error(
      `❌ API ERROR: /api/extract-tasks returned status ${status}.\n` +
      `Response: ${body}\n` +
      `This is an API/backend issue, NOT a test failure.\n` +
      `Check: 1) Backend server logs, 2) OpenAI API key validity, 3) Rate limits`
    );
  }

  // Validate response body
  let responseBody;
  try {
    responseBody = await response.json();
    if (!responseBody || !Array.isArray(responseBody)) {
      throw new Error(
        `❌ API INVALID RESPONSE: /api/extract-tasks returned invalid format.\n` +
        `Response: ${JSON.stringify(responseBody)}\n` +
        `This is an API/backend issue, NOT a test failure.`
      );
    }

    // Check if API returned empty array (AI extracted no tasks)
    if (responseBody.length === 0 || !responseBody[0].generated_text) {
      throw new Error(
        `❌ AI EXTRACTION FAILED: OpenAI returned no tasks.\n` +
        `Input: "${text}"\n` +
        `Response: ${JSON.stringify(responseBody)}\n` +
        `This happens after many API calls - OpenAI may be degrading quality or rate-limiting.\n` +
        `This is NOT a test bug - it's an AI model issue. Consider: 1) Retry, 2) Skip test, 3) Improve prompt.`
      );
    }

    // Parse the generated_text to check if it contains empty array
    const generatedText = responseBody[0].generated_text;
    // Check if the generated text contains an empty JSON array
    if (generatedText.includes('[]') || generatedText.trim() === '[]') {
      throw new Error(
        `❌ AI EXTRACTED ZERO TASKS: OpenAI processed the input but found no tasks to create.\n` +
        `Input: "${text}"\n` +
        `AI Response: ${generatedText}\n` +
        `This happens after many API calls in test suites - AI model quality degrades.\n` +
        `NOT a test bug - Skip this test or reduce number of API calls before it.`
      );
    }
  } catch (parseError) {
    // If it's already our custom error, re-throw it
    if (parseError.message.includes('❌')) {
      throw parseError;
    }
    throw new Error(
      `❌ API INVALID RESPONSE: Could not parse JSON from /api/extract-tasks.\n` +
      `Error: ${parseError.message}\n` +
      `This is an API/backend issue, NOT a test failure.`
    );
  }

  // VALIDATION: For single-task inputs, verify no duplicate create actions
  const generatedText = responseBody[0].generated_text;

  try {
    // Extract JSON array from response (same logic as frontend)
    const cleanedText = generatedText.replace(/```json\s*/g, '').replace(/```\s*/g, '');
    const jsonMatch = cleanedText.match(/\[[\s\S]*\]/);

    if (jsonMatch) {
      const actions = JSON.parse(jsonMatch[0]);

      // Count create actions
      const createActions = actions.filter(a => a.action === 'create');

      // For single-task test inputs, we expect exactly 1 create action
      const isBulkInput = /\b(all|every|each)\b/i.test(text);

      if (!isBulkInput && createActions.length > 1) {
        // Check if they're duplicates (same task text)
        const taskTexts = createActions.map(a => (a.task || '').toLowerCase().trim());
        const uniqueTexts = new Set(taskTexts);

        if (uniqueTexts.size < createActions.length) {
          console.log(
            `⚠️ AI RETURNED DUPLICATE TASKS: Got ${createActions.length} duplicates for input "${text}". ` +
            `Frontend deduplication will handle this.`
          );
          console.log(`⚠️ Duplicate actions:`, createActions);
        }
      }
    }
  } catch (validationError) {
    // Log warning if validation fails (e.g., JSON parse error)
    console.log('⚠️ Could not validate action count:', validationError.message);
  }

  // API succeeded, now wait for button to re-enable (indicates processing complete)
  await page.waitForSelector('[data-testid="add-task-button"]:not([disabled])', { timeout: 10000 });

  // CRITICAL: Wait for React to finish processing and schedule notification
  // The button re-enables before scheduleNotification() completes because addTask() is async
  // We listen for the console log that confirms scheduling decision was made
  await Promise.race([
    schedulingComplete,
    page.waitForTimeout(10000).then(() => {
      console.log('[TEST] Timeout waiting for scheduling confirmation - proceeding anyway');
      return true;
    })
  ]);
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

  // Wait for folder to actually appear in the folder list (real-time update)
  await page.waitForFunction(
    (name) => {
      const folderList = document.querySelector('[data-testid="folder-list"]');
      return folderList && folderList.innerText.includes(name);
    },
    folderName,
    { timeout: 10000 }
  );

  // Also wait for it to appear in the folder select dropdown
  await page.waitForFunction(
    (name) => {
      const folderSelect = document.querySelector('[data-testid="folder-select"]');
      if (!folderSelect) return false;
      const options = Array.from(folderSelect.querySelectorAll('option'));
      return options.some(opt => opt.textContent.trim() === name);
    },
    folderName,
    { timeout: 10000 }
  );

  // Small stabilization delay
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

  // Click save and wait for Supabase PATCH request to complete
  await Promise.all([
    page.waitForResponse(
      response => response.url().includes('/rest/v1/settings') && response.request().method() === 'PATCH',
      { timeout: 10000 }
    ),
    page.click('[data-testid="save-settings-button"]')
  ]);

  // Wait for modal to close
  await page.waitForSelector('[data-testid="close-settings-button"]', { state: 'hidden', timeout: 5000 });
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
  // Analytics are already visible on dashboard - no button click needed

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

  // Wait for UI to update - check that no tasks are visible
  // Real-time subscription should update UI automatically
  await page.waitForFunction(
    () => {
      const tasks = document.querySelectorAll('[data-testid="task-item"]');
      return tasks.length === 0;
    },
    { timeout: 5000 }
  );

  // Give UI a moment to stabilize after deletion
  await page.waitForTimeout(500);
}

/**
 * Clear all tasks for test user (Node.js context, not browser)
 * This works where page.evaluate() fails due to webpack bundling
 * @returns {Promise<void>}
 */
export async function clearAllTasksNodeContext() {
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  // Sign in
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
  });

  if (authError) {
    console.log('⚠️  Could not sign in to clear tasks:', authError.message);
    return;
  }

  // Delete all tasks
  await supabase
    .from('tasks')
    .delete()
    .eq('user_id', authData.user.id);

  // Sign out
  await supabase.auth.signOut();
}
