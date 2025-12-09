/**
 * Mock for notificationService.js used in tests
 */

export const notificationService = {
  requestPermission: jest.fn(() => Promise.resolve('granted')),

  scheduleNotification: jest.fn((task) => {
    return true;
  }),

  cancelScheduledNotification: jest.fn((taskId) => {
    return true;
  }),

  clearAllScheduled: jest.fn(() => {
    return true;
  }),

  notifyTask: jest.fn((task, type) => {
    return true;
  }),

  checkTasks: jest.fn((tasks) => {
    return true;
  }),

  setSoundEnabled: jest.fn((enabled) => {
    return true;
  })
};
