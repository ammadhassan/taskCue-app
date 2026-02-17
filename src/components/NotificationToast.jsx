import { useEffect, useState } from 'react';
import { notificationService } from '../services/notificationService';

export default function NotificationToast() {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    // Subscribe to notification events
    const handleNotification = (notification) => {
      setNotifications(prev => [...prev, {
        id: Date.now(),
        ...notification
      }]);
    };

    notificationService.onNotification(handleNotification);

    return () => {
      notificationService.offNotification(handleNotification);
    };
  }, []);

  const dismiss = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {notifications.map(notification => (
        <div
          key={notification.id}
          data-testid="notification"
          className="bg-white dark:bg-gray-800 border-l-4 border-blue-500 rounded-lg shadow-lg p-4 min-w-[300px] max-w-[400px] animate-slide-in"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="font-semibold text-gray-900 dark:text-white">
                {notification.title}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {notification.body}
              </p>
            </div>
            <button
              data-testid="dismiss-notification"
              onClick={() => dismiss(notification.id)}
              className="ml-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
