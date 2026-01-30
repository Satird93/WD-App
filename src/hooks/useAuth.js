import { useState, useEffect } from 'react'
import { authenticateTelegramUser, getTelegramUser } from '../utils/telegramAuth'

/**
 * Хук для авторизации через Telegram
 * Following vercel-react-best-practices: async-defer-await, rerender-lazy-state-init
 */
export function useAuth() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    authenticateUser()
  }, [])

  async function authenticateUser() {
    try {
      setLoading(true)
      setError(null)

      // Проверяем наличие Telegram данных
      const telegramUser = getTelegramUser()
      if (!telegramUser) {
        throw new Error('Откройте приложение через Telegram')
      }

      // Аутентифицируем пользователя
      const userData = await authenticateTelegramUser()
      setUser(userData)
    } catch (err) {
      setError(err.message)
      console.error('Authentication error:', err)
    } finally {
      setLoading(false)
    }
  }

  return { user, loading, error, retry: authenticateUser }
}
