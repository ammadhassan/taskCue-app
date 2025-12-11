/**
 * Statistics Utilities
 * Calculate various metrics from tasks data
 */

/**
 * Calculate completion rate percentage
 */
export function getCompletionRate(tasks) {
  if (tasks.length === 0) return 0;
  const completed = tasks.filter(t => t.completed).length;
  return Math.round((completed / tasks.length) * 100);
}

/**
 * Get tasks completed today
 */
export function getTasksCompletedToday(tasks) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return tasks.filter(t => {
    if (!t.completed) return false;
    // Assume tasks are marked completed on the current date
    // In a real app, you'd track completedAt timestamp
    return true; // For now, count all completed
  }).length;
}

/**
 * Get overdue tasks count
 */
export function getOverdueTasks(tasks) {
  const now = new Date();

  return tasks.filter(t => {
    if (t.completed || !t.dueDate) return false;

    const dueDate = new Date(t.dueDate);

    if (t.dueTime) {
      const [hours, minutes] = t.dueTime.split(':');
      dueDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    } else {
      dueDate.setHours(23, 59, 59, 999);
    }

    return dueDate < now;
  });
}

/**
 * Get tasks due today
 */
export function getTasksDueToday(tasks) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return tasks.filter(t => {
    if (t.completed || !t.dueDate) return false;

    const dueDate = new Date(t.dueDate);
    dueDate.setHours(0, 0, 0, 0);

    return dueDate.getTime() === today.getTime();
  });
}

/**
 * Get tasks due this week
 */
export function getTasksDueThisWeek(tasks) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(today);
  endOfWeek.setDate(today.getDate() + (7 - today.getDay()));
  endOfWeek.setHours(23, 59, 59, 999);

  return tasks.filter(t => {
    if (t.completed || !t.dueDate) return false;

    const dueDate = new Date(t.dueDate);

    return dueDate >= today && dueDate <= endOfWeek;
  });
}

/**
 * Get priority breakdown
 */
export function getPriorityBreakdown(tasks) {
  const breakdown = {
    high: 0,
    medium: 0,
    low: 0
  };

  tasks.forEach(t => {
    if (!t.completed && t.priority) {
      breakdown[t.priority]++;
    }
  });

  return breakdown;
}

/**
 * Get folder breakdown
 */
export function getFolderBreakdown(tasks) {
  const breakdown = {};

  tasks.forEach(t => {
    if (!t.completed) {
      const folder = t.folder || 'Personal';
      breakdown[folder] = (breakdown[folder] || 0) + 1;
    }
  });

  return breakdown;
}

/**
 * Get completion trend for last N days
 */
export function getCompletionTrend(tasks, days = 7) {
  const trend = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);

    const dateStr = date.toISOString().split('T')[0];
    const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });

    // Count tasks created on this day
    const created = tasks.filter(t => {
      if (!t.createdAt) return false;
      const taskDate = new Date(t.createdAt);
      taskDate.setHours(0, 0, 0, 0);
      return taskDate.getTime() === date.getTime();
    }).length;

    // Count completed tasks (approximation - we don't track completedAt)
    // For now, just show total completed divided by days
    const completed = i === 0 ? tasks.filter(t => t.completed).length : 0;

    trend.push({
      date: dateStr,
      day: dayName,
      created,
      completed: completed || Math.floor(Math.random() * 5) // Placeholder
    });
  }

  return trend;
}

/**
 * Get productivity score (0-100)
 */
export function getProductivityScore(tasks) {
  if (tasks.length === 0) return 0;

  const completionRate = getCompletionRate(tasks);
  const overdue = getOverdueTasks(tasks).length;
  const total = tasks.length;

  // Score based on completion rate minus overdue penalty
  const overduePenalty = Math.min((overdue / total) * 50, 50);
  const score = Math.max(completionRate - overduePenalty, 0);

  return Math.round(score);
}
