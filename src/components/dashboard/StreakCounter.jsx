import ProgressBar from '../ui/ProgressBar'
import Card from '../ui/Card'
import { getNextStreakMilestone } from '../../utils/helpers'

/**
 * Счётчик стрика с прогрессом до следующей вехи
 * Following vercel-react-best-practices: rerender-derived-state
 */
export default function StreakCounter({ streak }) {
  // Вычисляем один раз
  const nextMilestone = getNextStreakMilestone(streak)

  return (
    <Card className="mb-4 animate-fade-in">
      <div className="flex items-center justify-between mb-3">
        <span className="text-accent-orange text-2xl font-bold flex items-center gap-2">
          🔥 Стрик: {streak} {streak === 1 ? 'день' : streak < 5 ? 'дня' : 'дней'}
        </span>
      </div>
      <ProgressBar
        current={streak}
        max={nextMilestone}
        color="accent-orange"
        label={`${streak}/${nextMilestone} до следующей награды`}
        showPercentage={false}
      />
    </Card>
  )
}
