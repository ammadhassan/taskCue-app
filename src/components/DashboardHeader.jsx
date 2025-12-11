import { formatDateShort } from '../utils/dateHelpers';
import { getTasksDueToday, getOverdueTasks, getCompletionRate } from '../utils/statistics';

/**
 * DashboardHeader Component
 * Displays the main header with current date and quick stats bar
 */

export default function DashboardHeader({ tasks, onSettingsClick, onExportClick }) {
  const today = new Date();
  const todayFormatted = formatDateShort(today.toISOString().split('T')[0]);

  const dueTodayCount = getTasksDueToday(tasks).length;
  const overdueCount = getOverdueTasks(tasks).length;
  const completionRate = getCompletionRate(tasks);

  return (
    <div className="mb-8">
      {/* Main Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-2">
            Task Dashboard
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            {todayFormatted}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mt-4 md:mt-0">
          <button
            onClick={onExportClick}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-md hover:shadow-lg"
            title="Export tasks to calendar"
          >
            <span>📅</span>
            <span className="hidden md:inline">Export to Calendar</span>
          </button>
          <button
            onClick={onSettingsClick}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors shadow-md hover:shadow-lg"
          >
            Settings
          </button>
        </div>
      </div>

      {/* Quick Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Due Today */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90 mb-1">Due Today</p>
              <p className="text-3xl font-bold">{dueTodayCount}</p>
            </div>
            <div className="text-4xl opacity-80">
              📅
            </div>
          </div>
        </div>

        {/* Overdue */}
        <div className={`
          bg-gradient-to-br rounded-xl p-4 text-white shadow-lg
          ${overdueCount > 0 ? 'from-red-500 to-red-600' : 'from-green-500 to-green-600'}
        `}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90 mb-1">Overdue</p>
              <p className="text-3xl font-bold">{overdueCount}</p>
            </div>
            <div className="text-4xl opacity-80">
              {overdueCount > 0 ? '⚠️' : '✅'}
            </div>
          </div>
        </div>

        {/* Completion Rate */}
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-4 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90 mb-1">Completion Rate</p>
              <p className="text-3xl font-bold">{completionRate}%</p>
            </div>
            <div className="text-4xl opacity-80">
              📊
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
