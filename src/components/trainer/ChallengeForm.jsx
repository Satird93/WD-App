import { useState } from 'react'
import { CATEGORIES, DIFFICULTY, POINTS, FENCING_SPECIALIZATIONS } from '../../utils/constants'
import Button from '../ui/Button'
import Card from '../ui/Card'

/**
 * Форма для создания/редактирования челленджа
 * Доступна только тренерам и админам
 */
export default function ChallengeForm({ onSubmit, onCancel, initialData = null, userRole }) {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    category: initialData?.category || CATEGORIES.OFP,
    difficulty: initialData?.difficulty || DIFFICULTY.EASY,
    description: initialData?.description || '',
    fencing_specialization: initialData?.fencing_specialization || null,
  })

  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Автоматический расчет очков
  const calculatePoints = () => {
    const category = formData.category === CATEGORIES.OFP ? 'OFP' : 'FENCING'
    const difficulty =
      formData.difficulty === DIFFICULTY.EASY ? 'EASY' :
      formData.difficulty === DIFFICULTY.MEDIUM ? 'MEDIUM' : 'HARD'

    return POINTS[category][difficulty]
  }

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }))

    // Очищаем ошибку для этого поля
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }))
    }

    // Если сменили категорию на ОФП - убираем специализацию
    if (field === 'category' && value === CATEGORIES.OFP) {
      setFormData(prev => ({ ...prev, fencing_specialization: null }))
    }
  }

  const validate = () => {
    const newErrors = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Введите название челленджа'
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Введите описание'
    }

    // Для фехтования требуется специализация
    if (formData.category === CATEGORIES.FENCING && !formData.fencing_specialization) {
      newErrors.fencing_specialization = 'Выберите специализацию'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validate()) {
      return
    }

    setIsSubmitting(true)

    try {
      const challengeData = {
        ...formData,
        points: calculatePoints(),
        is_active: true,
      }

      await onSubmit(challengeData)
    } catch (error) {
      console.error('Error submitting challenge:', error)
      setErrors({ submit: error.message })
    } finally {
      setIsSubmitting(false)
    }
  }

  const isFencing = formData.category === CATEGORIES.FENCING

  return (
    <Card className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-strict-black mb-6">
        {initialData ? 'Редактировать челлендж' : 'Новый челлендж'}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Название */}
        <div>
          <label className="block text-sm font-medium text-strict-black mb-1">
            Название *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            className={`w-full px-4 py-2 rounded-lg border ${
              errors.name ? 'border-red-500' : 'border-quick-silver'
            } focus:outline-none focus:ring-2 focus:ring-brandeis-blue`}
            placeholder="Например: Отжимания классические"
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-500">{errors.name}</p>
          )}
        </div>

        {/* Категория */}
        <div>
          <label className="block text-sm font-medium text-strict-black mb-1">
            Категория *
          </label>
          <div className="flex gap-4">
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="category"
                value={CATEGORIES.OFP}
                checked={formData.category === CATEGORIES.OFP}
                onChange={(e) => handleChange('category', e.target.value)}
                className="mr-2"
              />
              <span>ОФП</span>
            </label>
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="category"
                value={CATEGORIES.FENCING}
                checked={formData.category === CATEGORIES.FENCING}
                onChange={(e) => handleChange('category', e.target.value)}
                className="mr-2"
              />
              <span>Фехтование</span>
            </label>
          </div>
        </div>

        {/* Специализация (только для фехтования) */}
        {isFencing && (
          <div>
            <label className="block text-sm font-medium text-strict-black mb-1">
              Специализация *
            </label>
            <select
              value={formData.fencing_specialization || ''}
              onChange={(e) => handleChange('fencing_specialization', e.target.value || null)}
              className={`w-full px-4 py-2 rounded-lg border ${
                errors.fencing_specialization ? 'border-red-500' : 'border-quick-silver'
              } focus:outline-none focus:ring-2 focus:ring-brandeis-blue`}
            >
              <option value="">Выберите специализацию</option>
              <option value={FENCING_SPECIALIZATIONS.GENERAL}>Общее (для всех)</option>
              <option value={FENCING_SPECIALIZATIONS.SABRE}>Сабля</option>
              <option value={FENCING_SPECIALIZATIONS.LONGSWORD}>Длинный меч</option>
              <option value={FENCING_SPECIALIZATIONS.RAPIER}>Рапира</option>
            </select>
            {errors.fencing_specialization && (
              <p className="mt-1 text-sm text-red-500">{errors.fencing_specialization}</p>
            )}
          </div>
        )}

        {/* Сложность */}
        <div>
          <label className="block text-sm font-medium text-strict-black mb-1">
            Сложность *
          </label>
          <div className="flex gap-4">
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="difficulty"
                value={DIFFICULTY.EASY}
                checked={formData.difficulty === DIFFICULTY.EASY}
                onChange={(e) => handleChange('difficulty', e.target.value)}
                className="mr-2"
              />
              <span>Легко ({POINTS[formData.category === CATEGORIES.OFP ? 'OFP' : 'FENCING'].EASY} очков)</span>
            </label>
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="difficulty"
                value={DIFFICULTY.MEDIUM}
                checked={formData.difficulty === DIFFICULTY.MEDIUM}
                onChange={(e) => handleChange('difficulty', e.target.value)}
                className="mr-2"
              />
              <span>Средне ({POINTS[formData.category === CATEGORIES.OFP ? 'OFP' : 'FENCING'].MEDIUM} очков)</span>
            </label>
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="difficulty"
                value={DIFFICULTY.HARD}
                checked={formData.difficulty === DIFFICULTY.HARD}
                onChange={(e) => handleChange('difficulty', e.target.value)}
                className="mr-2"
              />
              <span>Хард ({POINTS[formData.category === CATEGORIES.OFP ? 'OFP' : 'FENCING'].HARD} очков)</span>
            </label>
          </div>
        </div>

        {/* Описание */}
        <div>
          <label className="block text-sm font-medium text-strict-black mb-1">
            Описание *
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            rows={3}
            className={`w-full px-4 py-2 rounded-lg border ${
              errors.description ? 'border-red-500' : 'border-quick-silver'
            } focus:outline-none focus:ring-2 focus:ring-brandeis-blue resize-none`}
            placeholder="Опишите задание подробно"
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-500">{errors.description}</p>
          )}
        </div>

        {/* Итоговые очки */}
        <div className="bg-alice-blue p-4 rounded-lg">
          <p className="text-sm text-quick-silver">
            Очки за выполнение: <span className="font-bold text-brandeis-blue">{calculatePoints()}</span>
          </p>
        </div>

        {/* Ошибка отправки */}
        {errors.submit && (
          <div className="bg-red-50 text-red-700 p-4 rounded-lg">
            {errors.submit}
          </div>
        )}

        {/* Кнопки */}
        <div className="flex gap-3 pt-4">
          <Button
            type="submit"
            variant="primary"
            disabled={isSubmitting}
            className="flex-1"
          >
            {isSubmitting ? 'Сохранение...' : initialData ? 'Сохранить' : 'Создать'}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Отмена
          </Button>
        </div>
      </form>
    </Card>
  )
}
