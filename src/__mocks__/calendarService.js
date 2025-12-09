/**
 * Mock for calendarService.js used in tests
 */

export const generateTaskCalendarEvent = jest.fn((task) => {
  return 'BEGIN:VCALENDAR\nVERSION:2.0\nEND:VCALENDAR';
});

export const generateMultipleTasksCalendar = jest.fn((tasks) => {
  return 'BEGIN:VCALENDAR\nVERSION:2.0\nEND:VCALENDAR';
});

export const downloadCalendarFile = jest.fn((content, filename) => {
  return true;
});

export const exportTaskToCalendar = jest.fn((task) => {
  return true;
});

export const exportAllTasksToCalendar = jest.fn((tasks) => {
  return true;
});

export const exportFolderToCalendar = jest.fn((tasks, folder) => {
  return true;
});
