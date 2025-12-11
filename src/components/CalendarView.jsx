import { useState } from 'react';
import {
  generateCalendarGrid,
  getMonthName,
  getDayNames,
  getTasksForDate,
  getPreviousMonth,
  getNextMonth,
  getCurrentMonthYear,
  isToday
} from '../utils/calendarHelpers';
import DayDetailModal from './DayDetailModal';

/**
 * CalendarView Component
 * Displays tasks in a monthly calendar grid
 */

export default function CalendarView({ tasks, onToggle, onDelete, onModify, onAddTask, folders, selectedFolder }) {
  const { month: currentMonth, year: currentYear } = getCurrentMonthYear();
  const [viewMonth, setViewMonth] = useState(currentMonth);
  const [viewYear, setViewYear] = useState(currentYear);
  const [selectedDate, setSelectedDate] = useState(null);
  const [showDayModal, setShowDayModal] = useState(false);

  const calendarGrid = generateCalendarGrid(viewYear, viewMonth);
  const dayNames = getDayNames();

  const handlePrevMonth = () => {
    const { month, year } = getPreviousMonth(viewMonth, viewYear);
    setViewMonth(month);
    setViewYear(year);
  };

  const handleNextMonth = () => {
    const { month, year } = getNextMonth(viewMonth, viewYear);
    setViewMonth(month);
    setViewYear(year);
  };

  const handleToday = () => {
    setViewMonth(currentMonth);
    setViewYear(currentYear);
  };

  const handleDateClick = (date) => {
    setSelectedDate({ year: viewYear, month: viewMonth, day: date });
    setShowDayModal(true);
  };

  const handleCloseDayModal = () => {
    setShowDayModal(false);
    setSelectedDate(null);
  };

  const priorityColors = {
    high: 'bg-red-500',
    medium: 'bg-yellow-500',
    low: 'bg-green-500'
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-md">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          {getMonthName(viewMonth)} {viewYear}
        </h2>

        <div className="flex items-center gap-2">
          <button
            onClick={handleToday}
            className="px-3 py-1 text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
          >
            Today
          </button>
          <button
            onClick={handlePrevMonth}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title="Previous month"
          >
            <span className="text-xl">←</span>
          </button>
          <button
            onClick={handleNextMonth}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title="Next month"
          >
            <span className="text-xl">→</span>
          </button>
        </div>
      </div>

      {/* Day Names Header */}
      <div className="grid grid-cols-7 gap-2 mb-2">
        {dayNames.map(day => (
          <div
            key={day}
            className="text-center text-sm font-semibold text-gray-600 dark:text-gray-400 py-2"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-2">
        {calendarGrid.map((week, weekIndex) => (
          week.map((dayObj, dayIndex) => {
            if (!dayObj.isCurrentMonth) {
              return (
                <div
                  key={`${weekIndex}-${dayIndex}`}
                  className="aspect-square bg-gray-50 dark:bg-gray-900 rounded-lg"
                />
              );
            }

            const dayTasks = getTasksForDate(tasks, viewYear, viewMonth, dayObj.date);
            const incompleteTasks = dayTasks.filter(t => !t.completed);
            const isTodayDate = isToday(viewYear, viewMonth, dayObj.date);

            return (
              <div
                key={`${weekIndex}-${dayIndex}`}
                onClick={() => handleDateClick(dayObj.date)}
                className={`
                  aspect-square p-2 rounded-lg border transition-all cursor-pointer
                  ${isTodayDate
                    ? 'border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
                  }
                  hover:shadow-md hover:border-blue-300 dark:hover:border-blue-500
                `}
              >
                {/* Date Number */}
                <div className={`
                  text-sm font-semibold mb-1
                  ${isTodayDate
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-gray-900 dark:text-white'
                  }
                `}>
                  {dayObj.date}
                </div>

                {/* Task Indicators */}
                <div className="space-y-1">
                  {incompleteTasks.slice(0, 3).map((task, idx) => (
                    <div
                      key={task.id}
                      className="flex items-center gap-1 text-xs truncate group"
                      title={task.text}
                    >
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${priorityColors[task.priority] || 'bg-gray-400'}`} />
                      <span className="text-gray-700 dark:text-gray-300 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400">
                        {task.text}
                      </span>
                    </div>
                  ))}

                  {/* Show "+X more" if more than 3 tasks */}
                  {incompleteTasks.length > 3 && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                      +{incompleteTasks.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })
        ))}
      </div>

      {/* Legend */}
      <div className="mt-6 flex items-center justify-center gap-6">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <span className="text-sm text-gray-600 dark:text-gray-400">High Priority</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
          <span className="text-sm text-gray-600 dark:text-gray-400">Medium Priority</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
          <span className="text-sm text-gray-600 dark:text-gray-400">Low Priority</span>
        </div>
      </div>

      {/* Day Detail Modal */}
      {selectedDate && (
        <DayDetailModal
          isOpen={showDayModal}
          onClose={handleCloseDayModal}
          year={selectedDate.year}
          month={selectedDate.month}
          day={selectedDate.day}
          tasks={tasks}
          onAddTask={onAddTask}
          onToggle={onToggle}
          onDelete={onDelete}
          onModify={onModify}
          folders={folders}
          selectedFolder={selectedFolder}
        />
      )}
    </div>
  );
}
