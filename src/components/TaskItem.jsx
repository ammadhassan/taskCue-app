import { useState } from 'react';
import { exportTaskToCalendar } from '../services/calendarService';

export default function TaskItem({ task, onToggle, onDelete, onModify, folders }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(task.text);
  const [editedDate, setEditedDate] = useState(task.dueDate || '');
  const [editedTime, setEditedTime] = useState(task.dueTime || '');
  const [editedFolder, setEditedFolder] = useState(task.folder || 'Personal');
  const [editedPriority, setEditedPriority] = useState(task.priority || 'medium');
  const formatDate = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatTime = (timeString) => {
    if (!timeString) return null;
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const formatDateTime = (dateString, timeString) => {
    const datePart = formatDate(dateString);
    const timePart = formatTime(timeString);

    if (datePart && timePart) {
      return `${datePart} at ${timePart}`;
    } else if (datePart) {
      return datePart;
    } else if (timePart) {
      return `at ${timePart}`;
    }
    return null;
  };

  const isOverdue = (dateString, timeString) => {
    if (!dateString) return false;

    const dueDate = new Date(dateString);

    if (timeString) {
      // If time is specified, set exact hours and minutes for accurate comparison
      const [hours, minutes] = timeString.split(':');
      dueDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    } else {
      // If no time specified, use end of day (task is overdue after the day ends)
      dueDate.setHours(23, 59, 59, 999);
    }

    return dueDate < new Date();
  };

  const priorityColors = {
    high: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    low: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  };

  const handleAddToCalendar = () => {
    try {
      exportTaskToCalendar(task);
      // You could add a toast notification here
      console.log('✅ Task exported to calendar successfully');
    } catch (error) {
      console.error('❌ Failed to export task:', error);
      alert(error.message || 'Failed to export task to calendar');
    }
  };

  const handleSave = () => {
    if (!onModify) return;

    onModify(task.id, {
      text: editedText,
      dueDate: editedDate || null,
      dueTime: editedTime || null,
      folder: editedFolder,
      priority: editedPriority
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    // Reset to original values
    setEditedText(task.text);
    setEditedDate(task.dueDate || '');
    setEditedTime(task.dueTime || '');
    setEditedFolder(task.folder || 'Personal');
    setEditedPriority(task.priority || 'medium');
    setIsEditing(false);
  };

  return (
    <div
      className={`p-4 bg-white dark:bg-gray-800 border rounded-lg shadow-sm hover:shadow-md transition-shadow ${
        isOverdue(task.dueDate, task.dueTime) && !task.completed
          ? 'border-red-300 dark:border-red-700'
          : 'border-gray-200 dark:border-gray-700'
      }`}
    >
      {isEditing ? (
        /* Edit Mode */
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Task Description
            </label>
            <input
              type="text"
              value={editedText}
              onChange={(e) => setEditedText(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Due Date
              </label>
              <input
                type="date"
                value={editedDate}
                onChange={(e) => setEditedDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Due Time
              </label>
              <input
                type="time"
                value={editedTime}
                onChange={(e) => setEditedTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Folder
              </label>
              <select
                value={editedFolder}
                onChange={(e) => setEditedFolder(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                {folders && folders.filter((f) => f !== 'All Tasks').map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Priority
              </label>
              <select
                value={editedPriority}
                onChange={(e) => setEditedPriority(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <button
              onClick={handleCancel}
              className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 text-sm text-white bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors"
            >
              Save Changes
            </button>
          </div>
        </div>
      ) : (
        /* Normal Display Mode */
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={task.completed}
            onChange={() => onToggle(task.id)}
            className="w-5 h-5 rounded border-gray-300 text-blue-500 focus:ring-2 focus:ring-blue-500 cursor-pointer"
          />

          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span
                className={`${
                  task.completed
                    ? 'line-through text-gray-400 dark:text-gray-600'
                    : 'text-gray-900 dark:text-white'
                }`}
              >
                {task.text}
              </span>

              {/* Priority Badge */}
              {task.priority && (
                <span
                  className={`px-2 py-0.5 rounded text-xs font-medium ${
                    priorityColors[task.priority]
                  }`}
                >
                  {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                </span>
              )}
            </div>

            {/* Due Date/Time */}
            {(task.dueDate || task.dueTime) && (
              <div
                className={`text-xs ${
                  isOverdue(task.dueDate, task.dueTime) && !task.completed
                    ? 'text-red-600 dark:text-red-400 font-medium'
                    : 'text-gray-500 dark:text-gray-400'
                }`}
              >
                Due: {formatDateTime(task.dueDate, task.dueTime)}
                {isOverdue(task.dueDate, task.dueTime) && !task.completed && ' (Overdue)'}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            {/* Add to Calendar Button */}
            {task.dueDate && task.dueTime && (
              <button
                onClick={handleAddToCalendar}
                className="px-3 py-1 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                title="Add to Calendar"
              >
                📅 Calendar
              </button>
            )}

            {/* Edit Button */}
            {onModify && (
              <button
                onClick={() => setIsEditing(true)}
                className="px-3 py-1 text-sm text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition-colors"
              >
                Edit
              </button>
            )}

            {/* Delete Button */}
            <button
              onClick={() => onDelete(task.id)}
              className="px-3 py-1 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
