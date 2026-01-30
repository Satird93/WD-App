// Форматирование даты
export function formatDate(date) {
  const d = new Date(date)
  return d.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

// Форматирование времени
export function formatTime(date) {
  const d = new Date(date)
  return d.toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

// Получение начала текущей недели
export function getWeekStart() {
  const now = new Date()
  const dayOfWeek = now.getDay()
  const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1
  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() - diff)
  weekStart.setHours(0, 0, 0, 0)
  return weekStart
}

// Получение конца текущей недели
export function getWeekEnd() {
  const weekStart = getWeekStart()
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 6)
  weekEnd.setHours(23, 59, 59, 999)
  return weekEnd
}

// Проверка, является ли дата сегодняшней
export function isToday(date) {
  const today = new Date()
  const d = new Date(date)
  return (
    d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear()
  )
}

// Получение следующей вехи стрика
export function getNextStreakMilestone(currentStreak) {
  if (currentStreak < 7) return 7
  if (currentStreak < 30) return 30
  return 100
}

// Вычисление прогресса до следующей вехи
export function getStreakProgress(currentStreak) {
  const nextMilestone = getNextStreakMilestone(currentStreak)
  return Math.round((currentStreak / nextMilestone) * 100)
}
