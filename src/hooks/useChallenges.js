import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../utils/supabaseClient'

/**
 * Хук для работы с челленджами
 * Following vercel-react-best-practices: async-parallel, rerender-functional-setstate
 */
export function useChallenges(category = null) {
  const [challenges, setChallenges] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchChallenges()
  }, [category])

  async function fetchChallenges() {
    try {
      setLoading(true)
      let query = supabase
        .from('challenges')
        .select('*')
        .eq('is_active', true)
        .order('name')

      if (category) {
        query = query.eq('category', category)
      }

      const { data, error: fetchError } = await query

      if (fetchError) throw fetchError
      setChallenges(data || [])
    } catch (err) {
      setError(err.message)
      console.error('Error fetching challenges:', err)
    } finally {
      setLoading(false)
    }
  }

  // Following vercel-react-best-practices: async-defer-await
  const completeChallenge = useCallback(async (userId, challengeId, pointsEarned) => {
    try {
      // Сначала записываем выполнение челленджа
      const { error: insertError } = await supabase
        .from('user_challenges')
        .insert({
          user_id: userId,
          challenge_id: challengeId,
          points_earned: pointsEarned,
        })

      if (insertError) throw insertError

      // Затем обновляем total_points пользователя
      const { error: updateError } = await supabase.rpc('increment_user_points', {
        p_user_id: userId,
        p_points: pointsEarned,
      })

      if (updateError) {
        console.warn('Error updating user points:', updateError)
      }

      return { success: true }
    } catch (err) {
      console.error('Error completing challenge:', err)
      throw new Error(`Не удалось отметить челлендж: ${err.message}`)
    }
  }, [])

  return { challenges, loading, error, completeChallenge, refetch: fetchChallenges }
}
