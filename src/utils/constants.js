// Очки за сложность
export const POINTS = {
  OFP: {
    EASY: 1,
    MEDIUM: 3,
    HARD: 5,
  },
  FENCING: {
    EASY: 2,
    MEDIUM: 4,
    HARD: 6,
  },
}

// Категории упражнений
export const CATEGORIES = {
  OFP: 'офп',
  FENCING: 'фехтование',
}

// Уровни сложности
export const DIFFICULTY = {
  EASY: 'легко',
  MEDIUM: 'средне',
  HARD: 'хард',
}

// Цели и награды за стрики
export const STREAK_MILESTONES = [
  { days: 7, title: 'Первый уровень мастерства' },
  { days: 30, title: 'Серьёзный воин' },
  { days: 100, title: 'Легенда клуба' },
]

// Недельная цель по очкам
export const WEEKLY_GOAL = 12

// Типы боёв
export const FIGHT_TYPES = {
  SPARRING: 'спарринг',
  TOURNAMENT: 'турнир',
}

// Типы достижений
export const ACHIEVEMENT_TYPES = {
  EQUIPMENT: 'снаряжение',
  MERIT: 'заслуга',
}

// Категории фраз маскота
export const MASCOT_CATEGORIES = {
  MOTIVATION: 'мотивация',
  REPROACH: 'порицание',
  PRAISE: 'похвала',
  IRONY: 'ирония',
}

// Роли пользователей
export const USER_ROLES = {
  ADMIN: 'admin',
  TRAINER: 'trainer',
  STUDENT: 'student',
}

// Специализации фехтования
export const FENCING_SPECIALIZATIONS = {
  SABRE: 'сабля',
  LONGSWORD: 'длинный меч',
  RAPIER: 'рапира',
  GENERAL: 'общее', // для челленджей доступных всем
}
