export default function TaskItem({ task, onToggle, onDelete }) {
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

  return (
    <div
      className={`flex items-center gap-3 p-4 bg-white dark:bg-gray-800 border rounded-lg shadow-sm hover:shadow-md transition-shadow ${
        isOverdue(task.dueDate, task.dueTime) && !task.completed
          ? 'border-red-300 dark:border-red-700'
          : 'border-gray-200 dark:border-gray-700'
      }`}
    >
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

      <button
        onClick={() => onDelete(task.id)}
        className="px-3 py-1 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
      >
        Delete
      </button>
    </div>
  );
}
