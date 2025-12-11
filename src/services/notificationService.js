/**
 * Notification Service
 * Handles desktop notifications, sound alerts, and notification permissions
 */

class NotificationService {
  constructor() {
    this.hasPermission = false;
    this.soundEnabled = true;
    this.audioContext = null;
    this.scheduledNotifications = new Map(); // Store timeout IDs
    this.notifiedTasks = new Map(); // Track which tasks have been notified today
    this.lastResetDate = new Date().toDateString(); // Track when we last reset
  }

  /**
   * Reset notification tracking daily
   */
  resetDailyTracking() {
    const today = new Date().toDateString();
    if (this.lastResetDate !== today) {
      console.log('🔄 [NOTIFICATION] Resetting daily notification tracking');
      this.notifiedTasks.clear();
      this.lastResetDate = today;
    }
  }

  /**
   * Check if a task has already been notified
   */
  hasBeenNotified(taskId, notificationType) {
    const key = `${taskId}_${notificationType}`;
    return this.notifiedTasks.has(key);
  }

  /**
   * Mark a task as notified
   */
  markAsNotified(taskId, notificationType) {
    const key = `${taskId}_${notificationType}`;
    this.notifiedTasks.set(key, Date.now());
  }

  /**
   * Request notification permission from the browser
   */
  async requestPermission() {
    if (!('Notification' in window)) {
      console.warn('This browser does not support desktop notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      this.hasPermission = true;
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      this.hasPermission = permission === 'granted';
      return this.hasPermission;
    }

    return false;
  }

  /**
   * Show a desktop notification
   */
  showNotification(title, options = {}) {
    // Check browser permission directly (more reliable than hasPermission flag)
    if (!('Notification' in window)) {
      console.warn('❌ [NOTIFICATION] Browser does not support notifications');
      return;
    }

    if (Notification.permission !== 'granted') {
      console.warn('❌ [NOTIFICATION] Permission not granted. Current status:', Notification.permission);
      return;
    }

    console.log('✅ [NOTIFICATION] Showing notification:', title);
    console.log('🔊 [NOTIFICATION] Playing notification sound...');

    // ALWAYS play sound when notification shows
    this.playNotificationSound();

    try {
      const notification = new Notification(title, {
        icon: '/logo192.png',
        badge: '/logo192.png',
        requireInteraction: true, // Notification stays until user dismisses it
        tag: 'task-notification', // Prevents duplicate notifications
        silent: false, // Ensure system sound plays
        ...options,
      });

      console.log('✅ [NOTIFICATION] Notification object created successfully');

      // Optional: Auto-close after 20 seconds instead of 5
      setTimeout(() => {
        notification.close();
        console.log('🔕 [NOTIFICATION] Auto-closed after 20 seconds');
      }, 20000);

      return notification;
    } catch (error) {
      console.error('❌ [NOTIFICATION] Error showing notification:', error);
    }
  }

  /**
   * Play a notification sound
   */
  playSound(frequency = 800, duration = 200) {
    if (!this.soundEnabled) return;

    try {
      // Create audio context if it doesn't exist
      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      }

      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      oscillator.frequency.value = frequency;
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        this.audioContext.currentTime + duration / 1000
      );

      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + duration / 1000);
    } catch (error) {
      console.error('Error playing sound:', error);
    }
  }

  /**
   * Play a pleasant notification sound (two-tone)
   */
  playNotificationSound() {
    this.playSound(800, 150);
    setTimeout(() => this.playSound(1000, 150), 160);
  }

  /**
   * Notify about a task
   */
  notifyTask(task, type = 'info') {
    console.log(`📢 [NOTIFICATION] notifyTask called - Task: "${task.text}", Type: ${type}`);

    const titles = {
      overdue: '⚠️ Task Overdue',
      due_soon: '⏰ Task Due Soon',
      task_starting: '🔔 Task Starting Now!',
      completed: '✓ Task Completed',
      created: '+ New Task Added',
      info: 'ℹ️ Task Notification',
    };

    const title = titles[type] || titles.info;
    const body = task.text || 'Task notification';

    console.log(`📢 [NOTIFICATION] Attempting to show notification: "${title}" - "${body}"`);

    // Show notification (sound will play inside showNotification)
    this.showNotification(title, { body });

    // Play additional sounds for specific types
    if (type === 'overdue') {
      console.log('🔊 [NOTIFICATION] Playing OVERDUE sound (low beep)');
      setTimeout(() => this.playSound(600, 300), 200); // Lower, longer sound for urgency
    } else if (type === 'task_starting') {
      console.log('🔊 [NOTIFICATION] Playing TASK STARTING sound (high beep)');
      setTimeout(() => this.playSound(1200, 250), 200); // Higher pitch for "starting now"
    }
  }

  /**
   * Check for overdue and upcoming tasks
   */
  checkTasks(tasks) {
    // Reset tracking if it's a new day
    this.resetDailyTracking();

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);

    let notifiedCount = 0;

    tasks.forEach((task) => {
      if (task.completed || !task.dueDate) return;

      const dueDate = new Date(task.dueDate);
      dueDate.setHours(0, 0, 0, 0);

      // Overdue - only notify if not already notified today
      if (dueDate < now) {
        if (!this.hasBeenNotified(task.id, 'overdue')) {
          this.notifyTask(task, 'overdue');
          this.markAsNotified(task.id, 'overdue');
          notifiedCount++;
        }
      }
      // Due today or tomorrow - only notify if not already notified today
      else if (dueDate <= tomorrow) {
        if (!this.hasBeenNotified(task.id, 'due_soon')) {
          this.notifyTask(task, 'due_soon');
          this.markAsNotified(task.id, 'due_soon');
          notifiedCount++;
        }
      }
    });

    if (notifiedCount > 0) {
      console.log(`🔔 [NOTIFICATION] Sent ${notifiedCount} new notifications`);
    }
  }

  /**
   * Enable/disable sound
   */
  setSoundEnabled(enabled) {
    this.soundEnabled = enabled;
  }

  /**
   * Schedule DUAL notifications: 5 minutes before due time AND at exact due time
   * @param {Object} task - The task to notify about
   * @param {Object} settings - User settings (optional, for multi-channel)
   */
  scheduleNotification(task, settings = null) {
    console.log(`⏰ [SCHEDULE] scheduleNotification called for task: "${task.text}"`);
    console.log(`⏰ [SCHEDULE] Task details:`, { dueDate: task.dueDate, dueTime: task.dueTime, id: task.id });

    if (!task.dueDate || !task.dueTime) {
      console.warn(`⚠️ [SCHEDULE] Skipping - task missing date or time`);
      return;
    }

    // Parse the due date and time
    const [year, month, day] = task.dueDate.split('-');
    const [hours, minutes] = task.dueTime.split(':');

    const dueDateTime = new Date(
      parseInt(year),
      parseInt(month) - 1,
      parseInt(day),
      parseInt(hours),
      parseInt(minutes)
    );

    const now = new Date();

    // Calculate BOTH notification times
    const earlyNotificationTime = new Date(dueDateTime.getTime() - 5 * 60 * 1000); // 5 min before
    const exactNotificationTime = dueDateTime; // Exact due time

    const msUntilEarlyNotification = earlyNotificationTime.getTime() - now.getTime();
    const msUntilExactNotification = exactNotificationTime.getTime() - now.getTime();

    console.log(`⏰ [SCHEDULE] Due time: ${dueDateTime.toLocaleString()}`);
    console.log(`⏰ [SCHEDULE] Early warning time: ${earlyNotificationTime.toLocaleString()} (5 min before) - in ${Math.round(msUntilEarlyNotification / 1000)}s`);
    console.log(`⏰ [SCHEDULE] Exact time notification: ${exactNotificationTime.toLocaleString()} (at due time) - in ${Math.round(msUntilExactNotification / 1000)}s`);

    const timeouts = {};

    // Schedule FIRST notification: 5 minutes before (within 24 hours and in future)
    if (msUntilEarlyNotification > 0 && msUntilEarlyNotification < 24 * 60 * 60 * 1000) {
      console.log(`✅ [SCHEDULE] Scheduling EARLY WARNING for task "${task.text}" in ${Math.round(msUntilEarlyNotification / 1000)} seconds (5 minutes before)`);

      timeouts.earlyWarning = setTimeout(() => {
        console.log(`🔔 [SCHEDULE] EARLY WARNING TRIGGERED (5 min before) for task: "${task.text}"`);
        if (settings) {
          this.sendMultiChannelNotification(task, settings);
        } else {
          this.notifyTask(task, 'due_soon');
        }
      }, msUntilEarlyNotification);
    } else {
      if (msUntilEarlyNotification <= 0) {
        console.warn(`⚠️ [SCHEDULE] Cannot schedule early warning - time has passed (${Math.round(msUntilEarlyNotification / 1000)}s ago)`);
      } else {
        console.warn(`⚠️ [SCHEDULE] Cannot schedule early warning - more than 24 hours away`);
      }
    }

    // Schedule SECOND notification: at exact due time (within 24 hours and in future)
    if (msUntilExactNotification > 0 && msUntilExactNotification < 24 * 60 * 60 * 1000) {
      console.log(`✅ [SCHEDULE] Scheduling EXACT TIME notification for task "${task.text}" in ${Math.round(msUntilExactNotification / 1000)} seconds (at due time)`);

      timeouts.exactTime = setTimeout(() => {
        console.log(`🔔 [SCHEDULE] EXACT TIME NOTIFICATION TRIGGERED (at due time) for task: "${task.text}"`);
        if (settings) {
          this.sendMultiChannelNotification(task, settings);
        } else {
          this.notifyTask(task, 'task_starting');
        }
      }, msUntilExactNotification);
    } else {
      if (msUntilExactNotification <= 0) {
        console.warn(`⚠️ [SCHEDULE] Cannot schedule exact time notification - time has passed (${Math.round(msUntilExactNotification / 1000)}s ago)`);
      } else {
        console.warn(`⚠️ [SCHEDULE] Cannot schedule exact time notification - more than 24 hours away`);
      }
    }

    // Store BOTH timeout IDs (or just the ones we scheduled)
    if (timeouts.earlyWarning || timeouts.exactTime) {
      this.scheduledNotifications.set(task.id, timeouts);
      console.log(`✅ [SCHEDULE] Stored ${Object.keys(timeouts).length} notification(s) for task ${task.id}`);
    }
  }

  /**
   * Cancel scheduled notifications for a task (both early warning and exact time)
   */
  cancelScheduledNotification(taskId) {
    const timeouts = this.scheduledNotifications.get(taskId);
    if (timeouts) {
      // Handle both old format (single timeout ID) and new format (object with multiple timeouts)
      if (typeof timeouts === 'object' && !timeouts._id) {
        // New format - object with earlyWarning and exactTime properties
        if (timeouts.earlyWarning) {
          clearTimeout(timeouts.earlyWarning);
          console.log(`Cancelled early warning notification for task ${taskId}`);
        }
        if (timeouts.exactTime) {
          clearTimeout(timeouts.exactTime);
          console.log(`Cancelled exact time notification for task ${taskId}`);
        }
      } else {
        // Old format - single timeout ID (backward compatibility)
        clearTimeout(timeouts);
        console.log(`Cancelled notification for task ${taskId}`);
      }
      this.scheduledNotifications.delete(taskId);
    }
  }

  /**
   * Clear all scheduled notifications (both early warning and exact time)
   */
  clearAllScheduled() {
    this.scheduledNotifications.forEach((timeouts) => {
      // Handle both old format (single timeout ID) and new format (object with multiple timeouts)
      if (typeof timeouts === 'object' && !timeouts._id) {
        // New format - object with earlyWarning and exactTime properties
        if (timeouts.earlyWarning) clearTimeout(timeouts.earlyWarning);
        if (timeouts.exactTime) clearTimeout(timeouts.exactTime);
      } else {
        // Old format - single timeout ID
        clearTimeout(timeouts);
      }
    });
    this.scheduledNotifications.clear();
  }

  /**
   * Send email notification for a task
   */
  async sendEmailNotification(task, email) {
    if (!email) {
      console.warn('No email address provided for notification');
      return false;
    }

    const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';

    try {
      const response = await fetch(`${BACKEND_URL}/api/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: email,
          subject: `Task Reminder: ${task.text}`,
          taskDetails: {
            task: task.text,
            dueDate: task.dueDate,
            dueTime: task.dueTime,
            folder: task.folder,
            priority: task.priority,
          },
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('Failed to send email notification:', error);
        return false;
      }

      console.log(`✉️ Email notification sent to ${email} for task: ${task.text}`);
      return true;
    } catch (error) {
      console.error('Error sending email notification:', error);
      return false;
    }
  }

  /**
   * Send SMS notification for a task
   */
  async sendSMSNotification(task, phoneNumber) {
    if (!phoneNumber) {
      console.warn('No phone number provided for notification');
      return false;
    }

    const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';

    try {
      const message = `⏰ Task Reminder: ${task.text}${
        task.dueDate && task.dueTime ? ` - Due: ${task.dueDate} at ${task.dueTime}` : ''
      }`;

      const response = await fetch(`${BACKEND_URL}/api/send-sms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: phoneNumber,
          message: message,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('Failed to send SMS notification:', error);
        return false;
      }

      console.log(`📱 SMS notification sent to ${phoneNumber} for task: ${task.text}`);
      return true;
    } catch (error) {
      console.error('Error sending SMS notification:', error);
      return false;
    }
  }

  /**
   * Send multi-channel notification (browser + email + SMS)
   */
  async sendMultiChannelNotification(task, settings) {
    const promises = [];

    // Browser notification
    if (settings.notifications && settings.desktopNotifications) {
      this.notifyTask(task, 'due_soon');
    }

    // Email notification
    if (settings.emailNotifications && settings.email) {
      promises.push(this.sendEmailNotification(task, settings.email));
    }

    // SMS notification
    if (settings.smsNotifications && settings.phoneNumber) {
      promises.push(this.sendSMSNotification(task, settings.phoneNumber));
    }

    // Wait for all notifications to complete
    const results = await Promise.allSettled(promises);
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        console.error(`Notification ${index} failed:`, result.reason);
      }
    });
  }
}

// Export singleton instance
export const notificationService = new NotificationService();
