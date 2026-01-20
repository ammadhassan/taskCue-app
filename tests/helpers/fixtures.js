/**
 * Sample tasks for testing different categories
 */

export const shoppingTasks = [
  {
    text: 'Buy milk',
    expectedFolder: 'Shopping',
    keywords: ['buy', 'milk'],
  },
  {
    text: 'Get groceries',
    expectedFolder: 'Shopping',
    keywords: ['get', 'groceries'],
  },
  {
    text: 'Pick up bread from store',
    expectedFolder: 'Shopping',
    keywords: ['pick up', 'bread', 'store'],
  },
  {
    text: 'Purchase coffee beans',
    expectedFolder: 'Shopping',
    keywords: ['purchase', 'coffee'],
  },
];

export const workTasks = [
  {
    text: 'Email colleague about project',
    expectedFolder: 'Work',
    keywords: ['email', 'colleague'],
  },
  {
    text: 'Team meeting at 3pm',
    expectedFolder: 'Work',
    keywords: ['meeting', 'team'],
  },
  {
    text: 'Finish quarterly report',
    expectedFolder: 'Work',
    keywords: ['report', 'finish'],
  },
  {
    text: 'Call boss about deadline',
    expectedFolder: 'Work',
    keywords: ['boss', 'call'],
  },
];

export const personalTasks = [
  {
    text: 'Call mom',
    expectedFolder: 'Personal',
    keywords: ['call', 'mom'],
  },
  {
    text: 'Doctor appointment',
    expectedFolder: 'Personal',
    keywords: ['doctor', 'appointment'],
  },
  {
    text: 'Read a book',
    expectedFolder: 'Personal',
    keywords: ['read', 'book'],
  },
];

/**
 * Date/time test scenarios
 */
export const dateTimeScenarios = [
  {
    input: 'Buy milk',
    description: 'No date/time mentioned',
    expectedBehavior: 'Should have default date and time (not empty)',
  },
  {
    input: 'Remind me at 3pm',
    currentTime: '14:00', // 2pm
    description: 'Time only, mentioned time is later today',
    expectedDate: 'today',
    expectedTime: '15:00',
  },
  {
    input: 'Remind me at 1pm',
    currentTime: '14:00', // 2pm
    description: 'Time only, mentioned time has passed',
    expectedDate: 'tomorrow',
    expectedTime: '13:00',
  },
  {
    input: 'Call doctor tomorrow at 10am',
    description: 'Date and time mentioned',
    expectedDate: 'tomorrow',
    expectedTime: '10:00',
  },
  {
    input: 'Meeting next Monday morning',
    description: 'Relative date and general time',
    expectedDate: 'next Monday',
    expectedTime: '09:00', // Default morning time
  },
];

/**
 * Notification test scenarios
 */
export const notificationScenarios = [
  {
    description: '5 minutes before due time',
    taskDueIn: 6, // minutes from now
    expectedNotificationAt: 1, // minutes from now (at 5 mins before)
  },
  {
    description: 'At due time',
    taskDueIn: 1, // minutes from now
    expectedNotificationAt: 1, // minutes from now (at due time)
  },
  {
    description: 'No notification before 5-minute mark',
    taskDueIn: 10, // minutes from now
    checkForNotificationAt: 4, // Check at 4 minutes (before 5-min mark)
    expectedNotification: false,
  },
];

/**
 * Analytics test data
 */
export const analyticsTestData = {
  tasks: [
    {
      text: 'Task 1',
      priority: 'High',
      dueDate: 'today',
      completed: true,
    },
    {
      text: 'Task 2',
      priority: 'High',
      dueDate: 'today',
      completed: false,
    },
    {
      text: 'Task 3',
      priority: 'Medium',
      dueDate: 'today',
      completed: true,
    },
    {
      text: 'Task 4',
      priority: 'Medium',
      dueDate: 'tomorrow',
      completed: false,
    },
    {
      text: 'Task 5',
      priority: 'Medium',
      dueDate: 'yesterday',
      completed: false,
    },
    {
      text: 'Task 6',
      priority: 'Low',
      dueDate: 'yesterday',
      completed: false,
    },
    {
      text: 'Task 7',
      priority: 'Low',
      dueDate: 'next week',
      completed: true,
    },
  ],
  expected: {
    dueToday: 3,
    overdue: 2,
    completionRate: 42.86, // 3/7 = 42.86%
    priorityDistribution: {
      high: 28.57, // 2/7
      medium: 42.86, // 3/7
      low: 28.57, // 2/7
    },
  },
};

/**
 * Voice input test phrases
 */
export const voiceInputPhrases = [
  {
    phrase: 'Remind me to buy milk tomorrow at 3pm',
    expectedTask: {
      text: 'Buy milk',
      folder: 'Shopping',
      dueDate: 'tomorrow',
      dueTime: '15:00',
    },
  },
  {
    phrase: 'Call my boss next Monday morning',
    expectedTask: {
      text: 'Call boss',
      folder: 'Work',
      dueDate: 'next Monday',
      dueTime: '09:00',
    },
  },
  {
    phrase: 'Doctor appointment on Friday at 2:30pm',
    expectedTask: {
      text: 'Doctor appointment',
      folder: 'Personal',
      dueDate: 'Friday',
      dueTime: '14:30',
    },
  },
];

/**
 * Theme test data
 */
export const themeTestData = {
  light: {
    backgroundColor: 'rgb(255, 255, 255)',
    textColor: 'rgb(0, 0, 0)',
  },
  dark: {
    backgroundColor: 'rgb(18, 18, 18)',
    textColor: 'rgb(255, 255, 255)',
  },
};

/**
 * Folder test data
 */
export const folderTestData = [
  {
    name: 'Projects',
    description: 'Custom folder for projects',
  },
  {
    name: 'Important',
    description: 'Custom folder for important tasks',
  },
];
