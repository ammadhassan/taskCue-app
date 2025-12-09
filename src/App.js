import { useState, useEffect } from 'react';
import './App.css';
import TaskForm from './components/TaskForm';
import TaskList from './components/TaskList';
import SettingsModal from './components/SettingsModal';
import FolderSidebar from './components/FolderSidebar';
import { notificationService } from './services/notificationService';
import { exportAllTasksToCalendar, exportFolderToCalendar } from './services/calendarService';

function App() {
  // Load tasks from localStorage
  const [tasks, setTasks] = useState(() => {
    const saved = localStorage.getItem('tasks');
    return saved ? JSON.parse(saved) : [];
  });

  // Load settings from localStorage
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('settings');
    return saved
      ? JSON.parse(saved)
      : {
          notifications: true,
          desktopNotifications: true,
          soundAlerts: true,
          theme: 'light',
          defaultTiming: 'tomorrow_morning' // New setting for default date/time
        };
  });

  // Load folders from localStorage
  const [folders, setFolders] = useState(() => {
    const saved = localStorage.getItem('folders');
    return saved
      ? JSON.parse(saved)
      : ['All Tasks', 'Work', 'Personal', 'Shopping'];
  });

  const [selectedFolder, setSelectedFolder] = useState('All Tasks');
  const [showSettings, setShowSettings] = useState(false);
  const [sortBy, setSortBy] = useState('createdAt'); // 'createdAt', 'dueDate', 'priority'

  // Save tasks to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('tasks', JSON.stringify(tasks));
  }, [tasks]);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('settings', JSON.stringify(settings));
  }, [settings]);

  // Save folders to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('folders', JSON.stringify(folders));
  }, [folders]);

  // Apply theme
  useEffect(() => {
    const root = document.documentElement;
    if (settings.theme === 'dark') {
      root.classList.add('dark');
    } else if (settings.theme === 'light') {
      root.classList.remove('dark');
    } else {
      // Auto mode - check system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
  }, [settings.theme]);

  // Initialize notifications
  useEffect(() => {
    if (settings.notifications && settings.desktopNotifications) {
      notificationService.requestPermission();
    }
    notificationService.setSoundEnabled(settings.soundAlerts !== false);
  }, [settings.notifications, settings.desktopNotifications, settings.soundAlerts]);

  // Restore scheduled notifications on app load
  useEffect(() => {
    if (!settings.notifications) return;

    // Loop through all incomplete tasks with due date and time
    tasks.forEach((task) => {
      if (!task.completed && task.dueDate && task.dueTime) {
        // Re-schedule notification for this task (with settings for multi-channel)
        notificationService.scheduleNotification(task, settings);
      }
    });

    // Cleanup: cancel all scheduled notifications when component unmounts
    return () => {
      notificationService.clearAllScheduled();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount (empty dependency array)

  // Check for overdue/upcoming tasks periodically
  useEffect(() => {
    if (!settings.notifications) return;

    // Check immediately on mount
    notificationService.checkTasks(tasks);

    // Check every 30 minutes
    const interval = setInterval(() => {
      notificationService.checkTasks(tasks);
    }, 30 * 60 * 1000);

    return () => clearInterval(interval);
  }, [tasks, settings.notifications]);

  const addTask = (text, folder = 'Personal', dueDate = null, priority = 'medium', dueTime = null) => {
    // 🔍 DEBUG LOG
    console.log('➕ [App addTask] Called:', {
      text,
      folder,
      dueDate,
      dueTime,
      priority,
      hasSmartDefaults: !!(dueDate && dueTime),
      timestamp: new Date().toISOString()
    });

    const newTask = {
      id: crypto.randomUUID(),
      text,
      folder,
      dueDate,
      dueTime,
      priority,
      completed: false,
      createdAt: new Date().toISOString(),
    };

    // Use functional update to avoid race condition when adding multiple tasks rapidly
    setTasks(prevTasks => {
      const updatedTasks = [newTask, ...prevTasks];

      // Schedule notification if task has time and notifications are enabled
      if (settings.notifications && newTask.dueDate && newTask.dueTime) {
        notificationService.scheduleNotification(newTask, settings);
      }

      // Also trigger immediate check for overdue/upcoming tasks
      if (settings.notifications) {
        notificationService.checkTasks(updatedTasks);
      }

      return updatedTasks;
    });
  };

  const toggleTask = (id) => {
    setTasks(
      tasks.map((task) => {
        if (task.id === id) {
          const updatedTask = { ...task, completed: !task.completed };
          // Notify on completion
          if (updatedTask.completed && settings.notifications) {
            notificationService.notifyTask(updatedTask, 'completed');
            // Cancel scheduled notification since task is completed
            notificationService.cancelScheduledNotification(id);
          }
          return updatedTask;
        }
        return task;
      })
    );
  };

  const deleteTask = (id) => {
    // Cancel scheduled notification when deleting
    notificationService.cancelScheduledNotification(id);
    setTasks(tasks.filter((task) => task.id !== id));
  };

  const modifyTask = (id, changes) => {
    setTasks(
      tasks.map((task) => {
        if (task.id === id) {
          const updatedTask = { ...task, ...changes };

          // If date or time changed, reschedule notification
          if (settings.notifications && (changes.dueDate || changes.dueTime)) {
            notificationService.cancelScheduledNotification(id);
            if (updatedTask.dueDate && updatedTask.dueTime) {
              notificationService.scheduleNotification(updatedTask, settings);
            }
          }

          return updatedTask;
        }
        return task;
      })
    );
  };

  const saveSettings = (newSettings) => {
    setSettings(newSettings);
  };

  const addFolder = (folderName) => {
    if (!folders.includes(folderName) && folderName.trim()) {
      setFolders([...folders, folderName.trim()]);
    }
  };

  const deleteFolder = (folderName) => {
    if (['All Tasks', 'Work', 'Personal', 'Shopping'].includes(folderName)) {
      return; // Don't allow deleting default folders
    }
    setFolders(folders.filter((f) => f !== folderName));
    // Move tasks from deleted folder to 'Personal'
    setTasks(
      tasks.map((task) =>
        task.folder === folderName ? { ...task, folder: 'Personal' } : task
      )
    );
    if (selectedFolder === folderName) {
      setSelectedFolder('All Tasks');
    }
  };

  const handleExportToCalendar = () => {
    try {
      if (selectedFolder === 'All Tasks') {
        exportAllTasksToCalendar(tasks);
      } else {
        exportFolderToCalendar(tasks, selectedFolder);
      }
      alert('✅ Calendar file downloaded! Open it to add tasks to your calendar.');
    } catch (error) {
      alert(error.message || 'Failed to export tasks to calendar');
    }
  };

  // Filter tasks by selected folder
  const filteredTasks =
    selectedFolder === 'All Tasks'
      ? tasks
      : tasks.filter((task) => task.folder === selectedFolder);

  // Sort tasks
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (sortBy === 'dueDate') {
      // Tasks without due dates go to the end
      if (!a.dueDate && !b.dueDate) return 0;
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate) - new Date(b.dueDate);
    } else if (sortBy === 'priority') {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    } else {
      // Sort by creation date (newest first)
      return new Date(b.createdAt) - new Date(a.createdAt);
    }
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors flex">
      {/* Folder Sidebar */}
      <FolderSidebar
        folders={folders}
        selectedFolder={selectedFolder}
        onSelectFolder={setSelectedFolder}
        onAddFolder={addFolder}
        onDeleteFolder={deleteFolder}
        tasks={tasks}
      />

      {/* Main Content */}
      <div className="flex-1 p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
              Task Assistant
            </h1>
            <div className="flex gap-3">
              <button
                onClick={handleExportToCalendar}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                title="Export tasks to calendar"
              >
                📅 Export to Calendar
              </button>
              <button
                onClick={() => setShowSettings(true)}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Settings
              </button>
            </div>
          </div>

          {/* Task Form */}
          <TaskForm
            onAddTask={addTask}
            folders={folders}
            selectedFolder={selectedFolder}
            settings={settings}
            tasks={tasks}
            onModifyTask={modifyTask}
            onDeleteTask={deleteTask}
            onAddFolder={addFolder}
            onDeleteFolder={deleteFolder}
          />

          {/* Task Stats */}
          <div className="mb-4 flex items-center justify-between">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {filteredTasks.filter((t) => !t.completed).length} active ·{' '}
              {filteredTasks.filter((t) => t.completed).length} completed ·{' '}
              {filteredTasks.length} total
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600 dark:text-gray-400">
                Sort by:
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="createdAt">Created Date</option>
                <option value="dueDate">Due Date</option>
                <option value="priority">Priority</option>
              </select>
            </div>
          </div>

          {/* Task List */}
          <TaskList
            tasks={sortedTasks}
            onToggle={toggleTask}
            onDelete={deleteTask}
            onModify={modifyTask}
            folders={folders}
          />

          {/* Settings Modal */}
          <SettingsModal
            isOpen={showSettings}
            onClose={() => setShowSettings(false)}
            settings={settings}
            onSave={saveSettings}
          />
        </div>
      </div>
    </div>
  );
}

export default App;
