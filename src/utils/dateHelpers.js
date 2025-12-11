/**
 * Date Helper Utilities
 * Format and manipulate dates for display
 */

/**
 * Format date as "Mon, Dec 10"
 */
export function formatDateShort(dateString) {
  if (!dateString) return null;
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });
}

/**
 * Format date as "Dec 10"
 */
export function formatDateMonth(dateString) {
  if (!dateString) return null;
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  });
}

/**
 * Format time as "3:30 PM"
 */
export function formatTime(timeString) {
  if (!timeString) return null;
  const [hours, minutes] = timeString.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes} ${ampm}`;
}

/**
 * Format date and time together
 */
export function formatDateTime(dateString, timeString) {
  const datePart = formatDateMonth(dateString);
  const timePart = formatTime(timeString);

  if (datePart && timePart) {
    return `${datePart} at ${timePart}`;
  } else if (datePart) {
    return datePart;
  } else if (timePart) {
    return `at ${timePart}`;
  }
  return null;
}

/**
 * Check if date is today
 */
export function isToday(dateString) {
  if (!dateString) return false;
  const date = new Date(dateString);
  const today = new Date();

  date.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);

  return date.getTime() === today.getTime();
}

/**
 * Check if date is tomorrow
 */
export function isTomorrow(dateString) {
  if (!dateString) return false;
  const date = new Date(dateString);
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  date.setHours(0, 0, 0, 0);
  tomorrow.setHours(0, 0, 0, 0);

  return date.getTime() === tomorrow.getTime();
}

/**
 * Check if task is overdue
 */
export function isOverdue(dateString, timeString) {
  if (!dateString) return false;

  const dueDate = new Date(dateString);

  if (timeString) {
    const [hours, minutes] = timeString.split(':');
    dueDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
  } else {
    dueDate.setHours(23, 59, 59, 999);
  }

  return dueDate < new Date();
}

/**
 * Get relative time description ("Today", "Tomorrow", "in 3 days")
 */
export function getRelativeTime(dateString) {
  if (!dateString) return null;

  const date = new Date(dateString);
  const today = new Date();

  date.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);

  const diffTime = date.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays === -1) return 'Yesterday';
  if (diffDays > 1 && diffDays < 7) return `in ${diffDays} days`;
  if (diffDays < -1 && diffDays > -7) return `${Math.abs(diffDays)} days ago`;

  return formatDateShort(dateString);
}

/**
 * Get time until task is due ("in 2 hours", "in 30 minutes")
 */
export function getTimeUntilDue(dateString, timeString) {
  if (!dateString || !timeString) return null;

  const dueDate = new Date(dateString);
  const [hours, minutes] = timeString.split(':');
  dueDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);

  const now = new Date();
  const diffMs = dueDate.getTime() - now.getTime();

  if (diffMs < 0) return 'Overdue';

  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays > 0) return `in ${diffDays} day${diffDays > 1 ? 's' : ''}`;
  if (diffHours > 0) return `in ${diffHours} hour${diffHours > 1 ? 's' : ''}`;
  if (diffMins > 0) return `in ${diffMins} min${diffMins > 1 ? 's' : ''}`;

  return 'Due now';
}
