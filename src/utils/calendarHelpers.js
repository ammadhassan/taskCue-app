/**
 * Calendar Helper Utilities
 * Functions for generating and managing calendar views
 */

/**
 * Get the number of days in a given month
 */
export function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

/**
 * Get the day of week for the first day of the month (0 = Sunday, 6 = Saturday)
 */
export function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay();
}

/**
 * Get the current month and year
 */
export function getCurrentMonthYear() {
  const now = new Date();
  return {
    month: now.getMonth(),
    year: now.getFullYear()
  };
}

/**
 * Get month name from month index (0-11)
 */
export function getMonthName(monthIndex) {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return months[monthIndex];
}

/**
 * Get short day names
 */
export function getDayNames() {
  return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
}

/**
 * Generate calendar grid data for a given month
 * Returns array of week arrays, each containing day objects
 */
export function generateCalendarGrid(year, month) {
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const grid = [];
  let week = [];

  // Add empty cells for days before the 1st
  for (let i = 0; i < firstDay; i++) {
    week.push({ date: null, isCurrentMonth: false });
  }

  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    week.push({
      date: day,
      isCurrentMonth: true,
      fullDate: new Date(year, month, day)
    });

    // Start new week on Sunday
    if (week.length === 7) {
      grid.push(week);
      week = [];
    }
  }

  // Fill remaining cells in last week
  if (week.length > 0) {
    while (week.length < 7) {
      week.push({ date: null, isCurrentMonth: false });
    }
    grid.push(week);
  }

  return grid;
}

/**
 * Check if a date is today
 */
export function isToday(year, month, day) {
  const today = new Date();
  return (
    today.getFullYear() === year &&
    today.getMonth() === month &&
    today.getDate() === day
  );
}

/**
 * Group tasks by their due date
 * Returns object with YYYY-MM-DD as keys and task arrays as values
 */
export function groupTasksByDate(tasks) {
  const grouped = {};

  tasks.forEach(task => {
    if (task.dueDate) {
      const dateKey = task.dueDate; // Already in YYYY-MM-DD format
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(task);
    }
  });

  return grouped;
}

/**
 * Get tasks for a specific date
 */
export function getTasksForDate(tasks, year, month, day) {
  const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  return tasks.filter(task => task.dueDate === dateStr);
}

/**
 * Navigate to previous month
 */
export function getPreviousMonth(currentMonth, currentYear) {
  if (currentMonth === 0) {
    return { month: 11, year: currentYear - 1 };
  }
  return { month: currentMonth - 1, year: currentYear };
}

/**
 * Navigate to next month
 */
export function getNextMonth(currentMonth, currentYear) {
  if (currentMonth === 11) {
    return { month: 0, year: currentYear + 1 };
  }
  return { month: currentMonth + 1, year: currentYear };
}

/**
 * Generate hour slots for day view (6 AM - 10 PM)
 */
export function generateHourSlots() {
  const slots = [];
  for (let hour = 6; hour <= 22; hour++) {
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    const period = hour >= 12 ? 'PM' : 'AM';
    slots.push({
      hour,
      display: `${displayHour}:00 ${period}`,
      time24: `${String(hour).padStart(2, '0')}:00`
    });
  }
  return slots;
}

/**
 * Get tasks organized by hour for a specific date
 */
export function getTasksByHour(tasks, year, month, day) {
  const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  const dayTasks = tasks.filter(task => task.dueDate === dateStr);

  const tasksByHour = {};
  const unscheduled = [];

  dayTasks.forEach(task => {
    if (task.dueTime) {
      const hour = parseInt(task.dueTime.split(':')[0]);
      if (!tasksByHour[hour]) {
        tasksByHour[hour] = [];
      }
      tasksByHour[hour].push(task);
    } else {
      unscheduled.push(task);
    }
  });

  return { tasksByHour, unscheduled };
}

/**
 * Format date for display (e.g., "Monday, January 15, 2024")
 */
export function formatDateForDisplay(year, month, day) {
  const date = new Date(year, month, day);
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  return date.toLocaleDateString('en-US', options);
}
