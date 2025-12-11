/**
 * ViewTabs Component
 * Tab navigation to switch between List and Calendar views
 */

export default function ViewTabs({ activeView, onViewChange }) {
  const tabs = [
    { id: 'list', label: 'List View', icon: '📋' },
    { id: 'calendar', label: 'Calendar View', icon: '📅' }
  ];

  return (
    <div className="flex gap-2 bg-gray-100 dark:bg-gray-700 p-1 rounded-lg w-fit">
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onViewChange(tab.id)}
          className={`
            px-4 py-2 rounded-md transition-all duration-200 flex items-center gap-2
            ${activeView === tab.id
              ? 'bg-white dark:bg-gray-800 shadow-md text-blue-600 dark:text-blue-400 font-medium'
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }
          `}
        >
          <span>{tab.icon}</span>
          <span className="text-sm">{tab.label}</span>
        </button>
      ))}
    </div>
  );
}
