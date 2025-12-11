import { useState } from 'react';
import {
  generateHourSlots,
  getTasksByHour,
  formatDateForDisplay
} from '../utils/calendarHelpers';
import TaskItem from './TaskItem';

/**
 * DayDetailModal Component
 * Shows hourly breakdown of tasks for a selected date
 * Allows adding new tasks with pre-filled date
 */

export default function DayDetailModal({
  isOpen,
  onClose,
  year,
  month,
  day,
  tasks,
  onAddTask,
  onToggle,
  onDelete,
  onModify,
  folders,
  selectedFolder
}) {
  const [newTaskText, setNewTaskText] = useState('');
  const [newTaskTime, setNewTaskTime] = useState('09:00');
  const [newTaskPriority, setNewTaskPriority] = useState('medium');

  if (!isOpen) return null;

  const hourSlots = generateHourSlots();
  const { tasksByHour, unscheduled } = getTasksByHour(tasks, year, month, day);
  const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  const displayDate = formatDateForDisplay(year, month, day);

  const handleAddTask = (e) => {
    e.preventDefault();
    if (newTaskText.trim()) {
      onAddTask(
        newTaskText.trim(),
        selectedFolder || 'Personal',
        dateStr,
        newTaskPriority,
        newTaskTime
      );
      setNewTaskText('');
      setNewTaskTime('09:00');
      setNewTaskPriority('medium');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-1">{displayDate}</h2>
              <p className="text-blue-100 text-sm">
                {tasks.filter(t => t.dueDate === dateStr && !t.completed).length} active tasks
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
              title="Close"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Quick Add Task Form */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          <form onSubmit={handleAddTask} className="flex flex-col gap-2">
            <div className="flex gap-2">
              <input
                type="text"
                value={newTaskText}
                onChange={(e) => setNewTaskText(e.target.value)}
                placeholder="Add a new task..."
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="time"
                value={newTaskTime}
                onChange={(e) => setNewTaskTime(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <select
                value={newTaskPriority}
                onChange={(e) => setNewTaskPriority(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
              <button
                type="submit"
                className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors"
              >
                Add
              </button>
            </div>
          </form>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Unscheduled Tasks */}
          {unscheduled.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-2">
                Unscheduled
              </h3>
              <div className="space-y-2">
                {unscheduled.map(task => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    onToggle={onToggle}
                    onDelete={onDelete}
                    onModify={onModify}
                    folders={folders}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Hourly Schedule */}
          <div className="space-y-1">
            {hourSlots.map(slot => {
              const hourTasks = tasksByHour[slot.hour] || [];

              return (
                <div
                  key={slot.hour}
                  className="flex gap-3 border-l-2 border-gray-200 dark:border-gray-700 pl-3 py-2"
                >
                  {/* Time Label */}
                  <div className="flex-shrink-0 w-24">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      {slot.display}
                    </span>
                  </div>

                  {/* Tasks for this hour */}
                  <div className="flex-1 space-y-2">
                    {hourTasks.length > 0 ? (
                      hourTasks.map(task => (
                        <TaskItem
                          key={task.id}
                          task={task}
                          onToggle={onToggle}
                          onDelete={onDelete}
                          onModify={onModify}
                          folders={folders}
                        />
                      ))
                    ) : (
                      <div className="text-xs text-gray-400 dark:text-gray-600 italic py-1">
                        No tasks
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
