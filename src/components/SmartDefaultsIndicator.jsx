import { getSmartDefaults, shouldApplyDefaults } from '../services/defaultDateSelector';

/**
 * SmartDefaultsIndicator Component
 * Shows a preview of the smart default date/time that will be applied to a task
 */
export default function SmartDefaultsIndicator({ dueDate, dueTime, taskInput, settings }) {
  // Only show if defaults would apply and there's task input
  if (!shouldApplyDefaults(dueDate, dueTime) || !taskInput.trim()) {
    return null;
  }

  const defaults = getSmartDefaults(taskInput, settings?.defaultTiming || 'tomorrow_morning');

  // Don't show if no defaults available (manual mode)
  if (!defaults.dueDate) {
    return null;
  }

  return (
    <div className="mb-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
      <div className="flex items-center gap-2">
        <span className="text-blue-600 dark:text-blue-400 text-lg">✨</span>
        <div className="flex-1">
          <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
            Smart Default: {formatDate(defaults.dueDate)} at {defaults.dueTime}
          </p>
          <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">
            {defaults.reason}
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Format date string to human-readable format
 * @param {string} dateStr - Date in YYYY-MM-DD format
 * @returns {string} Human-readable date (e.g., "Today", "Tomorrow", "Mon, Dec 9")
 */
function formatDate(dateStr) {
  if (!dateStr) return '';

  const date = new Date(dateStr + 'T00:00:00'); // Add time to avoid timezone issues
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const dateOnly = new Date(date);
  dateOnly.setHours(0, 0, 0, 0);

  if (dateOnly.getTime() === today.getTime()) {
    return 'Today';
  } else if (dateOnly.getTime() === tomorrow.getTime()) {
    return 'Tomorrow';
  } else {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  }
}
