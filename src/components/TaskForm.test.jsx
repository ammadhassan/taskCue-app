import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TaskForm from './TaskForm';
import { extractTasksFromText } from '../services/taskExtractor';

// Mock the services
jest.mock('../services/taskExtractor');
jest.mock('../services/notificationService');
jest.mock('../services/calendarService');

describe('TaskForm - Task Modification Feature', () => {
  const mockFolders = ['All Tasks', 'Work', 'Personal', 'Shopping'];
  const mockSettings = {
    notifications: true,
    desktopNotifications: true,
    soundAlerts: true,
    theme: 'light',
    defaultTiming: 'tomorrow_morning'
  };

  const mockExistingTasks = [
    {
      id: 'task-1',
      text: 'Send email to Johannes',
      folder: 'Work',
      dueDate: '2025-12-06',
      dueTime: '10:00',
      priority: 'medium',
      completed: false
    },
    {
      id: 'task-2',
      text: 'Buy milk',
      folder: 'Shopping',
      dueDate: '2025-12-05',
      dueTime: '18:00',
      priority: 'low',
      completed: false
    },
    {
      id: 'task-3',
      text: 'Team meeting',
      folder: 'Work',
      dueDate: '2025-12-07',
      dueTime: '14:00',
      priority: 'high',
      completed: false
    }
  ];

  let mockOnAddTask;
  let mockOnModifyTask;
  let mockOnDeleteTask;

  beforeEach(() => {
    mockOnAddTask = jest.fn();
    mockOnModifyTask = jest.fn();
    mockOnDeleteTask = jest.fn();
    jest.clearAllMocks();
  });

  describe('AI Extract Mode with Task Modifications', () => {
    test('should switch to AI Extract mode when clicking AI Extract button', () => {
      render(
        <TaskForm
          onAddTask={mockOnAddTask}
          folders={mockFolders}
          selectedFolder="Personal"
          settings={mockSettings}
          tasks={mockExistingTasks}
          onModifyTask={mockOnModifyTask}
          onDeleteTask={mockOnDeleteTask}
        />
      );

      const aiButton = screen.getByText('AI Extract');
      fireEvent.click(aiButton);

      // Should show textarea for AI extraction
      expect(screen.getByPlaceholderText(/Paste or type multiple tasks/i)).toBeInTheDocument();
      expect(screen.getByText('Extract Tasks')).toBeInTheDocument();
    });

    test('should display CREATE action preview correctly', async () => {
      // Mock AI response for creating a new task
      extractTasksFromText.mockResolvedValueOnce([
        {
          action: 'create',
          task: 'Call the doctor',
          dueDate: '2025-12-06',
          dueTime: '09:00',
          folder: 'Personal'
        }
      ]);

      render(
        <TaskForm
          onAddTask={mockOnAddTask}
          folders={mockFolders}
          selectedFolder="Personal"
          settings={mockSettings}
          tasks={mockExistingTasks}
          onModifyTask={mockOnModifyTask}
          onDeleteTask={mockOnDeleteTask}
        />
      );

      // Switch to AI Extract mode
      fireEvent.click(screen.getByText('AI Extract'));

      // Type input
      const textarea = screen.getByPlaceholderText(/Paste or type multiple tasks/i);
      await userEvent.type(textarea, 'Add task: call the doctor tomorrow at 9am');

      // Click Extract Tasks
      fireEvent.click(screen.getByText('Extract Tasks'));

      // Wait for AI extraction
      await waitFor(() => {
        expect(extractTasksFromText).toHaveBeenCalledWith(
          'Add task: call the doctor tomorrow at 9am',
          'tomorrow_morning',
          mockExistingTasks
        );
      });

      // Should display CREATE action preview
      await waitFor(() => {
        expect(screen.getByText('➕ CREATE NEW TASK')).toBeInTheDocument();
        expect(screen.getByText('Call the doctor')).toBeInTheDocument();
        expect(screen.getByText('Apply All Changes')).toBeInTheDocument();
      });
    });

    test('should display MODIFY action preview correctly', async () => {
      // Mock AI response for modifying an existing task
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

      render(
        <TaskForm
          onAddTask={mockOnAddTask}
          folders={mockFolders}
          selectedFolder="Personal"
          settings={mockSettings}
          tasks={mockExistingTasks}
          onModifyTask={mockOnModifyTask}
          onDeleteTask={mockOnDeleteTask}
        />
      );

      // Switch to AI Extract mode
      fireEvent.click(screen.getByText('AI Extract'));

      // Type modification command
      const textarea = screen.getByPlaceholderText(/Paste or type multiple tasks/i);
      await userEvent.type(textarea, 'Move my email task to tomorrow at 3pm');

      // Click Extract Tasks
      fireEvent.click(screen.getByText('Extract Tasks'));

      // Wait for AI extraction
      await waitFor(() => {
        expect(extractTasksFromText).toHaveBeenCalled();
      });

      // Should display MODIFY action preview
      await waitFor(() => {
        expect(screen.getByText('✏️ MODIFY TASK')).toBeInTheDocument();
        expect(screen.getByText(/Send email to Johannes/)).toBeInTheDocument();
        expect(screen.getByText('2025-12-06')).toBeInTheDocument(); // Old date
        expect(screen.getByText('2025-12-07')).toBeInTheDocument(); // New date
        expect(screen.getByText('Cancel Change')).toBeInTheDocument();
      });
    });

    test('should display DELETE action preview correctly', async () => {
      // Mock AI response for deleting a task
      extractTasksFromText.mockResolvedValueOnce([
        {
          action: 'delete',
          taskId: 'task-2',
          matchedTask: 'Buy milk'
        }
      ]);

      render(
        <TaskForm
          onAddTask={mockOnAddTask}
          folders={mockFolders}
          selectedFolder="Personal"
          settings={mockSettings}
          tasks={mockExistingTasks}
          onModifyTask={mockOnModifyTask}
          onDeleteTask={mockOnDeleteTask}
        />
      );

      // Switch to AI Extract mode
      fireEvent.click(screen.getByText('AI Extract'));

      // Type deletion command
      const textarea = screen.getByPlaceholderText(/Paste or type multiple tasks/i);
      await userEvent.type(textarea, 'Cancel the milk shopping');

      // Click Extract Tasks
      fireEvent.click(screen.getByText('Extract Tasks'));

      // Wait for AI extraction
      await waitFor(() => {
        expect(extractTasksFromText).toHaveBeenCalled();
      });

      // Should display DELETE action preview
      await waitFor(() => {
        expect(screen.getByText('🗑️ DELETE TASK')).toBeInTheDocument();
        expect(screen.getByText(/Buy milk/)).toBeInTheDocument();
        expect(screen.getByText('Keep Task')).toBeInTheDocument();
      });
    });

    test('should handle multiple actions (create, modify, delete) in one extraction', async () => {
      // Mock AI response with multiple actions
      extractTasksFromText.mockResolvedValueOnce([
        {
          action: 'create',
          task: 'Prepare presentation',
          dueDate: '2025-12-08',
          dueTime: '11:00',
          folder: 'Work'
        },
        {
          action: 'modify',
          taskId: 'task-3',
          matchedTask: 'Team meeting',
          changes: {
            dueTime: '16:00'
          }
        },
        {
          action: 'delete',
          taskId: 'task-2',
          matchedTask: 'Buy milk'
        }
      ]);

      render(
        <TaskForm
          onAddTask={mockOnAddTask}
          folders={mockFolders}
          selectedFolder="Personal"
          settings={mockSettings}
          tasks={mockExistingTasks}
          onModifyTask={mockOnModifyTask}
          onDeleteTask={mockOnDeleteTask}
        />
      );

      // Switch to AI Extract mode
      fireEvent.click(screen.getByText('AI Extract'));

      // Type complex command
      const textarea = screen.getByPlaceholderText(/Paste or type multiple tasks/i);
      await userEvent.type(textarea, 'Add prepare presentation, move meeting to 4pm, cancel milk task');

      // Click Extract Tasks
      fireEvent.click(screen.getByText('Extract Tasks'));

      // Wait for AI extraction
      await waitFor(() => {
        expect(extractTasksFromText).toHaveBeenCalled();
      });

      // Should display all three action types
      await waitFor(() => {
        expect(screen.getByText('Extracted Actions (3)')).toBeInTheDocument();
        expect(screen.getByText('➕ CREATE NEW TASK')).toBeInTheDocument();
        expect(screen.getByText('✏️ MODIFY TASK')).toBeInTheDocument();
        expect(screen.getByText('🗑️ DELETE TASK')).toBeInTheDocument();
      });
    });

    test('should call appropriate callbacks when applying changes', async () => {
      // Mock AI response with all action types
      extractTasksFromText.mockResolvedValueOnce([
        {
          action: 'create',
          task: 'New task',
          dueDate: '2025-12-10',
          dueTime: '10:00',
          folder: 'Personal'
        },
        {
          action: 'modify',
          taskId: 'task-1',
          matchedTask: 'Send email to Johannes',
          changes: {
            dueDate: '2025-12-08'
          }
        },
        {
          action: 'delete',
          taskId: 'task-2',
          matchedTask: 'Buy milk'
        }
      ]);

      render(
        <TaskForm
          onAddTask={mockOnAddTask}
          folders={mockFolders}
          selectedFolder="Personal"
          settings={mockSettings}
          tasks={mockExistingTasks}
          onModifyTask={mockOnModifyTask}
          onDeleteTask={mockOnDeleteTask}
        />
      );

      // Switch to AI Extract mode
      fireEvent.click(screen.getByText('AI Extract'));

      // Type input
      const textarea = screen.getByPlaceholderText(/Paste or type multiple tasks/i);
      await userEvent.type(textarea, 'Add new task, move email to Friday, delete milk');

      // Click Extract Tasks
      fireEvent.click(screen.getByText('Extract Tasks'));

      // Wait for previews to appear
      await waitFor(() => {
        expect(screen.getByText('Apply All Changes')).toBeInTheDocument();
      });

      // Click Apply All Changes
      fireEvent.click(screen.getByText('Apply All Changes'));

      // Verify callbacks were called
      expect(mockOnAddTask).toHaveBeenCalledWith('New task', 'Personal', '2025-12-10', 'medium', '10:00');
      expect(mockOnModifyTask).toHaveBeenCalledWith('task-1', { dueDate: '2025-12-08' });
      expect(mockOnDeleteTask).toHaveBeenCalledWith('task-2');
    });

    test('should allow removing individual actions from preview', async () => {
      // Mock AI response with two actions
      extractTasksFromText.mockResolvedValueOnce([
        {
          action: 'create',
          task: 'Task 1',
          dueDate: '2025-12-10',
          dueTime: '10:00',
          folder: 'Personal'
        },
        {
          action: 'delete',
          taskId: 'task-2',
          matchedTask: 'Buy milk'
        }
      ]);

      render(
        <TaskForm
          onAddTask={mockOnAddTask}
          folders={mockFolders}
          selectedFolder="Personal"
          settings={mockSettings}
          tasks={mockExistingTasks}
          onModifyTask={mockOnModifyTask}
          onDeleteTask={mockOnDeleteTask}
        />
      );

      // Switch to AI Extract mode
      fireEvent.click(screen.getByText('AI Extract'));

      // Extract tasks
      const textarea = screen.getByPlaceholderText(/Paste or type multiple tasks/i);
      await userEvent.type(textarea, 'Add task 1, delete milk');
      fireEvent.click(screen.getByText('Extract Tasks'));

      // Wait for both actions to appear
      await waitFor(() => {
        expect(screen.getByText('Extracted Actions (2)')).toBeInTheDocument();
      });

      // Remove the delete action by clicking "Keep Task"
      const keepTaskButton = screen.getByText('Keep Task');
      fireEvent.click(keepTaskButton);

      // Should only have 1 action left
      await waitFor(() => {
        expect(screen.getByText('Extracted Actions (1)')).toBeInTheDocument();
        expect(screen.queryByText('🗑️ DELETE TASK')).not.toBeInTheDocument();
      });

      // Apply changes - only create should be called
      fireEvent.click(screen.getByText('Apply All Changes'));
      expect(mockOnAddTask).toHaveBeenCalledTimes(1);
      expect(mockOnDeleteTask).not.toHaveBeenCalled();
    });

    test('should handle AI extraction errors gracefully', async () => {
      // Mock AI error
      extractTasksFromText.mockRejectedValueOnce(new Error('AI service unavailable'));

      // Mock window.alert
      window.alert = jest.fn();

      render(
        <TaskForm
          onAddTask={mockOnAddTask}
          folders={mockFolders}
          selectedFolder="Personal"
          settings={mockSettings}
          tasks={mockExistingTasks}
          onModifyTask={mockOnModifyTask}
          onDeleteTask={mockOnDeleteTask}
        />
      );

      // Switch to AI Extract mode
      fireEvent.click(screen.getByText('AI Extract'));

      // Type input
      const textarea = screen.getByPlaceholderText(/Paste or type multiple tasks/i);
      await userEvent.type(textarea, 'Some input');

      // Click Extract Tasks
      fireEvent.click(screen.getByText('Extract Tasks'));

      // Wait for error handling
      await waitFor(() => {
        expect(window.alert).toHaveBeenCalledWith('AI service unavailable');
      });
    });

    test('should pass existing tasks to AI extraction function', async () => {
      // Mock AI response to return a valid action
      extractTasksFromText.mockResolvedValueOnce([
        {
          action: 'modify',
          taskId: 'task-1',
          matchedTask: 'Send email to Johannes',
          changes: { dueDate: '2025-12-07' }
        }
      ]);

      render(
        <TaskForm
          onAddTask={mockOnAddTask}
          folders={mockFolders}
          selectedFolder="Personal"
          settings={mockSettings}
          tasks={mockExistingTasks}
          onModifyTask={mockOnModifyTask}
          onDeleteTask={mockOnDeleteTask}
        />
      );

      // Switch to AI Extract mode
      fireEvent.click(screen.getByText('AI Extract'));

      // Type input
      const textarea = screen.getByPlaceholderText(/Paste or type multiple tasks/i);
      await userEvent.type(textarea, 'Move my email task');

      // Click Extract Tasks
      fireEvent.click(screen.getByText('Extract Tasks'));

      // Verify existing tasks were passed to AI
      await waitFor(() => {
        expect(extractTasksFromText).toHaveBeenCalledWith(
          'Move my email task',
          'tomorrow_morning',
          mockExistingTasks
        );
      });
    });
  });

  describe('Backward Compatibility', () => {
    test('should handle old task format (without action field)', async () => {
      // Mock AI response in old format (backward compatibility)
      extractTasksFromText.mockResolvedValueOnce([
        {
          // Old format without 'action' field
          task: 'Old format task',
          dueDate: '2025-12-06',
          dueTime: '09:00',
          folder: 'Personal'
        }
      ]);

      render(
        <TaskForm
          onAddTask={mockOnAddTask}
          folders={mockFolders}
          selectedFolder="Personal"
          settings={mockSettings}
          tasks={mockExistingTasks}
          onModifyTask={mockOnModifyTask}
          onDeleteTask={mockOnDeleteTask}
        />
      );

      // Switch to AI Extract mode
      fireEvent.click(screen.getByText('AI Extract'));

      // Extract tasks
      const textarea = screen.getByPlaceholderText(/Paste or type multiple tasks/i);
      await userEvent.type(textarea, 'Some task');
      fireEvent.click(screen.getByText('Extract Tasks'));

      // Wait for extraction
      await waitFor(() => {
        expect(screen.getByText('Old format task')).toBeInTheDocument();
      });

      // Apply - should create task
      fireEvent.click(screen.getByText('Apply All Changes'));
      expect(mockOnAddTask).toHaveBeenCalled();
    });
  });
});
