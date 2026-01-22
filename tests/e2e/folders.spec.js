import { test, expect } from '@playwright/test';
import { login, addFolder, createTask, verifyTaskExists } from '../helpers/test-utils.js';
import { folderTestData, shoppingTasks, workTasks, personalTasks } from '../helpers/fixtures.js';

test.describe('Folder Management', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('Add folder creates new folder', async ({ page }) => {
    // Click add folder button
    await page.click('[data-testid="add-folder-button"]');

    // Enter folder name
    await page.fill('[data-testid="folder-name-input"]', 'Projects');

    // Save folder
    await page.click('[data-testid="save-folder-button"]');

    // Wait for folder to be created
    await page.waitForTimeout(1000);

    // Verify folder appears in folder list
    const folderList = await page.locator('[data-testid="folder-list"]').innerText();
    expect(folderList).toContain('Projects');

    // Verify folder can be selected for new tasks
    const folderSelect = page.locator('[data-testid="folder-select"]');
    const options = await folderSelect.locator('option').allTextContents();
    expect(options).toContain('Projects');
  });

  test('Multiple folders can be created', async ({ page }) => {
    for (const folder of folderTestData) {
      await addFolder(page, folder.name);
    }

    // Verify all folders appear in folder list
    const folderList = await page.locator('[data-testid="folder-list"]').innerText();

    for (const folder of folderTestData) {
      expect(folderList).toContain(folder.name);
    }

    // Verify all folders available in select dropdown
    const folderSelect = page.locator('[data-testid="folder-select"]');
    const options = await folderSelect.locator('option').allTextContents();

    for (const folder of folderTestData) {
      expect(options).toContain(folder.name);
    }
  });

  test('Tasks can be manually assigned to custom folders', async ({ page }) => {
    // Create a custom folder
    await addFolder(page, 'Important');

    // Create a task and manually assign it to the folder
    await createTask(page, {
      text: 'Review quarterly goals',
      folder: 'Important',
    });

    // Verify task was assigned to the correct folder
    await verifyTaskExists(page, {
      text: 'Review quarterly goals',
      folder: 'Important',
    });
  });

  test('Shopping keywords auto-categorize to Shopping folder', async ({ page }) => {
    // Create multiple shopping tasks
    for (const task of shoppingTasks.slice(0, 3)) {
      await createTask(page, { text: task.text });

      // Verify task was auto-categorized
      await verifyTaskExists(page, {
        text: task.text,
        folder: 'Shopping',
      });
    }
  });

  test('Work keywords auto-categorize to Work folder', async ({ page }) => {
    // Create multiple work tasks
    for (const task of workTasks.slice(0, 3)) {
      await createTask(page, { text: task.text });

      // Verify task was auto-categorized
      await verifyTaskExists(page, {
        text: task.text,
        folder: 'Work',
      });
    }
  });

  test('Personal keywords auto-categorize to Personal folder', async ({ page }) => {
    // Create multiple personal tasks
    for (const task of personalTasks.slice(0, 3)) {
      await createTask(page, { text: task.text });

      // Verify task was auto-categorized
      await verifyTaskExists(page, {
        text: task.text,
        folder: 'Personal',
      });
    }
  });

  test('Folder filtering works correctly', async ({ page }) => {
    // Create tasks in different folders
    await createTask(page, { text: 'Buy groceries' });
    await createTask(page, { text: 'Email client' });
    await createTask(page, { text: 'Doctor appointment' });

    // Filter by Shopping folder
    await page.click('[data-testid="filter-shopping"]');
    await page.waitForTimeout(500);

    // Verify only shopping tasks are visible
    const shoppingTasks = await page.locator('[data-testid="task-item"]').all();
    expect(shoppingTasks.length).toBeGreaterThan(0);

    for (const task of shoppingTasks) {
      const folder = await task.locator('[data-testid="task-folder"]').innerText();
      expect(folder).toBe('Shopping');
    }

    // Filter by Work folder
    await page.click('[data-testid="filter-work"]');
    await page.waitForTimeout(500);

    // Verify only work tasks are visible
    const workTasksVisible = await page.locator('[data-testid="task-item"]').all();
    expect(workTasksVisible.length).toBeGreaterThan(0);

    for (const task of workTasksVisible) {
      const folder = await task.locator('[data-testid="task-folder"]').innerText();
      expect(folder).toBe('Work');
    }
  });

  test('Folder persists after page refresh', async ({ page }) => {
    // Create a custom folder
    await addFolder(page, 'TestFolder');

    // Refresh the page
    await page.reload();

    // Wait for page to load
    await page.waitForSelector('[data-testid="task-form"]');

    // Verify folder still exists
    const folderSelect = page.locator('[data-testid="folder-select"]');
    const options = await folderSelect.locator('option').allTextContents();
    expect(options).toContain('TestFolder');
  });

  test('Tasks with ambiguous keywords default to appropriate folder', async ({ page }) => {
    // Test tasks that could go to multiple folders
    const ambiguousTasks = [
      { input: 'Buy office supplies', expectedFolder: 'Shopping' }, // 'buy' keyword
      { input: 'Schedule work lunch', expectedFolder: 'Work' }, // 'work' keyword
      { input: 'Personal finance review', expectedFolder: 'Personal' }, // 'personal' keyword
    ];

    for (const task of ambiguousTasks) {
      await createTask(page, { text: task.input });

      // Verify task was categorized
      await verifyTaskExists(page, {
        text: task.input,
        folder: task.expectedFolder,
      });
    }
  });
});
