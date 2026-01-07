/**
 * QuickActions Component
 * Provides shortcuts for common task operations
 */

import { useState } from 'react';

export default function QuickActions({ onAddTask, folders, onSelectFolder, selectedFolder, onAddFolder, onDeleteFolder }) {
  const [showAddFolder, setShowAddFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  const handleQuickAdd = (folder) => {
    // Focus on task input would be better, but for now just select the folder
    onSelectFolder(folder);
    // Scroll to top where task form is
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAddFolder = (e) => {
    e.preventDefault();
    if (newFolderName.trim() && onAddFolder) {
      onAddFolder(newFolderName.trim());
      setNewFolderName('');
      setShowAddFolder(false);
    }
  };

  const defaultFolders = ['All Tasks', 'Work', 'Personal', 'Shopping'];

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
            <div key={folder} className="group flex items-center gap-2">
              <button
                onClick={() => onSelectFolder(folder)}
                className={`
                  flex-1 flex items-center justify-between px-4 py-2 rounded-lg
                  transition-all duration-200
                  ${selectedFolder === folder
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }
                `}
              >
                <span className="text-sm">{folder}</span>
              </button>
              {!defaultFolders.includes(folder) && onDeleteFolder && (
                <button
                  onClick={() => {
                    if (window.confirm(`Delete folder "${folder}"?`)) {
                      onDeleteFolder(folder);
                    }
                  }}
                  className="px-2 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Delete folder"
                >
                  ×
                </button>
              )}
            </div>
          ))}

          {/* Add Folder Button */}
          {!showAddFolder ? (
            <button
              onClick={() => setShowAddFolder(true)}
              className="w-full px-4 py-2 text-left text-blue-500 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors text-sm font-medium"
            >
              + Add Folder
            </button>
          ) : (
            <form onSubmit={handleAddFolder} className="space-y-2">
              <input
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Folder name..."
                autoFocus
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition-colors"
                >
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddFolder(false);
                    setNewFolderName('');
                  }}
                  className="flex-1 px-3 py-1 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded text-sm hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
