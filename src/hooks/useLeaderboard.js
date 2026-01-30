import { useState, useEffect } from 'react'
import { supabase } from '../utils/supabaseClient'

/**
 * Хук для работы с рейтингами
 * @param {string} type - 'home' или 'fights'
 * @param {number} limit - количество записей
 */
export function useLeaderboard(type = 'home', limit = 10) {
  const [leaderboard, setLeaderboard] = useState([])
  const [userPosition, setUserPosition] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchLeaderboard()

    // Realtime обновления
    const subscription = supabase
      .channel('leaderboard-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: type === 'home' ? 'user_challenges' : 'fights',
        },
        () => {
          fetchLeaderboard()
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [type, limit])

  async function fetchLeaderboard() {
    try {
      setLoading(true)
      setError(null)

      if (type === 'home') {
        // Рейтинг по домашним тренировкам
        const { data, error: fetchError } = await supabase
          .from('users')
          .select('id, full_name, total_points, current_streak, level')
          .order('total_points', { ascending: false })
          .limit(limit)

        if (fetchError) throw fetchError
        setLeaderboard(data || [])
      } else {
        // Рейтинг по боям - используем RPC функцию
        const { data, error: fetchError } = await supabase
          .rpc('get_fights_leaderboard', {
            p_limit: limit,
          })

        if (fetchError) {
          // Если функция не существует, делаем вручную
          console.warn('RPC function not found, using manual query')
          const { data: fightsData, error: fightsError } = await supabase
            .from('fights')
            .select('winner_id, loser_id')

          if (fightsError) throw fightsError

          // Подсчитываем победы и поражения
          const stats = {}
          fightsData.forEach((fight) => {
            if (!stats[fight.winner_id]) {
              stats[fight.winner_id] = { wins: 0, losses: 0 }
            }
            if (!stats[fight.loser_id]) {
              stats[fight.loser_id] = { wins: 0, losses: 0 }
            }
            stats[fight.winner_id].wins++
            stats[fight.loser_id].losses++
          })

          // Получаем данные пользователей
          const userIds = Object.keys(stats)
          const { data: usersData, error: usersError } = await supabase
            .from('users')
            .select('id, full_name')
            .in('id', userIds)

          if (usersError) throw usersError

          // Формируем итоговый массив
          const leaderboardData = usersData.map((user) => ({
            id: user.id,
            full_name: user.full_name,
            wins: stats[user.id].wins,
            losses: stats[user.id].losses,
            win_rate: stats[user.id].wins / (stats[user.id].wins + stats[user.id].losses),
          }))

          leaderboardData.sort((a, b) => b.wins - a.wins)
          setLeaderboard(leaderboardData.slice(0, limit))
        } else {
          setLeaderboard(data || [])
        }
      }
    } catch (err) {
      setError(err.message)
      console.error('Error fetching leaderboard:', err)
    } finally {
      setLoading(false)
    }
  }

  return { leaderboard, userPosition, loading, error, refetch: fetchLeaderboard }
}
