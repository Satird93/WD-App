import { supabase } from './supabaseClient'

/**
 * Получение Telegram WebApp инстанса
 * @returns {Object} Telegram WebApp объект
 */
export function getTelegramWebApp() {
  if (typeof window === 'undefined' || !window.Telegram?.WebApp) {
    return null
  }
  return window.Telegram.WebApp
}

/**
 * Инициализация Telegram Mini App
 */
export function initTelegramApp() {
  const webApp = getTelegramWebApp()
  if (!webApp) {
    console.warn('Telegram WebApp not available')
    return null
  }

  // Расширяем приложение на весь экран
  webApp.expand()

  // Устанавливаем цвет фона
  webApp.setHeaderColor('#EFE5DC')
  webApp.setBackgroundColor('#EFE5DC')

  // Показываем кнопку "Назад" если нужно
  webApp.BackButton.hide()

  return webApp
}

/**
 * Получение данных пользователя из Telegram
 * @returns {Object|null} Данные пользователя или null
 */
export function getTelegramUser() {
  const webApp = getTelegramWebApp()
  if (!webApp?.initDataUnsafe?.user) {
    // Режим разработки: если нет Telegram, возвращаем тестового пользователя
    if (import.meta.env.DEV) {
      console.warn('Development mode: using mock Telegram user')
      return {
        id: 123456789,
        first_name: 'Тестовый',
        last_name: 'Пользователь',
        username: 'test_user',
      }
    }
    return null
  }

  return webApp.initDataUnsafe.user
}

/**
 * Валидация и получение/создание пользователя в Supabase
 * Following vercel-react-best-practices: async-defer-await
 * @returns {Promise<Object>} Данные пользователя из БД
 */
export async function authenticateTelegramUser() {
  const webApp = getTelegramWebApp()
  const telegramUser = getTelegramUser()

  if (!telegramUser) {
    throw new Error('No Telegram user data available')
  }

  // Проверяем существование пользователя
  const { data: existingUser, error: fetchError } = await supabase
    .from('users')
    .select('*')
    .eq('telegram_id', telegramUser.id)
    .maybeSingle()

  if (fetchError) {
    throw new Error(`Error fetching user: ${fetchError.message}`)
  }

  // Если пользователь существует, возвращаем его
  if (existingUser) {
    return existingUser
  }

  // Создаём нового пользователя
  const { data: newUser, error: insertError } = await supabase
    .from('users')
    .insert({
      telegram_id: telegramUser.id,
      username: telegramUser.username || null,
      full_name: `${telegramUser.first_name} ${telegramUser.last_name || ''}`.trim(),
    })
    .select()
    .single()

  if (insertError) {
    throw new Error(`Error creating user: ${insertError.message}`)
  }

  return newUser
}

/**
 * Показать всплывающее уведомление в Telegram
 * @param {string} message - Текст уведомления
 */
export function showTelegramAlert(message) {
  const webApp = getTelegramWebApp()
  if (webApp) {
    webApp.showAlert(message)
  }
}

/**
 * Показать подтверждение в Telegram
 * @param {string} message - Текст подтверждения
 * @returns {Promise<boolean>} true если пользователь подтвердил
 */
export function showTelegramConfirm(message) {
  const webApp = getTelegramWebApp()
  if (!webApp) {
    return Promise.resolve(false)
  }

  return new Promise((resolve) => {
    webApp.showConfirm(message, (confirmed) => {
      resolve(confirmed)
    })
  })
}

/**
 * Вибрация устройства (легкая, средняя, сильная)
 * @param {string} style - 'light' | 'medium' | 'heavy'
 */
export function triggerHapticFeedback(style = 'light') {
  const webApp = getTelegramWebApp()
  if (webApp?.HapticFeedback) {
    const styles = {
      light: () => webApp.HapticFeedback.impactOccurred('light'),
      medium: () => webApp.HapticFeedback.impactOccurred('medium'),
      heavy: () => webApp.HapticFeedback.impactOccurred('heavy'),
      success: () => webApp.HapticFeedback.notificationOccurred('success'),
      error: () => webApp.HapticFeedback.notificationOccurred('error'),
    }
    styles[style]?.()
  }
}

/**
 * Удаление аккаунта пользователя
 * Удаляет пользователя из БД вместе со всеми связанными данными
 * @param {string} userId - ID пользователя для удаления
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function deleteUserAccount(userId) {
  try {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', userId)

    if (error) {
      console.error('Error deleting user account:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (err) {
    console.error('Unexpected error deleting account:', err)
    return { success: false, error: err.message }
  }
}

