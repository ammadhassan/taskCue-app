import { useState, useEffect } from 'react';
import './App.css';
import TaskForm from './components/TaskForm';
import TaskList from './components/TaskList';
import SettingsModal from './components/SettingsModal';
import DashboardHeader from './components/DashboardHeader';
import ProductivityChart from './components/ProductivityChart';
import PriorityBreakdown from './components/PriorityBreakdown';
import TodaysFocus from './components/TodaysFocus';
import QuickActions from './components/QuickActions';
import ViewTabs from './components/ViewTabs';
import CalendarView from './components/CalendarView';
import LoadingSpinner from './components/LoadingSpinner';
import Auth from './components/Auth';
import { AuthContextProvider, useAuth } from './contexts/AuthContext';
import { notificationService } from './services/notificationService';
import { exportAllTasksToCalendar, exportFolderToCalendar } from './services/calendarService';

// Main App wrapper with Auth Context
function App() {
  return (
    <AuthContextProvider>
      <AppContent />
    </AuthContextProvider>
  );
}

// App content - only shown when authenticated
function AppContent() {
  const { session, loading } = useAuth();

  // Show loading spinner while checking authentication
  if (loading) {
    return <LoadingSpinner />;
  }

  // Show login page if not authenticated
  if (!session) {
    return <Auth />;
  }

  // Show main app if authenticated
  return <MainApp />;
}

// Main application logic
function MainApp() {
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
  const [currentView, setCurrentView] = useState('list'); // 'list' or 'calendar'

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
    console.log('🔧 [APP] Initializing notifications. Settings:', {
      notifications: settings.notifications,
      desktopNotifications: settings.desktopNotifications,
      soundAlerts: settings.soundAlerts
    });

    if (settings.notifications && settings.desktopNotifications) {
      console.log('🔔 [APP] Requesting notification permission...');
      notificationService.requestPermission().then((granted) => {
        console.log(`🔔 [APP] Permission ${granted ? 'GRANTED ✅' : 'DENIED ❌'}`);
      });
    } else {
      console.log('⚠️ [APP] Notifications disabled in settings');
    }

    notificationService.setSoundEnabled(settings.soundAlerts !== false);
  }, [settings.notifications, settings.desktopNotifications, settings.soundAlerts]);

  // Restore scheduled notifications on app load
  useEffect(() => {
    console.log('🔄 [APP] Restoring scheduled notifications on app load...');
    console.log(`🔄 [APP] Total tasks: ${tasks.length}, Notifications enabled: ${settings.notifications}`);

    if (!settings.notifications) {
      console.log('⚠️ [APP] Notifications disabled - skipping restoration');
      return;
    }

    // Loop through all incomplete tasks with due date and time
    let scheduledCount = 0;
    tasks.forEach((task) => {
      if (!task.completed && task.dueDate && task.dueTime) {
        console.log(`🔄 [APP] Restoring notification for task: "${task.text}"`);
        // Re-schedule notification for this task (with settings for multi-channel)
        notificationService.scheduleNotification(task, settings);
        scheduledCount++;
      }
    });

    console.log(`✅ [APP] Restored ${scheduledCount} notifications`);

    // Cleanup: cancel all scheduled notifications when component unmounts
    return () => {
      console.log('🧹 [APP] Cleaning up scheduled notifications...');
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

      console.log(`🔔 [APP] Task added. Checking if notification should be scheduled...`);
      console.log(`🔔 [APP] Notifications enabled: ${settings.notifications}`);
      console.log(`🔔 [APP] Task has date: ${!!newTask.dueDate}, has time: ${!!newTask.dueTime}`);

      // Schedule notification if task has time and notifications are enabled
      if (settings.notifications && newTask.dueDate && newTask.dueTime) {
        console.log(`🔔 [APP] Scheduling notification for new task: "${newTask.text}"`);
        notificationService.scheduleNotification(newTask, settings);
      } else {
        console.log(`⚠️ [APP] NOT scheduling notification (notifications: ${settings.notifications}, hasDate: ${!!newTask.dueDate}, hasTime: ${!!newTask.dueTime})`);
      }

      // NOTE: Removed immediate checkTasks() call here to prevent unexpected sounds when adding tasks.
      // The periodic check (every 30 min) and scheduled notifications will handle reminders.

      return updatedTasks;
    });
  };

  const toggleTask = (id) => {
    setTasks(
      tasks.map((task) => {
        if (task.id === id) {
          const updatedTask = { ...task, completed: !task.completed };
          // Cancel scheduled notification when task is completed (no completion sound)
          if (updatedTask.completed) {
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 transition-colors">
      <div className="max-w-7xl mx-auto p-4 md:p-6">
        {/* Dashboard Header */}
        <DashboardHeader
          tasks={tasks}
          onSettingsClick={() => setShowSettings(true)}
          onExportClick={handleExportToCalendar}
        />

        {/* HERO: Task Input Section - Elegant & Prominent */}
        <div className="mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg border-l-4 border-blue-500 dark:border-blue-400 hover:shadow-xl transition-shadow duration-300">
            {/* Header */}
            <div className="mb-6">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
                Add New Task
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm md:text-base">
                Type naturally, use voice input, or let AI extract tasks from your message
              </p>
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
          </div>
        </div>

        {/* Main Dashboard Grid - 3 columns on desktop, stacked on mobile */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Sidebar - Quick Actions & Today's Focus */}
          <div className="lg:col-span-3 space-y-6">
            {/* Quick Actions */}
            <QuickActions
              folders={folders}
              selectedFolder={selectedFolder}
              onSelectFolder={setSelectedFolder}
            />

            {/* Today's Focus */}
            <TodaysFocus
              tasks={tasks}
              onToggle={toggleTask}
            />
          </div>

          {/* Center Column - Task List */}
          <div className="lg:col-span-6 space-y-6">
            {/* Task List Header with View Tabs */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-md">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                    {selectedFolder}
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {filteredTasks.filter((t) => !t.completed).length} active ·{' '}
                    {filteredTasks.filter((t) => t.completed).length} completed ·{' '}
                    {filteredTasks.length} total
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  {/* View Tabs */}
                  <ViewTabs activeView={currentView} onViewChange={setCurrentView} />

                  {/* Sort Dropdown (only show in list view) */}
                  {currentView === 'list' && (
                    <div className="flex items-center gap-2">
                      <label className="text-sm text-gray-600 dark:text-gray-400">
                        Sort:
                      </label>
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="createdAt">Created</option>
                        <option value="dueDate">Due Date</option>
                        <option value="priority">Priority</option>
                      </select>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Conditional View Rendering */}
            {currentView === 'list' ? (
              /* List View */
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-md">
                <TaskList
                  tasks={sortedTasks}
                  onToggle={toggleTask}
                  onDelete={deleteTask}
                  onModify={modifyTask}
                  folders={folders}
                />
              </div>
            ) : (
              /* Calendar View */
              <CalendarView
                tasks={filteredTasks}
                onToggle={toggleTask}
                onDelete={deleteTask}
                onModify={modifyTask}
                onAddTask={addTask}
                folders={folders}
                selectedFolder={selectedFolder}
              />
            )}
          </div>

          {/* Right Sidebar - Analytics & Charts */}
          <div className="lg:col-span-3 space-y-6">
            {/* Priority Breakdown */}
            <PriorityBreakdown tasks={tasks} />

            {/* Productivity Chart */}
            <ProductivityChart tasks={tasks} />
          </div>
        </div>

        {/* Settings Modal */}
        <SettingsModal
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
          settings={settings}
          onSave={saveSettings}
        />
      </div>
    </div>
  );
}

export default App;
