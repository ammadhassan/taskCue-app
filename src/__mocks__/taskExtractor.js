/**
 * Mock for taskExtractor.js used in tests
 */

// Mock implementation that returns predefined responses
export const extractTasksFromText = jest.fn((text, defaultTiming, existingTasks) => {
  // Default mock - can be overridden in individual tests
  return Promise.resolve([
    {
      action: 'create',
      task: 'Mock task',
      dueDate: '2025-12-06',
      dueTime: '09:00',
      folder: 'Personal'
    }
  ]);
});

export const extractTasksWithAI = jest.fn((text) => {
  return extractTasksFromText(text);
});
