import Card from '../ui/Card'
import Loader from '../ui/Loader'

/**
 * Вкладка рейтинга домашних тренировок
 */
export default function HomeLeaderboard({ leaderboard, loading, error, currentUserId }) {
  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader size="large" />
      </div>
    )
  }

  if (error) {
    return (
      <Card className="text-center py-8">
        <div className="text-4xl mb-2">⚠️</div>
        <p className="text-quick-silver">Ошибка загрузки рейтинга</p>
        <p className="text-sm text-quick-silver mt-1">{error}</p>
      </Card>
    )
  }

  if (leaderboard.length === 0) {
    return (
      <Card className="text-center py-12">
        <div className="text-6xl mb-4">📊</div>
        <p className="text-quick-silver">Рейтинг пока пуст</p>
        <p className="text-sm text-quick-silver mt-1">
          Начните выполнять челленджи!
        </p>
      </Card>
    )
  }

  const getMedalEmoji = (position) => {
    if (position === 0) return '🥇'
    if (position === 1) return '🥈'
    if (position === 2) return '🥉'
    return null
  }

  const getPositionStyle = (position) => {
    if (position === 0) return 'bg-yellow-50 border-yellow-300'
    if (position === 1) return 'bg-gray-50 border-gray-300'
    if (position === 2) return 'bg-orange-50 border-orange-300'
    return 'bg-white'
  }

  return (
    <div className="space-y-3">
      {leaderboard.map((user, index) => {
        const isCurrentUser = user.id === currentUserId
        const medal = getMedalEmoji(index)
        const positionStyle = getPositionStyle(index)

        return (
          <Card
            key={user.id}
            className={`
              transition-all hover:shadow-md
              ${positionStyle}
              ${isCurrentUser ? 'ring-2 ring-brandeis-blue' : ''}
              ${index < 3 ? 'border-2' : ''}
            `}
          >
            <div className="flex items-center gap-4">
              {/* Позиция */}
              <div className="flex-shrink-0 w-12 text-center">
                {medal ? (
                  <span className="text-3xl">{medal}</span>
                ) : (
                  <span className="text-2xl font-bold text-quick-silver">
                    {index + 1}
                  </span>
                )}
              </div>

              {/* Информация о пользователе */}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-strict-black truncate">
                  {user.full_name}
                  {isCurrentUser && (
                    <span className="ml-2 text-xs text-brandeis-blue">(Вы)</span>
                  )}
                </h3>
                <div className="flex items-center gap-3 text-sm text-quick-silver mt-1">
                  <span>Уровень {user.level || 1}</span>
                  {user.current_streak > 0 && (
                    <span className="flex items-center gap-1">
                      🔥 {user.current_streak} дн.
                    </span>
                  )}
                </div>
              </div>

              {/* Очки */}
              <div className="flex-shrink-0 text-right">
                <div className="text-2xl font-bold text-brandeis-blue">
                  {user.total_points}
                </div>
                <div className="text-xs text-quick-silver">очков</div>
              </div>
            </div>
          </Card>
        )
      })}
    </div>
  )
}
