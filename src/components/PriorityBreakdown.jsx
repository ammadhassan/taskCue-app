import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { getPriorityBreakdown } from '../utils/statistics';

/**
 * PriorityBreakdown Component
 * Shows distribution of tasks by priority level
 */

export default function PriorityBreakdown({ tasks }) {
  const breakdown = getPriorityBreakdown(tasks);

  const data = [
    { name: 'High Priority', value: breakdown.high, color: '#ef4444' },
    { name: 'Medium Priority', value: breakdown.medium, color: '#f59e0b' },
    { name: 'Low Priority', value: breakdown.low, color: '#10b981' }
  ].filter(item => item.value > 0); // Only show priorities that have tasks

  const total = breakdown.high + breakdown.medium + breakdown.low;

  // Custom label with better visibility
  const renderLabel = (entry) => {
    const percent = ((entry.value / total) * 100).toFixed(0);
    const RADIAN = Math.PI / 180;
    const radius = entry.innerRadius + (entry.outerRadius - entry.innerRadius) * 0.5;
    const x = entry.cx + radius * Math.cos(-entry.midAngle * RADIAN);
    const y = entry.cy + radius * Math.sin(-entry.midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="#ffffff"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize="14"
        fontWeight="bold"
        stroke="#000000"
        strokeWidth="0.5"
        paintOrder="stroke"
      >
        {`${percent}%`}
      </text>
    );
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 shadow-lg">
          <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
            {payload[0].name}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {payload[0].value} task{payload[0].value !== 1 ? 's' : ''}
          </p>
        </div>
      );
    }
    return null;
  };

  if (total === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-md">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
          Priority Distribution
        </h3>
        <div className="flex flex-col items-center justify-center py-8 text-gray-500 dark:text-gray-400">
          <div className="text-5xl mb-2">📊</div>
          <p className="text-sm">No active tasks</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-md">
      <div className="mb-4">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
          Priority Distribution
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {total} active task{total !== 1 ? 's' : ''}
        </p>
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderLabel}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="flex flex-col gap-2 mt-4">
        {breakdown.high > 0 && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span className="text-sm text-gray-600 dark:text-gray-400">High</span>
            </div>
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {breakdown.high}
            </span>
          </div>
        )}
        {breakdown.medium > 0 && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <span className="text-sm text-gray-600 dark:text-gray-400">Medium</span>
            </div>
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {breakdown.medium}
            </span>
          </div>
        )}
        {breakdown.low > 0 && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-sm text-gray-600 dark:text-gray-400">Low</span>
            </div>
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {breakdown.low}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
