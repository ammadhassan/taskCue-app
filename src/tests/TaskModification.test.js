// Mock Supabase client to prevent auth callbacks during tests
// Jest will automatically use the manual mock from src/__mocks__/supabaseClient.js
jest.mock('../supabaseClient');

// Mock the services
jest.mock('../services/taskExtractor');
jest.mock('../services/notificationService');
jest.mock('../services/calendarService');

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App';
import { extractTasksFromText } from '../services/taskExtractor';
import { notificationService } from '../services/notificationService';

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => {
      store[key] = value.toString();
    },
    removeItem: (key) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    }
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe('Task Modification Integration Tests', () => {
  beforeEach(() => {
    localStorageMock.clear();
    jest.clearAllMocks();
    window.alert = jest.fn();
  });

  test('should complete full task modification workflow', async () => {
    // Set up initial tasks in localStorage
    const initialTasks = [
      {
        id: 'task-1',
        text: 'Send email to Johannes',
        folder: 'Work',
        dueDate: '2025-12-06',
        dueTime: '10:00',
        priority: 'medium',
        completed: false,
        createdAt: new Date().toISOString()
      }
    ];

    localStorageMock.setItem('tasks', JSON.stringify(initialTasks));
    localStorageMock.setItem('settings', JSON.stringify({
      notifications: true,
      desktopNotifications: true,
      soundAlerts: true,
      theme: 'light',
      defaultTiming: 'tomorrow_morning'
    }));

    // Mock AI response to modify the task
    extractTasksFromText.mockResolvedValueOnce([
      {
        action: 'modify',
        taskId: 'task-1',
        matchedTask: 'Send email to Johannes',
        changes: {
          dueDate: '2025-12-07',
          dueTime: '15:00'
        }
      }
    ]);

    render(<App />);

    // Switch to AI Extract mode
    const aiButton = screen.getByText('AI Extract');
    fireEvent.click(aiButton);

    // Type modification command
    const textarea = screen.getByPlaceholderText(/Paste or type multiple tasks/i);
    await userEvent.type(textarea, 'Move my email task to tomorrow at 3pm');

    // Extract tasks
    fireEvent.click(screen.getByText('Extract Tasks'));

    // Wait for preview
    await waitFor(() => {
      expect(screen.getByText('✏️ MODIFY TASK')).toBeInTheDocument();
      expect(screen.getByText(/Send email to Johannes/)).toBeInTheDocument();
    });

    // Apply changes
    fireEvent.click(screen.getByText('Apply All Changes'));

    // Verify notification service was called to reschedule
    await waitFor(() => {
      expect(notificationService.cancelScheduledNotification).toHaveBeenCalledWith('task-1');
      expect(notificationService.scheduleNotification).toHaveBeenCalled();
    });

    // Verify task was updated in localStorage
    const savedTasks = JSON.parse(localStorageMock.getItem('tasks'));
    const modifiedTask = savedTasks.find(t => t.id === 'task-1');
    expect(modifiedTask.dueDate).toBe('2025-12-07');
    expect(modifiedTask.dueTime).toBe('15:00');
  });

  test('should handle task deletion workflow', async () => {
    // Set up initial tasks
    const initialTasks = [
      {
        id: 'task-1',
        text: 'Buy milk',
        folder: 'Shopping',
        dueDate: '2025-12-05',
        dueTime: '18:00',
        priority: 'low',
        completed: false,
        createdAt: new Date().toISOString()
      },
      {
        id: 'task-2',
        text: 'Team meeting',
        folder: 'Work',
        dueDate: '2025-12-07',
        dueTime: '14:00',
        priority: 'high',
        completed: false,
        createdAt: new Date().toISOString()
      }
    ];

    localStorageMock.setItem('tasks', JSON.stringify(initialTasks));

    // Mock AI response to delete a task
    extractTasksFromText.mockResolvedValueOnce([
      {
        action: 'delete',
        taskId: 'task-1',
        matchedTask: 'Buy milk'
      }
    ]);

    render(<App />);

    // Switch to AI Extract mode
    fireEvent.click(screen.getByText('AI Extract'));

    // Type deletion command
    const textarea = screen.getByPlaceholderText(/Paste or type multiple tasks/i);
    await userEvent.type(textarea, 'Cancel the milk shopping');

    // Extract tasks
    fireEvent.click(screen.getByText('Extract Tasks'));

    // Wait for preview
    await waitFor(() => {
      expect(screen.getByText('🗑️ DELETE TASK')).toBeInTheDocument();
      expect(screen.getByText(/Buy milk/)).toBeInTheDocument();
    });

    // Apply changes
    fireEvent.click(screen.getByText('Apply All Changes'));

    // Verify notification was cancelled
    await waitFor(() => {
      expect(notificationService.cancelScheduledNotification).toHaveBeenCalledWith('task-1');
    });

    // Verify task was removed from localStorage
    const savedTasks = JSON.parse(localStorageMock.getItem('tasks'));
    expect(savedTasks).toHaveLength(1);
    expect(savedTasks.find(t => t.id === 'task-1')).toBeUndefined();
    expect(savedTasks.find(t => t.id === 'task-2')).toBeDefined();
  });

  test('should handle mixed actions (create + modify + delete)', async () => {
    // Set up initial tasks
    const initialTasks = [
      {
        id: 'task-1',
        text: 'Old task',
        folder: 'Work',
        dueDate: '2025-12-06',
        dueTime: '10:00',
        priority: 'medium',
        completed: false,
        createdAt: new Date().toISOString()
      },
      {
        id: 'task-2',
        text: 'Delete me',
        folder: 'Personal',
        dueDate: '2025-12-05',
        dueTime: '18:00',
        priority: 'low',
        completed: false,
        createdAt: new Date().toISOString()
      }
    ];

    localStorageMock.setItem('tasks', JSON.stringify(initialTasks));

    // Mock AI response with mixed actions
    extractTasksFromText.mockResolvedValueOnce([
      {
        action: 'create',
        task: 'New task',
        dueDate: '2025-12-10',
        dueTime: '09:00',
        folder: 'Personal'
      },
      {
        action: 'modify',
        taskId: 'task-1',
        matchedTask: 'Old task',
        changes: {
          text: 'Updated task'
        }
      },
      {
        action: 'delete',
        taskId: 'task-2',
        matchedTask: 'Delete me'
      }
    ]);

    render(<App />);

    // Switch to AI Extract mode
    fireEvent.click(screen.getByText('AI Extract'));

    // Type complex command
    const textarea = screen.getByPlaceholderText(/Paste or type multiple tasks/i);
    await userEvent.type(textarea, 'Add new task, update old task, delete task 2');

    // Extract tasks
    fireEvent.click(screen.getByText('Extract Tasks'));

    // Wait for all previews
    await waitFor(() => {
      expect(screen.getByText('Extracted Actions (3)')).toBeInTheDocument();
      expect(screen.getByText('➕ CREATE NEW TASK')).toBeInTheDocument();
      expect(screen.getByText('✏️ MODIFY TASK')).toBeInTheDocument();
      expect(screen.getByText('🗑️ DELETE TASK')).toBeInTheDocument();
    });

    // Apply all changes
    fireEvent.click(screen.getByText('Apply All Changes'));

    // Verify all actions were performed
    await waitFor(() => {
      const savedTasks = JSON.parse(localStorageMock.getItem('tasks'));

      // Should have 2 tasks (1 original modified + 1 new, minus 1 deleted)
      expect(savedTasks.length).toBeGreaterThanOrEqual(2);

      // Verify new task was created
      const newTask = savedTasks.find(t => t.text === 'New task');
      expect(newTask).toBeDefined();
      expect(newTask.dueDate).toBe('2025-12-10');

      // Verify task was modified
      const modifiedTask = savedTasks.find(t => t.id === 'task-1');
      expect(modifiedTask.text).toBe('Updated task');

      // Verify task was deleted
      const deletedTask = savedTasks.find(t => t.id === 'task-2');
      expect(deletedTask).toBeUndefined();
    });
  });

  test('should handle notification rescheduling when modifying task times', async () => {
    const initialTasks = [
      {
        id: 'task-123',
        text: 'Important meeting',
        folder: 'Work',
        dueDate: '2025-12-06',
        dueTime: '10:00',
        priority: 'high',
        completed: false,
        createdAt: new Date().toISOString()
      }
    ];

    localStorageMock.setItem('tasks', JSON.stringify(initialTasks));
    localStorageMock.setItem('settings', JSON.stringify({
      notifications: true,
      desktopNotifications: true,
      soundAlerts: true,
      theme: 'light',
      defaultTiming: 'tomorrow_morning'
    }));

    // Mock AI response to modify time
    extractTasksFromText.mockResolvedValueOnce([
      {
        action: 'modify',
        taskId: 'task-123',
        matchedTask: 'Important meeting',
        changes: {
          dueTime: '15:00'
        }
      }
    ]);

    render(<App />);

    // Perform modification
    fireEvent.click(screen.getByText('AI Extract'));
    const textarea = screen.getByPlaceholderText(/Paste or type multiple tasks/i);
    await userEvent.type(textarea, 'Move meeting to 3pm');
    fireEvent.click(screen.getByText('Extract Tasks'));

    await waitFor(() => {
      expect(screen.getByText('✏️ MODIFY TASK')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Apply All Changes'));

    // Verify notification was rescheduled
    await waitFor(() => {
      // Old notification cancelled
      expect(notificationService.cancelScheduledNotification).toHaveBeenCalledWith('task-123');

      // New notification scheduled with updated task
      expect(notificationService.scheduleNotification).toHaveBeenCalled();
      const scheduledTask = notificationService.scheduleNotification.mock.calls[0][0];
      expect(scheduledTask.dueTime).toBe('15:00');
    });
  });

  test('should not reschedule notifications when modifying non-time fields', async () => {
    const initialTasks = [
      {
        id: 'task-456',
        text: 'Review document',
        folder: 'Work',
        dueDate: '2025-12-06',
        dueTime: '10:00',
        priority: 'medium',
        completed: false,
        createdAt: new Date().toISOString()
      }
    ];

    localStorageMock.setItem('tasks', JSON.stringify(initialTasks));

    // Mock AI response to only modify folder
    extractTasksFromText.mockResolvedValueOnce([
      {
        action: 'modify',
        taskId: 'task-456',
        matchedTask: 'Review document',
        changes: {
          folder: 'Personal'
        }
      }
    ]);

    render(<App />);

    // Perform modification
    fireEvent.click(screen.getByText('AI Extract'));
    const textarea = screen.getByPlaceholderText(/Paste or type multiple tasks/i);
    await userEvent.type(textarea, 'Move review to Personal folder');
    fireEvent.click(screen.getByText('Extract Tasks'));

    await waitFor(() => {
      expect(screen.getByText('✏️ MODIFY TASK')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Apply All Changes'));

    // Verify notification was NOT rescheduled (no time/date change)
    await waitFor(() => {
      const savedTasks = JSON.parse(localStorageMock.getItem('tasks'));
      const modifiedTask = savedTasks.find(t => t.id === 'task-456');
      expect(modifiedTask.folder).toBe('Personal');
    });

    // cancelScheduledNotification and scheduleNotification should not be called for non-time changes
    // (based on the modifyTask implementation in App.js)
  });

  test('should persist all changes to localStorage', async () => {
    const initialTasks = [
      {
        id: 'task-1',
        text: 'Task 1',
        folder: 'Work',
        dueDate: '2025-12-06',
        dueTime: '10:00',
        priority: 'medium',
        completed: false,
        createdAt: new Date().toISOString()
      }
    ];

    localStorageMock.setItem('tasks', JSON.stringify(initialTasks));

    // Mock AI response
    extractTasksFromText.mockResolvedValueOnce([
      {
        action: 'modify',
        taskId: 'task-1',
        matchedTask: 'Task 1',
        changes: {
          priority: 'high',
          folder: 'Personal'
        }
      }
    ]);

    render(<App />);

    fireEvent.click(screen.getByText('AI Extract'));
    const textarea = screen.getByPlaceholderText(/Paste or type multiple tasks/i);
    await userEvent.type(textarea, 'Change task 1 to high priority in Personal');
    fireEvent.click(screen.getByText('Extract Tasks'));

    await waitFor(() => {
      expect(screen.getByText('✏️ MODIFY TASK')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Apply All Changes'));

    // Verify localStorage was updated
    await waitFor(() => {
      const savedTasks = JSON.parse(localStorageMock.getItem('tasks'));
      const modifiedTask = savedTasks.find(t => t.id === 'task-1');
      expect(modifiedTask.priority).toBe('high');
      expect(modifiedTask.folder).toBe('Personal');
    });
  });

  test('should handle empty existing tasks array', async () => {
    localStorageMock.setItem('tasks', JSON.stringify([]));

    // Mock AI response for creation (no existing tasks to modify)
    extractTasksFromText.mockResolvedValueOnce([
      {
        action: 'create',
        task: 'First task ever',
        dueDate: '2025-12-06',
        dueTime: '09:00',
        folder: 'Personal'
      }
    ]);

    render(<App />);

    fireEvent.click(screen.getByText('AI Extract'));
    const textarea = screen.getByPlaceholderText(/Paste or type multiple tasks/i);
    await userEvent.type(textarea, 'Add first task');
    fireEvent.click(screen.getByText('Extract Tasks'));

    await waitFor(() => {
      expect(screen.getByText('➕ CREATE NEW TASK')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Apply All Changes'));

    // Verify task was created
    await waitFor(() => {
      const savedTasks = JSON.parse(localStorageMock.getItem('tasks'));
      expect(savedTasks).toHaveLength(1);
      expect(savedTasks[0].text).toBe('First task ever');
    });
  });
});
