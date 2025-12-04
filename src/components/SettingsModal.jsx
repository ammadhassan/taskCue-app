export default function SettingsModal({ isOpen, onClose, settings, onSave }) {
  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    onSave({
      notifications: formData.get('notifications') === 'on',
      desktopNotifications: formData.get('desktopNotifications') === 'on',
      soundAlerts: formData.get('soundAlerts') === 'on',
      theme: formData.get('theme'),
      defaultTiming: formData.get('defaultTiming'),
    });
    onClose();
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      await Notification.requestPermission();
      // Force re-render to update permission status
      window.location.reload();
    }
  };

  const notificationPermission = 'Notification' in window ? Notification.permission : 'unsupported';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 p-6 z-10">
        <h2 className="text-2xl font-bold mb-4 dark:text-white">Settings</h2>

        {/* Notification Permission Status Banner */}
        {notificationPermission === 'denied' && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-start gap-2">
              <span className="text-red-600 dark:text-red-400 text-lg">⚠️</span>
              <div className="flex-1">
                <p className="text-sm font-medium text-red-800 dark:text-red-200 mb-1">
                  Notifications are blocked
                </p>
                <p className="text-xs text-red-700 dark:text-red-300">
                  Please enable notifications in your browser settings to receive alerts.
                </p>
              </div>
            </div>
          </div>
        )}

        {notificationPermission === 'default' && (
          <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <div className="flex items-start gap-2">
              <span className="text-yellow-600 dark:text-yellow-400 text-lg">🔔</span>
              <div className="flex-1">
                <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                  Enable browser notifications
                </p>
                <button
                  type="button"
                  onClick={requestNotificationPermission}
                  className="px-3 py-1 bg-yellow-600 hover:bg-yellow-700 text-white rounded text-xs font-medium transition-colors"
                >
                  Allow Notifications
                </button>
              </div>
            </div>
          </div>
        )}

        {notificationPermission === 'granted' && settings.notifications && (
          <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <div className="flex items-center gap-2">
              <span className="text-green-600 dark:text-green-400 text-lg">✓</span>
              <p className="text-sm text-green-800 dark:text-green-200">
                Notifications are enabled and working
              </p>
            </div>
          </div>
        )}

        {notificationPermission === 'unsupported' && (
          <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg">
            <div className="flex items-center gap-2">
              <span className="text-gray-600 dark:text-gray-400 text-lg">ℹ️</span>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Your browser doesn't support notifications
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="flex items-center gap-2 dark:text-gray-200">
              <input
                type="checkbox"
                name="notifications"
                defaultChecked={settings.notifications}
                className="w-4 h-4"
              />
              <span>Enable Notifications</span>
            </label>
          </div>

          <div className="pl-6 space-y-2">
            <label className="flex items-center gap-2 dark:text-gray-200 text-sm">
              <input
                type="checkbox"
                name="desktopNotifications"
                defaultChecked={settings.desktopNotifications !== false}
                className="w-4 h-4"
              />
              <span>Desktop Notifications</span>
            </label>

            <label className="flex items-center gap-2 dark:text-gray-200 text-sm">
              <input
                type="checkbox"
                name="soundAlerts"
                defaultChecked={settings.soundAlerts !== false}
                className="w-4 h-4"
              />
              <span>Sound Alerts</span>
            </label>
          </div>

          <div>
            <label className="block mb-2 font-medium dark:text-gray-200">Theme</label>
            <select
              name="theme"
              defaultValue={settings.theme}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white"
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="auto">Auto</option>
            </select>
          </div>

          <div>
            <label className="block mb-2 font-medium dark:text-gray-200">
              Default Task Timing
            </label>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
              When you don't specify a date/time, tasks will default to:
            </p>
            <select
              name="defaultTiming"
              defaultValue={settings.defaultTiming || 'tomorrow_morning'}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white"
            >
              <option value="manual">Manual (no default - leave empty)</option>
              <option value="end_of_today">End of today (11:59 PM)</option>
              <option value="tomorrow_morning">Tomorrow morning (9:00 AM) ⭐ Recommended</option>
              <option value="next_business_day">Next business day (Mon-Fri 9:00 AM)</option>
              <option value="smart">Smart defaults (context-aware) 🤖</option>
            </select>
            {(settings.defaultTiming === 'smart' || !settings.defaultTiming || settings.defaultTiming === 'tomorrow_morning') && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 italic">
                💡 Tip: Smart defaults analyze your task (e.g., "buy groceries" → Saturday 10 AM)
              </p>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
