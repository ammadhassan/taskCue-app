/**
 * Calendar Export Service
 * Generates .ics calendar files for tasks
 */

/**
 * Generate iCal (.ics) file content for a single task
 */
export function generateTaskCalendarEvent(task) {
  if (!task.dueDate || !task.dueTime) {
    throw new Error('Task must have a due date and time to add to calendar');
  }

  // Parse date and time
  const [year, month, day] = task.dueDate.split('-').map(Number);
  const [hours, minutes] = task.dueTime.split(':').map(Number);

  const startDate = new Date(year, month - 1, day, hours, minutes);
  const endDate = new Date(startDate.getTime() + 30 * 60000); // 30 minutes duration

  // Format dates for iCal (YYYYMMDDTHHmmss)
  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = '00';
    return `${year}${month}${day}T${hours}${minutes}${seconds}`;
  };

  // Format date for description
  const formatReadableDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatReadableTime = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const now = new Date();
  const dtstart = formatDate(startDate);
  const dtend = formatDate(endDate);
  const dtstamp = formatDate(now);
  const uid = `task-${task.id}-${Date.now()}@task-assistant.com`;

  // Build rich description
  const taskTitle = task.text || task.task || 'Task Reminder';
  const descriptionParts = [
    `Task: ${taskTitle}`,
    '',
    `Due: ${formatReadableDate(startDate)} at ${formatReadableTime(startDate)}`,
  ];

  if (task.folder) {
    descriptionParts.push(`Folder: ${task.folder}`);
  }

  if (task.priority) {
    const priorityLabel = task.priority.charAt(0).toUpperCase() + task.priority.slice(1);
    descriptionParts.push(`Priority: ${priorityLabel}`);
  }

  descriptionParts.push('');
  descriptionParts.push('This is a reminder from Task Assistant.');
  descriptionParts.push('Complete this task and mark it done in the app!');

  const description = descriptionParts.join('\\n');

  // Build iCal content
  const icalContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Task Assistant//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
BEGIN:VEVENT
UID:${uid}
DTSTAMP:${dtstamp}
DTSTART:${dtstart}
DTEND:${dtend}
SUMMARY:${taskTitle}
DESCRIPTION:${description}
LOCATION:${task.folder || 'Task Assistant'}
STATUS:CONFIRMED
SEQUENCE:0
BEGIN:VALARM
TRIGGER:-PT15M
ACTION:DISPLAY
DESCRIPTION:Reminder: ${taskTitle}
END:VALARM
END:VEVENT
END:VCALENDAR`;

  return icalContent;
}

/**
 * Generate iCal file content for multiple tasks
 */
export function generateMultipleTasksCalendar(tasks) {
  const validTasks = tasks.filter(task => task.dueDate && task.dueTime);

  if (validTasks.length === 0) {
    throw new Error('No tasks with due dates and times to export');
  }

  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = '00';
    return `${year}${month}${day}T${hours}${minutes}${seconds}`;
  };

  const formatReadableDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatReadableTime = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const now = new Date();
  const dtstamp = formatDate(now);

  let events = '';

  validTasks.forEach((task) => {
    const [year, month, day] = task.dueDate.split('-').map(Number);
    const [hours, minutes] = task.dueTime.split(':').map(Number);

    const startDate = new Date(year, month - 1, day, hours, minutes);
    const endDate = new Date(startDate.getTime() + 30 * 60000);

    const dtstart = formatDate(startDate);
    const dtend = formatDate(endDate);
    const uid = `task-${task.id}-${Date.now()}-${Math.random()}@task-assistant.com`;

    // Build rich description
    const taskTitle = task.text || task.task || 'Task Reminder';
    const descriptionParts = [
      `Task: ${taskTitle}`,
      '',
      `Due: ${formatReadableDate(startDate)} at ${formatReadableTime(startDate)}`,
    ];

    if (task.folder) {
      descriptionParts.push(`Folder: ${task.folder}`);
    }

    if (task.priority) {
      const priorityLabel = task.priority.charAt(0).toUpperCase() + task.priority.slice(1);
      descriptionParts.push(`Priority: ${priorityLabel}`);
    }

    descriptionParts.push('');
    descriptionParts.push('This is a reminder from Task Assistant.');
    descriptionParts.push('Complete this task and mark it done in the app!');

    const description = descriptionParts.join('\\n');

    events += `BEGIN:VEVENT
UID:${uid}
DTSTAMP:${dtstamp}
DTSTART:${dtstart}
DTEND:${dtend}
SUMMARY:${taskTitle}
DESCRIPTION:${description}
LOCATION:${task.folder || 'Task Assistant'}
STATUS:CONFIRMED
SEQUENCE:0
BEGIN:VALARM
TRIGGER:-PT15M
ACTION:DISPLAY
DESCRIPTION:Reminder: ${taskTitle}
END:VALARM
END:VEVENT
`;
  });

  const icalContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Task Assistant//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
${events}END:VCALENDAR`;

  return icalContent;
}

/**
 * Download a .ics file
 */
export function downloadCalendarFile(content, filename = 'task.ics') {
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}

/**
 * Export single task to calendar
 */
export function exportTaskToCalendar(task) {
  try {
    const icalContent = generateTaskCalendarEvent(task);
    const filename = `task-${task.id || 'export'}.ics`;
    downloadCalendarFile(icalContent, filename);
    return true;
  } catch (error) {
    console.error('Failed to export task to calendar:', error);
    throw error;
  }
}

/**
 * Export all tasks to calendar
 */
export function exportAllTasksToCalendar(tasks) {
  try {
    const icalContent = generateMultipleTasksCalendar(tasks);
    const filename = `all-tasks-${new Date().toISOString().split('T')[0]}.ics`;
    downloadCalendarFile(icalContent, filename);
    return true;
  } catch (error) {
    console.error('Failed to export tasks to calendar:', error);
    throw error;
  }
}

/**
 * Export tasks by folder to calendar
 */
export function exportFolderToCalendar(tasks, folder) {
  const folderTasks = tasks.filter(task => task.folder === folder);
  try {
    const icalContent = generateMultipleTasksCalendar(folderTasks);
    const filename = `${folder.toLowerCase()}-tasks-${new Date().toISOString().split('T')[0]}.ics`;
    downloadCalendarFile(icalContent, filename);
    return true;
  } catch (error) {
    console.error(`Failed to export ${folder} tasks to calendar:`, error);
    throw error;
  }
}
