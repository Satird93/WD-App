import ProgressBar from '../ui/ProgressBar'
import Card from '../ui/Card'
import { WEEKLY_GOAL } from '../../utils/constants'

/**
 * Прогресс по недельным очкам
 * Following vercel-react-best-practices: rerender-derived-state
 */
export default function WeeklyProgress({ current }) {
  // Вычисляем процент достижения цели
  const percentage = Math.min(Math.round((current / WEEKLY_GOAL) * 100), 100)
  const isGoalReached = current >= WEEKLY_GOAL

  return (
    <Card className="mb-4 animate-fade-in">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-semibold text-strict-black">Недельная цель</h3>
        {isGoalReached && (
          <span className="text-green-600 font-bold flex items-center gap-1">
            ✓ Достигнута
          </span>
        )}
      </div>
      <ProgressBar
        current={current}
        max={WEEKLY_GOAL}
        color="accent-orange"
        label={`${current}/${WEEKLY_GOAL} очков`}
      />
      {!isGoalReached && (
        <p className="text-xs text-quick-silver mt-2">
          Осталось {WEEKLY_GOAL - current} {WEEKLY_GOAL - current === 1 ? 'очко' : 'очков'} до цели
        </p>
      )}
    </Card>
  )
}
