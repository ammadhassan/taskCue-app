/**
 * QuickActions Component
 * Provides shortcuts for common task operations
 */

export default function QuickActions({ onAddTask, folders, onSelectFolder, selectedFolder }) {
  const handleQuickAdd = (folder) => {
    // Focus on task input would be better, but for now just select the folder
    onSelectFolder(folder);
    // Scroll to top where task form is
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const actionButtons = [
    {
      icon: '💼',
      label: 'Work Task',
      folder: 'Work',
      color: 'from-blue-500 to-blue-600',
      hoverColor: 'hover:from-blue-600 hover:to-blue-700'
    },
    {
      icon: '🏠',
      label: 'Personal',
      folder: 'Personal',
      color: 'from-green-500 to-green-600',
      hoverColor: 'hover:from-green-600 hover:to-green-700'
    },
    {
      icon: '🛒',
      label: 'Shopping',
      folder: 'Shopping',
      color: 'from-purple-500 to-purple-600',
      hoverColor: 'hover:from-purple-600 hover:to-purple-700'
    }
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-md">
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
        Quick Actions
      </h3>

      <div className="space-y-3">
        {/* Quick Add Buttons */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
            Add to Folder
          </p>
          {actionButtons.map(action => (
            <button
              key={action.folder}
              onClick={() => handleQuickAdd(action.folder)}
              className={`
                w-full flex items-center gap-3 px-4 py-3 rounded-lg
                bg-gradient-to-r ${action.color} ${action.hoverColor}
                text-white font-medium shadow-md
                transform transition-all duration-200
                hover:scale-105 hover:shadow-lg
                active:scale-95
              `}
            >
              <span className="text-2xl">{action.icon}</span>
              <span className="text-sm">{action.label}</span>
            </button>
          ))}
        </div>

        {/* Divider */}
        <div className="border-t border-gray-200 dark:border-gray-700 my-4"></div>

        {/* View Filters */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
            Quick Filters
          </p>

          <button
            onClick={() => onSelectFolder('All Tasks')}
            className={`
              w-full flex items-center justify-between px-4 py-2 rounded-lg
              transition-all duration-200
              ${selectedFolder === 'All Tasks'
                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }
            `}
          >
            <span className="text-sm">All Tasks</span>
            <span className="text-xs opacity-70">⌘A</span>
          </button>

          {folders.filter(f => f !== 'All Tasks').map(folder => (
            <button
              key={folder}
              onClick={() => onSelectFolder(folder)}
              className={`
                w-full flex items-center justify-between px-4 py-2 rounded-lg
                transition-all duration-200
                ${selectedFolder === folder
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }
              `}
            >
              <span className="text-sm">{folder}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
