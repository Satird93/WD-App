import { useLeaderboard } from '../../hooks/useLeaderboard'
import Card from '../ui/Card'
import Loader from '../ui/Loader'
import Button from '../ui/Button'

/**
 * Мини-рейтинг для главного экрана (топ-3)
 */
export default function MiniLeaderboard({ onViewFull }) {
  const { leaderboard, loading, error } = useLeaderboard('home', 3)

  if (loading) {
    return (
      <Card>
        <h3 className="text-lg font-semibold text-strict-black mb-4">
          🏆 Топ-3
        </h3>
        <div className="flex justify-center py-8">
          <Loader size="small" />
        </div>
      </Card>
    )
  }

  if (error || leaderboard.length === 0) {
    return null
  }

  const getMedalEmoji = (position) => {
    if (position === 0) return '🥇'
    if (position === 1) return '🥈'
    if (position === 2) return '🥉'
    return null
  }

  return (
    <Card>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-strict-black">
          🏆 Топ-3
        </h3>
        <button
          onClick={onViewFull}
          className="text-sm text-brandeis-blue hover:underline"
        >
          Весь рейтинг →
        </button>
      </div>

      <div className="space-y-3">
        {leaderboard.map((user, index) => {
          const medal = getMedalEmoji(index)

          return (
            <div
              key={user.id}
              className="flex items-center gap-3 p-3 bg-alice-blue rounded-lg hover:bg-alice-blue/70 transition-colors"
            >
              {/* Медаль */}
              <div className="flex-shrink-0 text-3xl">
                {medal}
              </div>

              {/* Информация */}
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-strict-black truncate">
                  {user.full_name}
                </h4>
                <p className="text-sm text-quick-silver">
                  Уровень {user.level || 1}
                  {user.current_streak > 0 && (
                    <span className="ml-2">🔥 {user.current_streak}</span>
                  )}
                </p>
              </div>

              {/* Очки */}
              <div className="flex-shrink-0 text-right">
                <div className="text-xl font-bold text-brandeis-blue">
                  {user.total_points}
                </div>
                <div className="text-xs text-quick-silver">очков</div>
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
