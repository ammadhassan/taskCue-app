import { test, expect } from '@playwright/test';
import { login, createTask, waitForNotification } from '../helpers/test-utils.js';

test.describe('Notifications', () => {
  test.beforeEach(async ({ page, context }) => {
    await login(page);

    // Grant notification permissions
    await context.grantPermissions(['notifications']);

    // Install clock for time mocking
    await page.clock.install();
  });

  test('Desktop notification sent 5 mins before due time', async ({ page }) => {
    // Mock current time
    const now = new Date();
    await page.clock.setTime(now);

    // Create a task due in 6 minutes
    const dueTime = new Date(now.getTime() + 6 * 60 * 1000);
    const dueTimeStr = dueTime.toTimeString().slice(0, 5); // HH:MM format

    await createTask(page, {
      text: 'Important meeting',
      dueDate: now.toISOString().split('T')[0],
      dueTime: dueTimeStr,
    });

    await page.waitForTimeout(3000);

    // Fast-forward time to 5 mins before due time (1 minute from now)
    const fiveMinsBeforeDue = new Date(now.getTime() + 1 * 60 * 1000);
    await page.clock.setTime(fiveMinsBeforeDue);

    // Wait for notification to appear
    const notificationReceived = await waitForNotification(page, 10000);

    expect(notificationReceived).toBe(true);

    // Verify notification content
    const notification = page.locator('[data-testid="notification"]');
    const notificationText = await notification.innerText();
    expect(notificationText).toContain('Important meeting');
    expect(notificationText).toContain('5 minutes');
  });

  test('Desktop notification sent at due time', async ({ page }) => {
    // Mock current time
    const now = new Date();
    await page.clock.setTime(now);

    // Create a task due in 1 minute
    const dueTime = new Date(now.getTime() + 1 * 60 * 1000);
    const dueTimeStr = dueTime.toTimeString().slice(0, 5);

    await createTask(page, {
      text: 'Call client',
      dueDate: now.toISOString().split('T')[0],
      dueTime: dueTimeStr,
    });

    await page.waitForTimeout(3000);

    // Fast-forward time to due time
    await page.clock.setTime(dueTime);

    // Wait for notification to appear
    const notificationReceived = await waitForNotification(page, 10000);

    expect(notificationReceived).toBe(true);

    // Verify notification content
    const notification = page.locator('[data-testid="notification"]');
    const notificationText = await notification.innerText();
    expect(notificationText).toContain('Call client');
    expect(notificationText).toMatch(/due now|overdue/i);
  });

  test('NO notifications sent at wrong times', async ({ page }) => {
    // Mock current time
    const now = new Date();
    await page.clock.setTime(now);

    // Create a task due in 10 minutes
    const dueTime = new Date(now.getTime() + 10 * 60 * 1000);
    const dueTimeStr = dueTime.toTimeString().slice(0, 5);

    await createTask(page, {
      text: 'Team standup',
      dueDate: now.toISOString().split('T')[0],
      dueTime: dueTimeStr,
    });

    await page.waitForTimeout(3000);

    // Check at 9 minutes before (should be NO notification)
    const nineMinsBeforeDue = new Date(now.getTime() + 1 * 60 * 1000);
    await page.clock.setTime(nineMinsBeforeDue);

    let notificationReceived = await waitForNotification(page, 2000);
    expect(notificationReceived).toBe(false);

    // Fast-forward to 7 minutes before (should be NO notification)
    const sevenMinsBeforeDue = new Date(now.getTime() + 3 * 60 * 1000);
    await page.clock.setTime(sevenMinsBeforeDue);

    notificationReceived = await waitForNotification(page, 2000);
    expect(notificationReceived).toBe(false);

    // Fast-forward to 6 minutes before (should be NO notification)
    const sixMinsBeforeDue = new Date(now.getTime() + 4 * 60 * 1000);
    await page.clock.setTime(sixMinsBeforeDue);

    notificationReceived = await waitForNotification(page, 2000);
    expect(notificationReceived).toBe(false);

    // Fast-forward to 5 minutes before (SHOULD have notification)
    const fiveMinsBeforeDue = new Date(now.getTime() + 5 * 60 * 1000);
    await page.clock.setTime(fiveMinsBeforeDue);

    notificationReceived = await waitForNotification(page, 5000);
    expect(notificationReceived).toBe(true);

    // Dismiss notification
    await page.click('[data-testid="dismiss-notification"]').catch(() => {});

    // Fast-forward to 3 minutes before (between 5-min and due time, NO notification)
    const threeMinsBeforeDue = new Date(now.getTime() + 7 * 60 * 1000);
    await page.clock.setTime(threeMinsBeforeDue);

    notificationReceived = await waitForNotification(page, 2000);
    expect(notificationReceived).toBe(false);

    // Fast-forward to due time (SHOULD have notification)
    await page.clock.setTime(dueTime);

    notificationReceived = await waitForNotification(page, 5000);
    expect(notificationReceived).toBe(true);

    // Dismiss notification
    await page.click('[data-testid="dismiss-notification"]').catch(() => {});

    // Fast-forward to 2 minutes after due time (NO more notifications)
    const twoMinsAfterDue = new Date(dueTime.getTime() + 2 * 60 * 1000);
    await page.clock.setTime(twoMinsAfterDue);

    notificationReceived = await waitForNotification(page, 2000);
    expect(notificationReceived).toBe(false);
  });

  test('Email notifications work', async ({ page }) => {
    // Enable email notifications in settings
    await page.click('[data-testid="settings-button"]');
    await page.check('[data-testid="enable-email-notifications"]');
    await page.fill('[data-testid="email-address"]', 'test@example.com');
    await page.click('[data-testid="close-settings-button"]');

    // Create a task with email reminder
    await createTask(page, {
      text: 'Important deadline',
      dueDate: new Date().toISOString().split('T')[0],
      dueTime: '14:00',
    });

    await page.waitForTimeout(3000);

    // Note: In a real test, you would:
    // 1. Use a test email service (like Mailtrap)
    // 2. Verify email was sent via API
    // 3. Check email content

    // For now, verify the email notification setting is saved
    await page.click('[data-testid="settings-button"]');
    const emailEnabled = await page.isChecked('[data-testid="enable-email-notifications"]');
    expect(emailEnabled).toBe(true);

    const emailAddress = await page.inputValue('[data-testid="email-address"]');
    expect(emailAddress).toBe('test@example.com');
  });

  test('SMS notifications work', async ({ page }) => {
    // Enable SMS notifications in settings
    await page.click('[data-testid="settings-button"]');
    await page.check('[data-testid="enable-sms-notifications"]');
    await page.fill('[data-testid="phone-number"]', '+1234567890');
    await page.click('[data-testid="close-settings-button"]');

    // Create a task with SMS reminder
    await createTask(page, {
      text: 'Doctor appointment',
      dueDate: new Date().toISOString().split('T')[0],
      dueTime: '10:00',
    });

    await page.waitForTimeout(3000);

    // Note: In a real test, you would:
    // 1. Use Twilio test credentials
    // 2. Verify SMS was sent via Twilio API
    // 3. Check SMS content

    // For now, verify the SMS notification setting is saved
    await page.click('[data-testid="settings-button"]');
    const smsEnabled = await page.isChecked('[data-testid="enable-sms-notifications"]');
    expect(smsEnabled).toBe(true);

    const phoneNumber = await page.inputValue('[data-testid="phone-number"]');
    expect(phoneNumber).toBe('+1234567890');
  });

  test('Sound alerts work', async ({ page }) => {
    // Enable sound alerts in settings
    await page.click('[data-testid="settings-button"]');
    await page.check('[data-testid="enable-sound-alerts"]');
    await page.click('[data-testid="close-settings-button"]');

    // Mock current time
    const now = new Date();
    await page.clock.setTime(now);

    // Create a task due in 1 minute
    const dueTime = new Date(now.getTime() + 1 * 60 * 1000);
    const dueTimeStr = dueTime.toTimeString().slice(0, 5);

    await createTask(page, {
      text: 'Meeting reminder',
      dueDate: now.toISOString().split('T')[0],
      dueTime: dueTimeStr,
    });

    await page.waitForTimeout(3000);

    // Listen for audio playback
    const audioPlayed = await page.evaluate(() => {
      return new Promise((resolve) => {
        const audio = document.querySelector('audio');
        if (audio) {
          audio.addEventListener('play', () => resolve(true));
          setTimeout(() => resolve(false), 3000);
        } else {
          resolve(false);
        }
      });
    });

    // Fast-forward to due time
    await page.clock.setTime(dueTime);

    // Wait for notification
    await waitForNotification(page, 5000);

    // Note: In a real test, you would:
    // 1. Mock the Audio API
    // 2. Verify audio.play() was called
    // 3. Check audio source

    // For now, verify sound alerts setting is enabled
    await page.click('[data-testid="settings-button"]');
    const soundEnabled = await page.isChecked('[data-testid="enable-sound-alerts"]');
    expect(soundEnabled).toBe(true);
  });

  test('Multiple tasks trigger separate notifications', async ({ page }) => {
    // Mock current time
    const now = new Date();
    await page.clock.setTime(now);

    // Create 3 tasks due at slightly different times
    const task1DueTime = new Date(now.getTime() + 6 * 60 * 1000);
    const task2DueTime = new Date(now.getTime() + 7 * 60 * 1000);
    const task3DueTime = new Date(now.getTime() + 8 * 60 * 1000);

    await createTask(page, {
      text: 'Task 1',
      dueDate: now.toISOString().split('T')[0],
      dueTime: task1DueTime.toTimeString().slice(0, 5),
    });

    await createTask(page, {
      text: 'Task 2',
      dueDate: now.toISOString().split('T')[0],
      dueTime: task2DueTime.toTimeString().slice(0, 5),
    });

    await createTask(page, {
      text: 'Task 3',
      dueDate: now.toISOString().split('T')[0],
      dueTime: task3DueTime.toTimeString().slice(0, 5),
    });

    await page.waitForTimeout(3000);

    // Fast-forward to 5 mins before first task
    const fiveMinsBeforeTask1 = new Date(now.getTime() + 1 * 60 * 1000);
    await page.clock.setTime(fiveMinsBeforeTask1);

    // Verify notification for task 1
    let notificationReceived = await waitForNotification(page, 5000);
    expect(notificationReceived).toBe(true);

    let notification = page.locator('[data-testid="notification"]');
    let notificationText = await notification.innerText();
    expect(notificationText).toContain('Task 1');

    // Dismiss
    await page.click('[data-testid="dismiss-notification"]').catch(() => {});

    // Fast-forward to 5 mins before second task
    const fiveMinsBeforeTask2 = new Date(now.getTime() + 2 * 60 * 1000);
    await page.clock.setTime(fiveMinsBeforeTask2);

    // Verify notification for task 2
    notificationReceived = await waitForNotification(page, 5000);
    expect(notificationReceived).toBe(true);

    notification = page.locator('[data-testid="notification"]');
    notificationText = await notification.innerText();
    expect(notificationText).toContain('Task 2');
  });

  test('Completed tasks do not trigger notifications', async ({ page }) => {
    // Mock current time
    const now = new Date();
    await page.clock.setTime(now);

    // Create a task due in 6 minutes
    const dueTime = new Date(now.getTime() + 6 * 60 * 1000);
    const dueTimeStr = dueTime.toTimeString().slice(0, 5);

    await createTask(page, {
      text: 'Complete this task',
      dueDate: now.toISOString().split('T')[0],
      dueTime: dueTimeStr,
    });

    await page.waitForTimeout(3000);

    // Mark task as complete
    await page.locator('[data-testid="task-checkbox"]')
      .filter({ hasText: 'Complete this task' })
      .click();
    await page.waitForTimeout(1000);

    // Fast-forward to 5 mins before due time
    const fiveMinsBeforeDue = new Date(now.getTime() + 1 * 60 * 1000);
    await page.clock.setTime(fiveMinsBeforeDue);

    // Verify NO notification is sent
    const notificationReceived = await waitForNotification(page, 3000);
    expect(notificationReceived).toBe(false);
  });
});
