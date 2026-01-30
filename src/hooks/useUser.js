import { useState, useEffect } from 'react'
import { supabase } from '../utils/supabaseClient'

/**
 * Хук для получения данных пользователя с realtime обновлениями
 * Following vercel-react-best-practices: client-event-listeners
 */
export function useUser(userId) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!userId) {
      setLoading(false)
      return
    }

    fetchUser()

    // Подписка на изменения пользователя
    const subscription = supabase
      .channel(`user-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'users',
          filter: `id=eq.${userId}`,
        },
        (payload) => {
          setUser(payload.new)
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [userId])

  async function fetchUser() {
    try {
      setLoading(true)
      const { data, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (fetchError) throw fetchError
      setUser(data)
    } catch (err) {
      setError(err.message)
      console.error('Error fetching user:', err)
    } finally {
      setLoading(false)
    }
  }

  return { user, loading, error, refetch: fetchUser }
}
