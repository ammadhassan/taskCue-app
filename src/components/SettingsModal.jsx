import { useState } from 'react';

export default function SettingsModal({ isOpen, onClose, settings, onSave }) {
  const [testingEmail, setTestingEmail] = useState(false);
  const [testingSMS, setTestingSMS] = useState(false);
  const [testResult, setTestResult] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    onSave({
      notifications: formData.get('notifications') === 'on',
      desktopNotifications: formData.get('desktopNotifications') === 'on',
      emailNotifications: formData.get('emailNotifications') === 'on',
      smsNotifications: formData.get('smsNotifications') === 'on',
      soundAlerts: formData.get('soundAlerts') === 'on',
      email: formData.get('email') || '',
      phoneNumber: formData.get('phoneNumber') || '',
      theme: formData.get('theme'),
      defaultTiming: formData.get('defaultTiming'),
    });
    onClose();
  };

  const handleTestEmail = async () => {
    const emailInput = document.querySelector('input[name="email"]');
    const email = emailInput?.value;

    if (!email) {
      setTestResult({ type: 'error', message: 'Please enter an email address first' });
      return;
    }

    setTestingEmail(true);
    setTestResult(null);

    try {
      const response = await fetch('http://localhost:3001/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: email,
          subject: 'Test Email from Task Assistant',
          taskDetails: {
            task: 'This is a test notification',
            dueDate: new Date().toISOString().split('T')[0],
            dueTime: new Date().toTimeString().split(' ')[0].substring(0, 5),
            folder: 'Test',
          },
        }),
      });

      if (response.ok) {
        setTestResult({ type: 'success', message: 'Test email sent! Check your inbox.' });
      } else {
        const error = await response.json();
        setTestResult({ type: 'error', message: error.error || 'Failed to send email' });
      }
    } catch (error) {
      setTestResult({ type: 'error', message: 'Cannot connect to server. Make sure backend is running.' });
    } finally {
      setTestingEmail(false);
    }
  };

  const handleTestSMS = async () => {
    const phoneInput = document.querySelector('input[name="phoneNumber"]');
    const phoneNumber = phoneInput?.value;

    if (!phoneNumber) {
      setTestResult({ type: 'error', message: 'Please enter a phone number first' });
      return;
    }

    setTestingSMS(true);
    setTestResult(null);

    try {
      const response = await fetch('http://localhost:3001/api/send-sms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: phoneNumber,
          message: 'Test SMS from Task Assistant: Your notifications are working!',
        }),
      });

      if (response.ok) {
        setTestResult({ type: 'success', message: 'Test SMS sent! Check your phone.' });
      } else {
        const error = await response.json();
        setTestResult({ type: 'error', message: error.error || 'Failed to send SMS' });
      }
    } catch (error) {
      setTestResult({ type: 'error', message: 'Cannot connect to server or SMS not configured.' });
    } finally {
      setTestingSMS(false);
    }
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
      <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 p-6 z-10 max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4 dark:text-white sticky top-0 bg-white dark:bg-gray-800 pb-2">Settings</h2>

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

            <label className="flex items-center gap-2 dark:text-gray-200 text-sm">
              <input
                type="checkbox"
                name="emailNotifications"
                defaultChecked={settings.emailNotifications === true}
                className="w-4 h-4"
              />
              <span>Email Notifications</span>
            </label>

            <label className="flex items-center gap-2 dark:text-gray-200 text-sm">
              <input
                type="checkbox"
                name="smsNotifications"
                defaultChecked={settings.smsNotifications === true}
                className="w-4 h-4"
              />
              <span>SMS/Text Notifications</span>
            </label>
          </div>

          {/* Test Result Banner */}
          {testResult && (
            <div className={`p-3 rounded-lg border ${
              testResult.type === 'success'
                ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
            }`}>
              <div className="flex items-center gap-2">
                <span className={testResult.type === 'success' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                  {testResult.type === 'success' ? '✓' : '⚠️'}
                </span>
                <p className={`text-sm ${
                  testResult.type === 'success'
                    ? 'text-green-800 dark:text-green-200'
                    : 'text-red-800 dark:text-red-200'
                }`}>
                  {testResult.message}
                </p>
              </div>
            </div>
          )}

          {/* Email Configuration */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <label className="block mb-2 font-medium dark:text-gray-200">
              Email Address
            </label>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
              Enter your email to receive task reminders via email
            </p>
            <div className="flex gap-2">
              <input
                type="email"
                name="email"
                defaultValue={settings.email || ''}
                placeholder="your-email@example.com"
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={handleTestEmail}
                disabled={testingEmail}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                {testingEmail ? 'Sending...' : 'Test Email'}
              </button>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              💡 Backend must be configured with Gmail credentials (see NOTIFICATION_FEATURES.md)
            </p>
          </div>

          {/* SMS Configuration */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <label className="block mb-2 font-medium dark:text-gray-200">
              Phone Number
            </label>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
              Enter your phone number for SMS reminders (with country code, e.g., +1234567890)
            </p>
            <div className="flex gap-2">
              <input
                type="tel"
                name="phoneNumber"
                defaultValue={settings.phoneNumber || ''}
                placeholder="+1234567890"
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={handleTestSMS}
                disabled={testingSMS}
                className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                {testingSMS ? 'Sending...' : 'Test SMS'}
              </button>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              💡 Requires Twilio setup (~$0.0079 per SMS)
            </p>
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
