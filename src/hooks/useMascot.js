import { useState, useEffect } from 'react'
import { supabase } from '../utils/supabaseClient'

/**
 * Хук для получения сообщений маскота Лиса Ренара
 * @param {Object} user - объект пользователя с данными о стрике
 */
export function useMascot(user) {
  const [message, setMessage] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchMascotMessage()
    }
  }, [user?.current_streak])

  async function fetchMascotMessage() {
    try {
      setLoading(true)

      // Определяем категорию сообщения на основе стрика
      let category = 'мотивация'
      const streak = user?.current_streak || 0

      if (streak === 0) {
        category = 'порицание'
      } else if (streak >= 1 && streak <= 2) {
        // Иногда ирония для разнообразия
        category = Math.random() > 0.7 ? 'ирония' : 'мотивация'
      } else if (streak >= 3 && streak <= 6) {
        category = 'мотивация'
      } else if (streak >= 7) {
        category = 'похвала'
      }

      // Получаем случайное сообщение из выбранной категории
      const { data, error } = await supabase
        .from('mascot_messages')
        .select('message')
        .eq('category', category)
        .eq('is_active', true)

      if (error) {
        console.error('Error fetching mascot message:', error)
        // Используем дефолтные сообщения
        setMessage(getDefaultMessage(category))
      } else if (data && data.length > 0) {
        // Выбираем случайное сообщение
        const randomIndex = Math.floor(Math.random() * data.length)
        setMessage(data[randomIndex].message)
      } else {
        // Если нет сообщений в БД, используем дефолтные
        setMessage(getDefaultMessage(category))
      }
    } catch (err) {
      console.error('Error in useMascot:', err)
      setMessage(getDefaultMessage('мотивация'))
    } finally {
      setLoading(false)
    }
  }

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
