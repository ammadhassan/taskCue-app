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
   */
  scheduleNotification(task) {
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
        this.notifyTask(task, 'due_soon');
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
}

// Export singleton instance
export const notificationService = new NotificationService();
