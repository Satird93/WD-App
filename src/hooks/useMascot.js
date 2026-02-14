import { useState, useEffect } from 'react'
import { supabase } from '../utils/supabaseClient'

/**
 * Хук для получения умных сообщений маскота Лиса Ренара
 * Анализирует активность пользователя и выбирает контекстно-зависимое сообщение
 * @param {Object} user - объект пользователя
 */
export function useMascot(user) {
  const [message, setMessage] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchMascotMessage()
    }
  }, [user?.current_streak, user?.id])

  async function fetchMascotMessage() {
    try {
      setLoading(true)

      // Получаем расширенные данные о пользователе
      const userData = await getUserActivityData(user.id)
      
      // Определяем категорию на основе умного анализа
      const category = determineSmartCategory(userData)

      // Получаем случайное сообщение из выбранной категории
      const { data, error } = await supabase
        .from('mascot_messages')
        .select('message')
        .eq('category', category)
        .eq('is_active', true)

      if (error) {
        console.error('Error fetching mascot message:', error)
        setMessage(getDefaultMessage(category))
      } else if (data && data.length > 0) {
        const randomIndex = Math.floor(Math.random() * data.length)
        setMessage(data[randomIndex].message)
      } else {
        setMessage(getDefaultMessage(category))
      }
    } catch (err) {
      console.error('Error in useMascot:', err)
      setMessage(getDefaultMessage('мотивация'))
    } finally {
      setLoading(false)
    }
  }

  /**
   * Получает расширенные данные об активности пользователя
   */
  async function getUserActivityData(userId) {
    try {
      const now = new Date()
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

      // Получаем челленджи за последние 7 дней
      const { data: recentChallenges } = await supabase
        .from('user_challenges')
        .select('*')
        .eq('user_id', userId)
        .gte('completed_at', sevenDaysAgo.toISOString())

      // Получаем бои за последние 7 дней
      const { data: recentFights } = await supabase
        .from('fights')
        .select('*')
        .or(`winner_id.eq.${userId},loser_id.eq.${userId}`)
        .gte('created_at', sevenDaysAgo.toISOString())

      // Получаем достижения за последние 7 дней
      const { data: recentAchievements } = await supabase
        .from('achievements')
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', sevenDaysAgo.toISOString())

      // Подсчитываем победы и поражения
      const wins = recentFights?.filter(f => f.winner_id === userId).length || 0
      const losses = recentFights?.filter(f => f.loser_id === userId).length || 0

      // Проверяем, есть ли челленджи сегодня
      const today = new Date().toISOString().split('T')[0]
      const hasChallengeToday = recentChallenges?.some(ch => {
        const challengeDate = new Date(ch.completed_at).toISOString().split('T')[0]
        return challengeDate === today
      })

      return {
        current_streak: user.current_streak || 0,
        last_challenge_date: user.last_challenge_date,
        total_points: user.total_points || 0,
        challenges_count: recentChallenges?.length || 0,
        fights_count: recentFights?.length || 0,
        wins,
        losses,
        achievements_count: recentAchievements?.length || 0,
        has_new_achievement: (recentAchievements?.length || 0) > 0,
        has_challenge_today: hasChallengeToday,
      }
    } catch (error) {
      console.error('Error fetching user activity:', error)
      return {
        current_streak: user.current_streak || 0,
        challenges_count: 0,
        fights_count: 0,
        wins: 0,
        losses: 0,
        achievements_count: 0,
        has_new_achievement: false,
        has_challenge_today: false,
      }
    }
  }

  /**
   * Умное определение категории сообщения на основе активности пользователя
   */
  function determineSmartCategory(userData) {
    const {
      current_streak,
      last_challenge_date,
      challenges_count,
      fights_count,
      wins,
      losses,
      has_new_achievement,
      has_challenge_today,
    } = userData

    // ПРИОРИТЕТ 0: Новый пользователь (нет истории активности)
    if (!last_challenge_date && current_streak === 0) {
      return 'мотивация' // Приветствуем новичка мотивацией
    }

    // Проверяем, сколько дней прошло с последней активности
    const daysSinceLastActivity = last_challenge_date
      ? Math.floor((new Date() - new Date(last_challenge_date)) / (1000 * 60 * 60 * 24))
      : 0

    // ПРИОРИТЕТ 1: Критические ситуации (долгое отсутствие)
    if (current_streak === 0 && daysSinceLastActivity > 7) {
      return 'порицание' // Жесткое порицание за долгое отсутствие
    }

    // ПРИОРИТЕТ 2: Новое достижение (всегда хвалим)
    if (has_new_achievement) {
      return 'похвала'
    }

    // ПРИОРИТЕТ 3: Активность сегодня + хороший стрик
    if (has_challenge_today && current_streak >= 3) {
      return 'похвала' // Хвалим за поддержание стрика
    }

    // ПРИОРИТЕТ 4: Дисбаланс активности (много челленджей, мало боев)
    if (challenges_count > 5 && fights_count === 0) {
      return 'ирония' // Ирония: тренируется дома, но не дерется
    }

    // ПРИОРИТЕТ 5: Много поражений подряд
    if (losses > wins && losses >= 3) {
      return 'мотивация' // Мотивируем после поражений
    }

    // ПРИОРИТЕТ 6: Много побед подряд
    if (wins > losses && wins >= 3) {
      return 'похвала' // Хвалим за победы
    }

    // ПРИОРИТЕТ 6: Стрик (основная логика)
    if (current_streak === 0) {
      // Стрик сброшен недавно (1-7 дней назад)
      if (daysSinceLastActivity > 0 && daysSinceLastActivity <= 7) {
        return 'мотивация' // Мотивируем начать заново
      }
      return 'порицание' // Fallback для стрика 0
    } else if (current_streak >= 7) {
      return 'похвала' // Длинный стрик заслуживает похвалы
    } else if (current_streak >= 3) {
      return 'мотивация' // Средний стрик - мотивируем продолжать
    } else if (current_streak >= 1) {
      // Короткий стрик - детерминированный выбор между иронией и мотивацией
      return getDeterministicCategory(user.id, ['ирония', 'мотивация'])
    }

    // По умолчанию - мотивация
    return 'мотивация'
  }

  /**
   * Детерминированный выбор категории на основе userId и текущей даты
   * Гарантирует, что одно и то же сообщение показывается в течение дня
   */
  function getDeterministicCategory(userId, categories) {
    const today = new Date().toISOString().split('T')[0]
    const seed = today + userId
    
    // Простой хеш-функция
    const hash = seed.split('').reduce((acc, char) => {
      return acc + char.charCodeAt(0)
    }, 0)
    
    return categories[hash % categories.length]
  }

  /**
   * Дефолтные сообщения на случай ошибки БД
   */
  function getDefaultMessage(category) {
    const defaultMessages = {
      мотивация: [
        'Продолжай в том же духе! 🦊',
        'Каждый день делает тебя сильнее!',
        'Ты на правильном пути!',
      ],
      порицание: [
        'Эй, где ты пропадал? Пора возвращаться к тренировкам! 😾',
        'Стрик прервался... Но это не повод сдаваться!',
        'Лис Ренар разочарован. Начни сначала!',
      ],
      похвала: [
        'Невероятно! Ты настоящий чемпион! 🏆',
        'Такой стрик впечатляет даже меня!',
        'Ты на огне! Продолжай в том же духе! 🔥',
      ],
      ирония: [
        'Ну что, решил наконец потренироваться? 😏',
        'О, смотрите кто вернулся!',
        'Неплохо, но я видел и получше...',
      ],
    }

    const messages = defaultMessages[category] || defaultMessages.мотивация
    return messages[Math.floor(Math.random() * messages.length)]
  }

  return { message, loading, refetch: fetchMascotMessage }
}
