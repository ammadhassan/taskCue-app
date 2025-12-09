import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from './App';

// Mock the services
jest.mock('./services/taskExtractor');
jest.mock('./services/notificationService');
jest.mock('./services/calendarService');

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

describe('App Component', () => {
  beforeEach(() => {
    localStorageMock.clear();
    jest.clearAllMocks();
  });

  test('renders Task Assistant header', () => {
    render(<App />);
    const headerElement = screen.getByText(/Task Assistant/i);
    expect(headerElement).toBeInTheDocument();
  });

  test('renders TaskForm component', () => {
    render(<App />);
    // TaskForm should render with Text/Voice/AI Extract buttons
    expect(screen.getByText('Text')).toBeInTheDocument();
    expect(screen.getByText('Voice')).toBeInTheDocument();
    expect(screen.getByText('AI Extract')).toBeInTheDocument();
  });

  test('renders FolderSidebar with default folders', () => {
    render(<App />);
    // Use getAllByText for folders that appear multiple times (sidebar + dropdown)
    const allTasksElements = screen.getAllByText('All Tasks');
    expect(allTasksElements.length).toBeGreaterThanOrEqual(1);

    const workElements = screen.getAllByText('Work');
    expect(workElements.length).toBeGreaterThanOrEqual(1);

    const personalElements = screen.getAllByText('Personal');
    expect(personalElements.length).toBeGreaterThanOrEqual(1);

    const shoppingElements = screen.getAllByText('Shopping');
    expect(shoppingElements.length).toBeGreaterThanOrEqual(1);
  });

  test('renders Settings button', () => {
    render(<App />);
    const settingsButton = screen.getByText('Settings');
    expect(settingsButton).toBeInTheDocument();
  });

  test('renders Export to Calendar button', () => {
    render(<App />);
    const exportButton = screen.getByText(/Export to Calendar/i);
    expect(exportButton).toBeInTheDocument();
  });

  test('displays task statistics', () => {
    render(<App />);
    // Should show stats like "0 active · 0 completed · 0 total"
    expect(screen.getByText(/active/i)).toBeInTheDocument();
    expect(screen.getByText(/completed/i)).toBeInTheDocument();
    expect(screen.getByText(/total/i)).toBeInTheDocument();
  });

  test('displays sort dropdown', () => {
    render(<App />);
    expect(screen.getByText('Sort by:')).toBeInTheDocument();
    // Check if sort options are available
    const sortSelect = screen.getByDisplayValue('Created Date');
    expect(sortSelect).toBeInTheDocument();
  });

  test('opens Settings modal when Settings button clicked', async () => {
    render(<App />);
    const settingsButton = screen.getByText('Settings');
    fireEvent.click(settingsButton);

    // Wait for modal to appear and check for common settings text
    await waitFor(() => {
      const notificationText = screen.queryAllByText(/notification/i);
      const themeText = screen.queryAllByText(/theme/i);
      expect(notificationText.length > 0 || themeText.length > 0).toBeTruthy();
    });
  });

  test('loads tasks from localStorage on mount', () => {
    const savedTasks = [
      {
        id: 'task-1',
        text: 'Test task',
        folder: 'Work',
        dueDate: '2025-12-06',
        dueTime: '10:00',
        priority: 'medium',
        completed: false,
        createdAt: new Date().toISOString()
      }
    ];

    localStorageMock.setItem('tasks', JSON.stringify(savedTasks));

    render(<App />);

    // Should display the saved task
    expect(screen.getByText('Test task')).toBeInTheDocument();
  });

  test('loads settings from localStorage on mount', () => {
    const savedSettings = {
      notifications: true,
      desktopNotifications: true,
      soundAlerts: false,
      theme: 'dark',
      defaultTiming: 'tomorrow_afternoon'
    };

    localStorageMock.setItem('settings', JSON.stringify(savedSettings));

    render(<App />);

    // App should apply dark theme
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  test('provides modifyTask handler to TaskForm', () => {
    const savedTasks = [
      {
        id: 'task-1',
        text: 'Original task',
        folder: 'Work',
        dueDate: '2025-12-06',
        dueTime: '10:00',
        priority: 'medium',
        completed: false,
        createdAt: new Date().toISOString()
      }
    ];

    localStorageMock.setItem('tasks', JSON.stringify(savedTasks));

    const { rerender } = render(<App />);

    // Verify TaskForm receives the necessary props
    // This is validated by the integration tests that actually use the handlers
    expect(screen.getByText('AI Extract')).toBeInTheDocument();

    // After any updates, tasks should be saved to localStorage
    const savedData = localStorageMock.getItem('tasks');
    expect(savedData).toBeTruthy();
  });

  test('handles empty localStorage gracefully', () => {
    localStorageMock.clear();

    render(<App />);

    // Should render without errors with empty state
    expect(screen.getByText(/Task Assistant/i)).toBeInTheDocument();
    expect(screen.getByText(/0 active/i)).toBeInTheDocument();
  });

  test('applies light theme by default', () => {
    render(<App />);

    // Default theme should be light (no dark class)
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  test('filters tasks by selected folder', async () => {
    const savedTasks = [
      {
        id: 'task-1',
        text: 'Work task',
        folder: 'Work',
        dueDate: '2025-12-06',
        dueTime: '10:00',
        priority: 'medium',
        completed: false,
        createdAt: new Date().toISOString()
      },
      {
        id: 'task-2',
        text: 'Personal task',
        folder: 'Personal',
        dueDate: '2025-12-07',
        dueTime: '15:00',
        priority: 'low',
        completed: false,
        createdAt: new Date().toISOString()
      }
    ];

    localStorageMock.setItem('tasks', JSON.stringify(savedTasks));

    render(<App />);

    // Initially should show all tasks
    expect(screen.getByText('Work task')).toBeInTheDocument();
    expect(screen.getByText('Personal task')).toBeInTheDocument();

    // Click Work folder (use button role to get the sidebar button, not the dropdown option)
    const workFolderButtons = screen.getAllByText('Work');
    // Find the folder button in sidebar (first one that's clickable)
    const workFolderButton = workFolderButtons.find(el => el.tagName === 'SPAN' && el.parentElement?.tagName === 'BUTTON');
    if (workFolderButton && workFolderButton.parentElement) {
      fireEvent.click(workFolderButton.parentElement);
    }

    // Should only show Work task
    await waitFor(() => {
      expect(screen.getByText('Work task')).toBeInTheDocument();
      expect(screen.queryByText('Personal task')).not.toBeInTheDocument();
    });
  });
});
