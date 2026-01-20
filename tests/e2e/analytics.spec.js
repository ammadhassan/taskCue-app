import { test, expect } from '@playwright/test';
import { login, createTask, getAnalytics } from '../helpers/test-utils.js';

test.describe('Analytics and Statistics', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('Weekly activity chart shows correct data', async ({ page }) => {
    // Create tasks completed on different days this week
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const twoDaysAgo = new Date(today);
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    // Create and complete tasks for different days
    await createTask(page, {
      text: 'Task completed today 1',
      dueDate: today.toISOString().split('T')[0],
    });
    await page.locator('[data-testid="task-checkbox"]')
      .filter({ hasText: 'Task completed today 1' })
      .click();
    await page.waitForTimeout(500);

    await createTask(page, {
      text: 'Task completed today 2',
      dueDate: today.toISOString().split('T')[0],
    });
    await page.locator('[data-testid="task-checkbox"]')
      .filter({ hasText: 'Task completed today 2' })
      .click();
    await page.waitForTimeout(500);

    await createTask(page, {
      text: 'Task completed yesterday',
      dueDate: yesterday.toISOString().split('T')[0],
    });
    await page.locator('[data-testid="task-checkbox"]')
      .filter({ hasText: 'Task completed yesterday' })
      .click();
    await page.waitForTimeout(500);

    // Navigate to analytics
    await page.click('[data-testid="analytics-button"]');
    await page.waitForTimeout(1000);

    // Verify weekly activity chart exists
    const weeklyChart = page.locator('[data-testid="weekly-activity-chart"]');
    await expect(weeklyChart).toBeVisible();

    // Verify chart shows data for today and yesterday
    const chartBars = await weeklyChart.locator('.recharts-bar-rectangle').all();
    expect(chartBars.length).toBeGreaterThan(0);

    // Verify today's bar shows 2 tasks
    const todayBar = await weeklyChart
      .locator(`[data-testid="chart-bar-${today.getDay()}"]`)
      .getAttribute('data-value');
    expect(parseInt(todayBar || '0')).toBeGreaterThanOrEqual(2);
  });

  test('Priority distribution shows correct percentages', async ({ page }) => {
    // Create tasks with specific priority distribution
    // 2 high, 5 medium, 3 low = 10 total
    // Expected: 20% high, 50% medium, 30% low

    const priorities = [
      { priority: 'High', count: 2 },
      { priority: 'Medium', count: 5 },
      { priority: 'Low', count: 3 },
    ];

    for (const { priority, count } of priorities) {
      for (let i = 0; i < count; i++) {
        await createTask(page, {
          text: `${priority} priority task ${i + 1}`,
          priority,
        });
        await page.waitForTimeout(500);
      }
    }

    // Navigate to analytics
    await page.click('[data-testid="analytics-button"]');
    await page.waitForTimeout(1000);

    // Verify priority distribution chart exists
    const priorityChart = page.locator('[data-testid="priority-distribution-chart"]');
    await expect(priorityChart).toBeVisible();

    // Get the percentages displayed
    const highPercentage = await page
      .locator('[data-testid="priority-high-percentage"]')
      .innerText();
    const mediumPercentage = await page
      .locator('[data-testid="priority-medium-percentage"]')
      .innerText();
    const lowPercentage = await page
      .locator('[data-testid="priority-low-percentage"]')
      .innerText();

    // Verify percentages are correct (allowing for rounding)
    expect(parseFloat(highPercentage)).toBeCloseTo(20, 0);
    expect(parseFloat(mediumPercentage)).toBeCloseTo(50, 0);
    expect(parseFloat(lowPercentage)).toBeCloseTo(30, 0);
  });

  test('Due Today count is accurate', async ({ page }) => {
    const today = new Date().toISOString().split('T')[0];

    // Create 3 tasks due today
    await createTask(page, { text: 'Task 1 due today', dueDate: today });
    await createTask(page, { text: 'Task 2 due today', dueDate: today });
    await createTask(page, { text: 'Task 3 due today', dueDate: today });

    await page.waitForTimeout(1000);

    // Create 2 tasks due tomorrow (should not be counted)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    await createTask(page, { text: 'Task due tomorrow 1', dueDate: tomorrowStr });
    await createTask(page, { text: 'Task due tomorrow 2', dueDate: tomorrowStr });

    await page.waitForTimeout(1000);

    // Get analytics data
    const analytics = await getAnalytics(page);

    // Verify Due Today count shows 3
    expect(analytics.dueToday).toBe(3);
  });

  test('Overdue count is accurate', async ({ page }) => {
    const today = new Date();

    // Create 2 tasks due yesterday (overdue)
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    await createTask(page, { text: 'Overdue task 1', dueDate: yesterdayStr });
    await createTask(page, { text: 'Overdue task 2', dueDate: yesterdayStr });

    await page.waitForTimeout(1000);

    // Create 3 tasks due today (not overdue)
    const todayStr = today.toISOString().split('T')[0];
    await createTask(page, { text: 'Task due today', dueDate: todayStr });
    await createTask(page, { text: 'Another task today', dueDate: todayStr });
    await createTask(page, { text: 'Third task today', dueDate: todayStr });

    await page.waitForTimeout(1000);

    // Get analytics data
    const analytics = await getAnalytics(page);

    // Verify Overdue count shows 2
    expect(analytics.overdue).toBe(2);
  });

  test('Completion rate calculates correctly', async ({ page }) => {
    // Create 10 tasks
    for (let i = 1; i <= 10; i++) {
      await createTask(page, { text: `Task ${i}` });
      await page.waitForTimeout(500);
    }

    // Complete 7 tasks (70%)
    const tasks = await page.locator('[data-testid="task-checkbox"]').all();
    for (let i = 0; i < 7; i++) {
      await tasks[i].click();
      await page.waitForTimeout(300);
    }

    // Get analytics data
    const analytics = await getAnalytics(page);

    // Verify completion rate is 70% (allowing for rounding)
    expect(analytics.completionRate).toBeCloseTo(70, 0);
  });

  test('Charts display without visual overflow', async ({ page }) => {
    // Create enough data to populate all charts
    const today = new Date();

    // Create tasks with various priorities
    for (let i = 0; i < 5; i++) {
      await createTask(page, {
        text: `High priority task ${i}`,
        priority: 'High',
        dueDate: today.toISOString().split('T')[0],
      });
    }

    for (let i = 0; i < 10; i++) {
      await createTask(page, {
        text: `Medium priority task ${i}`,
        priority: 'Medium',
        dueDate: today.toISOString().split('T')[0],
      });
    }

    for (let i = 0; i < 5; i++) {
      await createTask(page, {
        text: `Low priority task ${i}`,
        priority: 'Low',
        dueDate: today.toISOString().split('T')[0],
      });
    }

    await page.waitForTimeout(2000);

    // Complete some tasks
    const tasks = await page.locator('[data-testid="task-checkbox"]').all();
    for (let i = 0; i < 10; i++) {
      await tasks[i].click();
      await page.waitForTimeout(200);
    }

    // Navigate to analytics
    await page.click('[data-testid="analytics-button"]');
    await page.waitForTimeout(1000);

    // Check weekly activity chart for overflow
    const weeklyChart = page.locator('[data-testid="weekly-activity-chart"]');
    await expect(weeklyChart).toBeVisible();

    const weeklyOverflow = await weeklyChart.evaluate((el) => {
      return el.scrollWidth > el.clientWidth || el.scrollHeight > el.clientHeight;
    });
    expect(weeklyOverflow).toBe(false);

    // Check priority distribution chart for overflow
    const priorityChart = page.locator('[data-testid="priority-distribution-chart"]');
    await expect(priorityChart).toBeVisible();

    const priorityOverflow = await priorityChart.evaluate((el) => {
      return el.scrollWidth > el.clientWidth || el.scrollHeight > el.clientHeight;
    });
    expect(priorityOverflow).toBe(false);

    // Verify the entire analytics panel has no overflow
    const analyticsPanel = page.locator('[data-testid="analytics-panel"]');
    const panelOverflow = await analyticsPanel.evaluate((el) => {
      return el.scrollWidth > el.clientWidth;
    });
    expect(panelOverflow).toBe(false);
  });

  test('Analytics update in real-time when tasks change', async ({ page }) => {
    // Navigate to analytics
    await page.click('[data-testid="analytics-button"]');
    await page.waitForTimeout(1000);

    // Get initial due today count
    const initialDueToday = await page
      .locator('[data-testid="due-today-count"]')
      .innerText();

    // Close analytics and create a new task
    await page.click('[data-testid="close-analytics"]');
    const today = new Date().toISOString().split('T')[0];
    await createTask(page, { text: 'New task', dueDate: today });
    await page.waitForTimeout(1000);

    // Open analytics again
    await page.click('[data-testid="analytics-button"]');
    await page.waitForTimeout(1000);

    // Get updated due today count
    const updatedDueToday = await page
      .locator('[data-testid="due-today-count"]')
      .innerText();

    // Verify count increased by 1
    expect(parseInt(updatedDueToday)).toBe(parseInt(initialDueToday) + 1);
  });

  test('Analytics show zero state when no tasks exist', async ({ page }) => {
    // Note: Assuming this is a fresh login with no tasks
    // Or delete all tasks first

    // Navigate to analytics
    await page.click('[data-testid="analytics-button"]');
    await page.waitForTimeout(1000);

    // Verify due today is 0
    const dueToday = await page.locator('[data-testid="due-today-count"]').innerText();
    expect(parseInt(dueToday)).toBe(0);

    // Verify overdue is 0
    const overdue = await page.locator('[data-testid="overdue-count"]').innerText();
    expect(parseInt(overdue)).toBe(0);

    // Verify charts handle empty state gracefully
    const weeklyChart = page.locator('[data-testid="weekly-activity-chart"]');
    await expect(weeklyChart).toBeVisible();

    const priorityChart = page.locator('[data-testid="priority-distribution-chart"]');
    await expect(priorityChart).toBeVisible();
  });

  test('Stats show correct totals across all folders', async ({ page }) => {
    // Create tasks in different folders
    await createTask(page, { text: 'Shopping task', folder: 'Shopping' });
    await createTask(page, { text: 'Work task', folder: 'Work' });
    await createTask(page, { text: 'Personal task', folder: 'Personal' });

    await page.waitForTimeout(1000);

    // Complete one task
    await page.click('[data-testid="task-checkbox"]:first-child');
    await page.waitForTimeout(500);

    // Navigate to analytics
    await page.click('[data-testid="analytics-button"]');
    await page.waitForTimeout(1000);

    // Verify total tasks count
    const totalTasks = await page.locator('[data-testid="total-tasks-count"]').innerText();
    expect(parseInt(totalTasks)).toBeGreaterThanOrEqual(3);

    // Verify completion rate considers all folders
    const completionRate = await page
      .locator('[data-testid="completion-rate"]')
      .innerText();
    expect(parseFloat(completionRate)).toBeGreaterThan(0);
  });
});
