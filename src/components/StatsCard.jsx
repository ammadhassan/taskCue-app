/**
 * StatsCard Component
 * Reusable metric card displaying a statistic with icon, label, and optional trend
 */

export default function StatsCard({ icon, label, value, trend, trendLabel, color = 'blue', onClick }) {
  const colorClasses = {
    blue: {
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      icon: 'text-blue-600 dark:text-blue-400',
      value: 'text-blue-900 dark:text-blue-100',
      trend: 'text-blue-600 dark:text-blue-400'
    },
    green: {
      bg: 'bg-green-50 dark:bg-green-900/20',
      icon: 'text-green-600 dark:text-green-400',
      value: 'text-green-900 dark:text-green-100',
      trend: 'text-green-600 dark:text-green-400'
    },
    red: {
      bg: 'bg-red-50 dark:bg-red-900/20',
      icon: 'text-red-600 dark:text-red-400',
      value: 'text-red-900 dark:text-red-100',
      trend: 'text-red-600 dark:text-red-400'
    },
    yellow: {
      bg: 'bg-yellow-50 dark:bg-yellow-900/20',
      icon: 'text-yellow-600 dark:text-yellow-400',
      value: 'text-yellow-900 dark:text-yellow-100',
      trend: 'text-yellow-600 dark:text-yellow-400'
    },
    purple: {
      bg: 'bg-purple-50 dark:bg-purple-900/20',
      icon: 'text-purple-600 dark:text-purple-400',
      value: 'text-purple-900 dark:text-purple-100',
      trend: 'text-purple-600 dark:text-purple-400'
    }
  };

  const colors = colorClasses[color] || colorClasses.blue;

  return (
    <div
      className={`
        ${colors.bg}
        rounded-xl p-5
        border border-gray-200 dark:border-gray-700
        transition-all duration-300
        ${onClick ? 'cursor-pointer hover:shadow-lg hover:scale-105' : ''}
      `}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {/* Label */}
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
            {label}
          </p>

          {/* Value */}
          <p className={`text-3xl font-bold ${colors.value} mb-1`}>
            {value}
          </p>

          {/* Trend */}
          {trend !== undefined && (
            <div className="flex items-center gap-1">
              <span className={`text-sm font-medium ${colors.trend}`}>
                {trend > 0 ? '↑' : trend < 0 ? '↓' : '−'}
                {Math.abs(trend)}%
              </span>
              {trendLabel && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {trendLabel}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Icon */}
        {icon && (
          <div className={`text-4xl ${colors.icon}`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
