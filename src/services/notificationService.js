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
    if (!this.hasPermission || Notification.permission !== 'granted') {
      console.log('Notification permission not granted');
      return;
    }

    const notification = new Notification(title, {
      icon: '/logo192.png',
      badge: '/logo192.png',
      ...options,
    });

    // Auto-close after 5 seconds
    setTimeout(() => notification.close(), 5000);

    return notification;
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
    const titles = {
      overdue: '⚠️ Task Overdue',
      due_soon: '⏰ Task Due Soon',
      completed: '✓ Task Completed',
      created: '+ New Task Added',
      info: 'ℹ️ Task Notification',
    };

    const title = titles[type] || titles.info;
    const body = task.text || 'Task notification';

    this.showNotification(title, { body });

    if (type === 'completed') {
      this.playNotificationSound();
    } else if (type === 'overdue') {
      this.playSound(600, 300); // Lower, longer sound for urgency
    }
  }

  /**
   * Check for overdue and upcoming tasks
   */
  checkTasks(tasks) {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);

    tasks.forEach((task) => {
      if (task.completed || !task.dueDate) return;

      const dueDate = new Date(task.dueDate);
      dueDate.setHours(0, 0, 0, 0);

      // Overdue
      if (dueDate < now) {
        this.notifyTask(task, 'overdue');
      }
      // Due today or tomorrow
      else if (dueDate <= tomorrow) {
        this.notifyTask(task, 'due_soon');
      }
    });
  }

  /**
   * Enable/disable sound
   */
  setSoundEnabled(enabled) {
    this.soundEnabled = enabled;
  }

  /**
   * Schedule a notification for a specific time
   * @param {Object} task - The task to notify about
   * @param {Object} settings - User settings (optional, for multi-channel)
   */
  scheduleNotification(task, settings = null) {
    if (!task.dueDate || !task.dueTime) return;

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
    const msUntilDue = dueDateTime.getTime() - now.getTime();

    // Only schedule if in the future and within 24 hours
    if (msUntilDue > 0 && msUntilDue < 24 * 60 * 60 * 1000) {
      console.log(`Scheduling notification for task "${task.text}" in ${Math.round(msUntilDue / 1000)} seconds`);

      const timeoutId = setTimeout(() => {
        if (settings) {
          // Multi-channel notification
          this.sendMultiChannelNotification(task, settings);
        } else {
          // Browser-only notification (backward compatible)
          this.notifyTask(task, 'due_soon');
        }
        this.scheduledNotifications.delete(task.id);
      }, msUntilDue);

      // Store the timeout ID so we can cancel it later
      this.scheduledNotifications.set(task.id, timeoutId);
    }
  }

  /**
   * Cancel scheduled notification for a task
   */
  cancelScheduledNotification(taskId) {
    const timeoutId = this.scheduledNotifications.get(taskId);
    if (timeoutId) {
      clearTimeout(timeoutId);
      this.scheduledNotifications.delete(taskId);
      console.log(`Cancelled notification for task ${taskId}`);
    }
  }

  /**
   * Clear all scheduled notifications
   */
  clearAllScheduled() {
    this.scheduledNotifications.forEach((timeoutId) => {
      clearTimeout(timeoutId);
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
