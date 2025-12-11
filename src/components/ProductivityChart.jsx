import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getCompletionTrend } from '../utils/statistics';

/**
 * ProductivityChart Component
 * Shows task completion trend over the last 7 days
 */

export default function ProductivityChart({ tasks }) {
  const trendData = getCompletionTrend(tasks, 7);

  // Custom tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 shadow-lg">
          <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
            {payload[0].payload.day}
          </p>
          <p className="text-xs text-blue-600 dark:text-blue-400">
            Created: {payload[0].value}
          </p>
          {payload[1] && (
            <p className="text-xs text-green-600 dark:text-green-400">
              Completed: {payload[1].value}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-md">
      <div className="mb-4">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
          Weekly Activity
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Tasks created and completed over the last 7 days
        </p>
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={trendData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700" />
          <XAxis
            dataKey="day"
            stroke="#9ca3af"
            style={{ fontSize: '12px' }}
          />
          <YAxis
            stroke="#9ca3af"
            style={{ fontSize: '12px' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="created"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={{ fill: '#3b82f6', r: 4 }}
            activeDot={{ r: 6 }}
          />
          <Line
            type="monotone"
            dataKey="completed"
            stroke="#10b981"
            strokeWidth={2}
            dot={{ fill: '#10b981', r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500"></div>
          <span className="text-sm text-gray-600 dark:text-gray-400">Created</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
          <span className="text-sm text-gray-600 dark:text-gray-400">Completed</span>
        </div>
      </div>
    </div>
  );
}
