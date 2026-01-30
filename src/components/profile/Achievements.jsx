import { useState, useEffect } from 'react'
import { supabase } from '../../utils/supabaseClient'
import Card from '../ui/Card'
import Loader from '../ui/Loader'

/**
 * Список достижений пользователя
 */
export default function Achievements({ userId }) {
  const [achievements, setAchievements] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('all') // 'all', 'снаряжение', 'заслуга'

  useEffect(() => {
    if (userId) {
      fetchAchievements()
    }
  }, [userId])

  async function fetchAchievements() {
    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('achievements')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError
      setAchievements(data || [])
    } catch (err) {
      setError(err.message)
      console.error('Error fetching achievements:', err)
    } finally {
      setLoading(false)
    }
  }

  const filteredAchievements = achievements.filter((achievement) => {
    if (filter === 'all') return true
    return achievement.type === filter
  })

  const filters = [
    { id: 'all', label: 'Все', count: achievements.length },
    {
      id: 'снаряжение',
      label: 'Снаряжение',
      count: achievements.filter((a) => a.type === 'снаряжение').length,
    },
    {
      id: 'заслуга',
      label: 'Заслуги',
      count: achievements.filter((a) => a.type === 'заслуга').length,
    },
  ]

  if (loading) {
    return (
      <Card>
        <h3 className="text-lg font-semibold text-strict-black mb-4">
          🏅 Достижения
        </h3>
        <div className="flex justify-center py-12">
          <Loader size="medium" />
        </div>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <h3 className="text-lg font-semibold text-strict-black mb-4">
          🏅 Достижения
        </h3>
        <div className="text-center py-8">
          <p className="text-quick-silver text-sm">Ошибка загрузки достижений</p>
        </div>
      </Card>
    )
  }

  return (
    <Card>
      <h3 className="text-lg font-semibold text-strict-black mb-4">
        🏅 Достижения
      </h3>

      {/* Фильтры */}
      <div className="flex gap-2 mb-4">
        {filters.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`
              px-3 py-1.5 rounded text-sm transition-colors
              ${
                filter === f.id
                  ? 'bg-brandeis-blue text-white'
                  : 'bg-alice-blue text-quick-silver hover:bg-brandeis-blue/10'
              }
            `}
          >
            {f.label} ({f.count})
          </button>
        ))}
      </div>

      {/* Список достижений */}
      {filteredAchievements.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🎯</div>
          <p className="text-quick-silver">
            {filter === 'all'
              ? 'У вас пока нет достижений'
              : `Нет достижений типа "${filter}"`}
          </p>
          <p className="text-sm text-quick-silver mt-1">
            Продолжайте тренироваться!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAchievements.map((achievement) => {
            const typeIcon = achievement.type === 'снаряжение' ? '⚔️' : '⭐'
            const typeColor =
              achievement.type === 'снаряжение'
                ? 'bg-orange-peel/10 text-orange-peel'
                : 'bg-brandeis-blue/10 text-brandeis-blue'

            return (
              <div
                key={achievement.id}
                className="p-4 bg-alice-blue rounded-lg hover:bg-alice-blue/70 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="text-3xl flex-shrink-0">{typeIcon}</div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-strict-black">
                      {achievement.title}
                    </h4>
                    {achievement.description && (
                      <p className="text-sm text-quick-silver mt-1">
                        {achievement.description}
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-2">
                      <span className={`text-xs px-2 py-1 rounded ${typeColor}`}>
                        {achievement.type}
                      </span>
                      {achievement.points > 0 && (
                        <span className="text-xs text-brandeis-blue font-medium">
                          +{achievement.points} очков
                        </span>
                      )}
                      <span className="text-xs text-quick-silver">
                        {new Date(achievement.created_at).toLocaleDateString('ru-RU')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </Card>
  )
}
