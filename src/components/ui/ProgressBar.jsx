// Прогресс-бар для отображения прогресса
// Following vercel-react-best-practices: rerender-derived-state

// Маппинг цветов для Tailwind (статические классы для компиляции)
const colorMap = {
  'accent-orange': 'bg-accent-orange',
  'brandeis-blue': 'bg-brandeis-blue',
  'green-500': 'bg-green-500',
  'red-500': 'bg-red-500',
  'yellow-500': 'bg-yellow-500',
}

export default function ProgressBar({
  current,
  max,
  color = 'accent-orange',
  label,
  showPercentage = true,
  className = '',
}) {
  // Вычисляем процент один раз
  const percentage = Math.min(Math.round((current / max) * 100), 100)
  
  // Получаем статический класс или используем fallback
  const bgColorClass = colorMap[color] || 'bg-accent-orange'

  return (
    <div className={className}>
      {label && (
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-quick-silver">{label}</span>
          {showPercentage && (
            <span className="text-sm font-semibold text-strict-black">
              {percentage}%
            </span>
          )}
        </div>
      )}
      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
        <div
          className={`h-full ${bgColorClass} rounded-full transition-all duration-300`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}
