import { getTasksDueToday, getOverdueTasks } from '../utils/statistics';
import { formatTime, getTimeUntilDue } from '../utils/dateHelpers';

/**
 * TodaysFocus Component
 * Highlights high-priority and due-today tasks
 */

export default function TodaysFocus({ tasks, onToggle }) {
  const dueToday = getTasksDueToday(tasks);
  const overdue = getOverdueTasks(tasks);

  // Combine and deduplicate by task ID (a task can be both overdue AND due today)
  const allTasks = [...overdue, ...dueToday];
  const uniqueTasks = Array.from(
    new Map(allTasks.map(task => [task.id, task])).values()
  );

  // Filter, sort, and limit to 5 tasks
  const focusTasks = uniqueTasks
    .filter(t => !t.completed)
    .sort((a, b) => {
      // Priority order
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      // Then by time
      if (a.dueTime && b.dueTime) {
        return a.dueTime.localeCompare(b.dueTime);
      }
      return 0;
    })
    .slice(0, 5); // Show max 5 tasks

  const priorityColors = {
    high: 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-400 dark:border-red-700',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-700',
    low: 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-400 dark:border-green-700',
  };

  if (focusTasks.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-md">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
          Today's Focus
        </h3>
        <div className="flex flex-col items-center justify-center py-8 text-gray-500 dark:text-gray-400">
          <div className="text-5xl mb-2">✨</div>
          <p className="text-sm">All caught up!</p>
          <p className="text-xs mt-1">No urgent tasks for today</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-md">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
          Today's Focus
        </h3>
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {focusTasks.length} task{focusTasks.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="space-y-3">
        {focusTasks.map(task => {
          const isOverdueTask = overdue.some(t => t.id === task.id);
          const timeUntil = task.dueTime ? getTimeUntilDue(task.dueDate, task.dueTime) : null;

          return (
            <div
              key={task.id}
              className={`
                border-l-4 pl-3 py-2 rounded-r-lg
                transition-all duration-200
                ${isOverdueTask
                  ? 'border-red-500 bg-red-50 dark:bg-red-900/10'
                  : 'border-blue-500 bg-blue-50 dark:bg-blue-900/10'
                }
              `}
            >
              <div className="flex items-start gap-3">
                {/* Checkbox */}
                <input
                  type="checkbox"
                  checked={task.completed}
                  onChange={() => onToggle(task.id)}
                  className="mt-1 w-4 h-4 rounded border-gray-300 text-blue-500 focus:ring-2 focus:ring-blue-500 cursor-pointer"
                />

                {/* Task Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {task.text}
                    </p>

                    {/* Priority Badge */}
                    {task.priority && (
                      <span className={`
                        px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap
                        ${priorityColors[task.priority]}
                      `}>
                        {task.priority === 'high' && '🔥'}
                        {task.priority === 'medium' && '⚡'}
                        {task.priority === 'low' && '✓'}
                      </span>
                    )}
                  </div>

                  {/* Time Info */}
                  <div className="flex items-center gap-2 mt-1">
                    {task.dueTime && (
                      <span className="text-xs text-gray-600 dark:text-gray-400">
                        {formatTime(task.dueTime)}
                      </span>
                    )}
                    {timeUntil && (
                      <span className={`
                        text-xs font-medium
                        ${isOverdueTask ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'}
                      `}>
                        {timeUntil}
                      </span>
                    )}
                    {task.folder && task.folder !== 'Personal' && (
                      <span className="text-xs text-gray-500 dark:text-gray-500">
                        • {task.folder}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
