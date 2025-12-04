import { useState } from 'react';

export default function FolderSidebar({
  folders,
  selectedFolder,
  onSelectFolder,
  onAddFolder,
  onDeleteFolder,
  tasks,
}) {
  const [showAddFolder, setShowAddFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  const handleAddFolder = (e) => {
    e.preventDefault();
    if (newFolderName.trim()) {
      onAddFolder(newFolderName);
      setNewFolderName('');
      setShowAddFolder(false);
    }
  };

  const getTaskCount = (folder) => {
    if (folder === 'All Tasks') {
      return tasks.length;
    }
    return tasks.filter((task) => task.folder === folder).length;
  };

  const defaultFolders = ['All Tasks', 'Work', 'Personal', 'Shopping'];

  return (
    <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-4">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
        Folders
      </h2>

      <div className="space-y-1 mb-6">
        {folders.map((folder) => (
          <div
            key={folder}
            className="group flex items-center justify-between"
          >
            <button
              onClick={() => onSelectFolder(folder)}
              className={`flex-1 text-left px-3 py-2 rounded-lg transition-colors ${
                selectedFolder === folder
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <span className="font-medium">{folder}</span>
              <span
                className={`ml-2 text-sm ${
                  selectedFolder === folder
                    ? 'text-blue-100'
                    : 'text-gray-500 dark:text-gray-400'
                }`}
              >
                ({getTaskCount(folder)})
              </span>
            </button>

            {!defaultFolders.includes(folder) && (
              <button
                onClick={() => onDeleteFolder(folder)}
                className="ml-2 px-2 py-1 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                title="Delete folder"
              >
                ×
              </button>
            )}
          </div>
        ))}
      </div>

      {!showAddFolder ? (
        <button
          onClick={() => setShowAddFolder(true)}
          className="w-full px-3 py-2 text-left text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
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
              className="flex-1 px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-white transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
