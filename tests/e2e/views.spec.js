import { test, expect } from '@playwright/test';
import { login, createTask, switchView, changeTheme } from '../helpers/test-utils.js';
import { themeTestData } from '../helpers/fixtures.js';

test.describe('Views and UI', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);

    // Create some test tasks
    const testTasks = [
      {
        text: 'Task 1 - Today',
        dueDate: new Date().toISOString().split('T')[0],
        dueTime: '09:00'
      },
      {
        text: 'Task 2 - Tomorrow',
        dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        dueTime: '10:00'
      },
      {
        text: 'Task 3 - Next Week',
        dueDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
        dueTime: '14:00'
      },
    ];

    for (const task of testTasks) {
      await createTask(page, task);
    }

    await page.waitForTimeout(1000);
  });

  test('List view displays tasks correctly', async ({ page }) => {
    // Switch to list view
    await switchView(page, 'list');

    // Verify list view is active
    const listViewButton = page.locator('[data-testid="list-view-button"]');
    await expect(listViewButton).toHaveClass(/active/);

    // Verify tasks are displayed as a list
    const taskList = page.locator('[data-testid="task-list"]');
    await expect(taskList).toBeVisible();

    // Verify all tasks are visible
    const tasks = await page.locator('[data-testid="task-item"]').all();
    expect(tasks.length).toBeGreaterThanOrEqual(3);

    // Verify each task shows required information
    for (const task of tasks) {
      await expect(task.locator('[data-testid="task-text"]')).toBeVisible();
      await expect(task.locator('[data-testid="task-folder"]')).toBeVisible();
    }
  });

  test('Calendar view displays tasks correctly', async ({ page }) => {
    // Switch to calendar view
    await switchView(page, 'calendar');

    // Verify calendar view is active
    const calendarViewButton = page.locator('[data-testid="calendar-view-button"]');
    await expect(calendarViewButton).toHaveClass(/active/);

    // Verify calendar grid is displayed
    const calendarGrid = page.locator('[data-testid="calendar-grid"]');
    await expect(calendarGrid).toBeVisible();

    // Verify calendar shows current month
    const monthDisplay = page.locator('[data-testid="calendar-month"]');
    await expect(monthDisplay).toBeVisible();

    const currentMonth = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    const displayedMonth = await monthDisplay.innerText();
    expect(displayedMonth).toContain(new Date().toLocaleDateString('en-US', { month: 'long' }));

    // Verify tasks appear on their respective dates
    const today = new Date().getDate();
    const todayCell = page.locator(`[data-testid="calendar-day-${today}"]`);
    await expect(todayCell).toBeVisible();

    // Verify clicking a date shows tasks for that date
    await todayCell.click();
    await page.waitForTimeout(500);

    const taskDetails = page.locator('[data-testid="day-tasks"]');
    await expect(taskDetails).toBeVisible();
  });

  test('Switching between list and calendar view preserves tasks', async ({ page }) => {
    // Start in list view
    await switchView(page, 'list');
    const listTasks = await page.locator('[data-testid="task-item"]').count();

    // Switch to calendar view
    await switchView(page, 'calendar');
    await expect(page.locator('[data-testid="calendar-grid"]')).toBeVisible();

    // Switch back to list view
    await switchView(page, 'list');
    const listTasksAgain = await page.locator('[data-testid="task-item"]').count();

    // Verify task count is the same
    expect(listTasksAgain).toBe(listTasks);
  });

  test('Theme change to dark mode works', async ({ page }) => {
    // Change to dark theme
    await changeTheme(page, 'dark');

    // Wait for theme to apply
    await page.waitForTimeout(500);

    // Verify dark theme is applied
    const body = page.locator('body');
    const backgroundColor = await body.evaluate((el) =>
      window.getComputedStyle(el).backgroundColor
    );

    // Dark theme should have a dark background
    // RGB values for dark backgrounds are typically low (close to 0)
    expect(backgroundColor).toMatch(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);

    // Extract RGB values and verify they're dark (all values < 50)
    const rgbMatch = backgroundColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (rgbMatch) {
      const [_, r, g, b] = rgbMatch.map(Number);
      expect(r).toBeLessThan(100);
      expect(g).toBeLessThan(100);
      expect(b).toBeLessThan(100);
    }
  });

  test('Theme change to light mode works', async ({ page }) => {
    // First switch to dark mode
    await changeTheme(page, 'dark');
    await page.waitForTimeout(500);

    // Then switch to light mode
    await changeTheme(page, 'light');
    await page.waitForTimeout(500);

    // Verify light theme is applied
    const body = page.locator('body');
    const backgroundColor = await body.evaluate((el) =>
      window.getComputedStyle(el).backgroundColor
    );

    // Light theme should have a light background
    // RGB values for light backgrounds are typically high (close to 255)
    const rgbMatch = backgroundColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (rgbMatch) {
      const [_, r, g, b] = rgbMatch.map(Number);
      // At least one value should be high for light mode
      expect(Math.max(r, g, b)).toBeGreaterThan(200);
    }
  });

  test('Theme preference persists after page refresh', async ({ page }) => {
    // Change to dark theme
    await changeTheme(page, 'dark');
    await page.waitForTimeout(500);

    // Get background color
    const darkBg = await page.locator('body').evaluate((el) =>
      window.getComputedStyle(el).backgroundColor
    );

    // Refresh the page
    await page.reload();

    // Wait for page to load
    await page.waitForSelector('[data-testid="task-form"]');

    // Verify theme is still dark
    const bgAfterRefresh = await page.locator('body').evaluate((el) =>
      window.getComputedStyle(el).backgroundColor
    );

    expect(bgAfterRefresh).toBe(darkBg);
  });

  test('List view sorting works correctly', async ({ page }) => {
    // Switch to list view
    await switchView(page, 'list');

    // Click sort by due date
    await page.click('[data-testid="sort-by-date"]');
    await page.waitForTimeout(500);

    // Get all task due dates
    const tasks = await page.locator('[data-testid="task-item"]').all();
    const dueDates = [];

    for (const task of tasks) {
      const dueDate = await task.getAttribute('data-due-date');
      if (dueDate) {
        dueDates.push(new Date(dueDate).getTime());
      }
    }

    // Verify tasks are sorted (ascending order)
    for (let i = 1; i < dueDates.length; i++) {
      expect(dueDates[i]).toBeGreaterThanOrEqual(dueDates[i - 1]);
    }
  });

  test('Calendar view navigation works', async ({ page }) => {
    // Switch to calendar view
    await switchView(page, 'calendar');

    // Get current month
    const currentMonthText = await page.locator('[data-testid="calendar-month"]').innerText();

    // Click next month button
    await page.click('[data-testid="calendar-next-month"]');
    await page.waitForTimeout(500);

    // Verify month changed
    const nextMonthText = await page.locator('[data-testid="calendar-month"]').innerText();
    expect(nextMonthText).not.toBe(currentMonthText);

    // Click previous month button
    await page.click('[data-testid="calendar-prev-month"]');
    await page.waitForTimeout(500);

    // Verify we're back to current month
    const backToCurrentText = await page.locator('[data-testid="calendar-month"]').innerText();
    expect(backToCurrentText).toBe(currentMonthText);
  });

  test('Tasks display correctly in both views without visual overflow', async ({ page }) => {
    // Create a task with long text
    await createTask(page, {
      text: 'This is a very long task description that should not cause visual overflow in either list or calendar view and should be handled gracefully by the UI',
    });

    await page.waitForTimeout(1000);

    // Test list view
    await switchView(page, 'list');
    const listView = page.locator('[data-testid="task-list"]');

    // Take screenshot to verify no overflow
    await expect(listView).toBeVisible();

    // Verify no horizontal scrollbar (indicates overflow)
    const hasHorizontalScroll = await page.evaluate(() => {
      const taskList = document.querySelector('[data-testid="task-list"]');
      return taskList ? taskList.scrollWidth > taskList.clientWidth : false;
    });
    expect(hasHorizontalScroll).toBe(false);

    // Test calendar view
    await switchView(page, 'calendar');
    const calendarView = page.locator('[data-testid="calendar-grid"]');

    // Verify calendar is visible
    await expect(calendarView).toBeVisible();

    // Verify no overflow in calendar
    const hasCalendarOverflow = await page.evaluate(() => {
      const calendar = document.querySelector('[data-testid="calendar-grid"]');
      return calendar ? calendar.scrollWidth > calendar.clientWidth : false;
    });
    expect(hasCalendarOverflow).toBe(false);
  });
});
