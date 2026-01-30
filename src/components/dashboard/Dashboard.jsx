import { useState, useEffect } from 'react'
import { supabase } from '../../utils/supabaseClient'
import { getWeekStart } from '../../utils/helpers'
import StreakCounter from './StreakCounter'
import WeeklyProgress from './WeeklyProgress'
import MiniLeaderboard from './MiniLeaderboard'
import FoxMascot from './FoxMascot'
import Button from '../ui/Button'
import Loader from '../ui/Loader'
import Card from '../ui/Card'

/**
 * Главный экран приложения
 * Following vercel-react-best-practices: async-parallel
 */
export default function Dashboard({ user, onNavigate }) {
  const [stats, setStats] = useState({
    streak: 0,
    weeklyPoints: 0,
    totalPoints: 0,
    level: 1,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user?.id) {
      fetchUserStats()
    }
  }, [user?.id])

  // Following vercel-react-best-practices: async-parallel
  async function fetchUserStats() {
    if (!user?.id) return

    try {
      setLoading(true)

      const weekStart = getWeekStart()

      // Параллельные запросы
      const [userDataResult, weekChallengesResult] = await Promise.all([
        supabase
          .from('users')
          .select('current_streak, total_points, level')
          .eq('id', user.id)
          .single(),
        supabase
          .from('user_challenges')
          .select('points_earned')
          .eq('user_id', user.id)
          .gte('completed_at', weekStart.toISOString()),
      ])

      if (userDataResult.error) throw userDataResult.error
      if (weekChallengesResult.error) throw weekChallengesResult.error

      const weeklyPoints = (weekChallengesResult.data || []).reduce(
        (sum, c) => sum + (c.points_earned || 0),
        0
      )

      setStats({
        streak: userDataResult.data.current_streak || 0,
        weeklyPoints,
        totalPoints: userDataResult.data.total_points || 0,
        level: userDataResult.data.level || 1,
      })
    } catch (err) {
      console.error('Error fetching stats:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-alabaster">
        <Loader size="large" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-alabaster pb-20 p-4">
      {/* Заголовок */}
      <Card className="mb-4 animate-fade-in">
        <h1 className="text-strict-black text-2xl font-bold">
          👋 Привет, {user.full_name}
        </h1>
        <p className="text-quick-silver">
          Уровень {stats.level} • {stats.totalPoints} очков
        </p>
      </Card>

      {/* Лис Ренар */}
      <div className="mb-4">
        <FoxMascot user={user} />
      </div>

      {/* Стрик */}
      <StreakCounter streak={stats.streak} />

      {/* Недельные очки */}
      <WeeklyProgress current={stats.weeklyPoints} />

      {/* Мини-рейтинг */}
      <div className="mb-4">
        <MiniLeaderboard onViewFull={() => onNavigate?.('leaderboard')} />
      </div>

      {/* Действия */}
      <div className="grid grid-cols-2 gap-4 mt-6">
        <Button
          variant="primary"
          className="w-full"
          onClick={() => onNavigate?.('challenges')}
        >
          Выбрать челлендж
        </Button>
        <Button
          variant="secondary"
          className="w-full"
          onClick={() => onNavigate?.('profile')}
        >
          Статистика
        </Button>
      </div>
    </div>
  )
}
