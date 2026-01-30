import { useState, useEffect } from 'react'
import { supabase } from '../utils/supabaseClient'

/**
 * Хук для получения стрика пользователя с realtime обновлениями
 * Following vercel-react-best-practices: rerender-derived-state
 */
export function useStreak(userId) {
  const [streak, setStreak] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) {
      setLoading(false)
      return
    }

    fetchStreak()

    // Подписка на изменения стрика
    const subscription = supabase
      .channel(`streak-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'users',
          filter: `id=eq.${userId}`,
        },
        (payload) => {
          setStreak(payload.new.current_streak)
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [userId])

  async function fetchStreak() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('users')
        .select('current_streak')
        .eq('id', userId)
        .single()

      if (error) throw error
      setStreak(data.current_streak || 0)
    } catch (err) {
      console.error('Error fetching streak:', err)
    } finally {
      setLoading(false)
    }
  }

  return { streak, loading, refetch: fetchStreak }
}
