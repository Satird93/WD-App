import { useState } from 'react'
import { supabase } from '../../utils/supabaseClient'
import { FENCING_SPECIALIZATIONS } from '../../utils/constants'
import Button from '../ui/Button'
import Card from '../ui/Card'

/**
 * Экран выбора специализации для новых пользователей
 * Отображается при первом входе
 */
export default function SpecializationSetup({ user, onComplete }) {
  const [selectedSpecialization, setSelectedSpecialization] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const specializations = [
    {
      id: FENCING_SPECIALIZATIONS.SABRE,
      name: 'Сабля',
      icon: '🗡️',
      description: 'Рубящие и колющие удары, динамичный стиль боя',
    },
    {
      id: FENCING_SPECIALIZATIONS.LONGSWORD,
      name: 'Длинный меч',
      icon: '⚔️',
      description: 'Двуручная техника, немецкая школа фехтования',
    },
    {
      id: FENCING_SPECIALIZATIONS.RAPIER,
      name: 'Рапира',
      icon: '🤺',
      description: 'Колющее оружие, классическая техника',
    },
  ]

  const handleSubmit = async () => {
    if (!selectedSpecialization) {
      setError('Выберите специализацию')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const { error: updateError } = await supabase
        .from('users')
        .update({ fencing_specialization: selectedSpecialization })
        .eq('id', user.id)

      if (updateError) throw updateError

      // Уведомляем родительский компонент об успешной настройке
      onComplete({ ...user, fencing_specialization: selectedSpecialization })
    } catch (err) {
      setError(`Ошибка: ${err.message}`)
      console.error('Error setting specialization:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSkip = async () => {
    // Можно пропустить выбор специализации
    onComplete(user)
  }

  return (
    <div className="min-h-screen bg-alabaster flex items-center justify-center p-6">
      <Card className="max-w-2xl w-full">
        {/* Заголовок */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">⚔️</div>
          <h1 className="text-2xl font-bold text-strict-black mb-2">
            Добро пожаловать, {user.full_name}!
          </h1>
          <p className="text-quick-silver">
            Выберите вашу специализацию фехтования
          </p>
        </div>

        {/* Варианты специализаций */}
        <div className="space-y-3 mb-6">
          {specializations.map((spec) => (
            <button
              key={spec.id}
              onClick={() => setSelectedSpecialization(spec.id)}
              disabled={isSubmitting}
              className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                selectedSpecialization === spec.id
                  ? 'border-brandeis-blue bg-brandeis-blue/10'
                  : 'border-quick-silver/20 hover:border-brandeis-blue/50 bg-white'
              } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <div className="flex items-start gap-4">
                <div className="text-4xl">{spec.icon}</div>
                <div className="flex-1">
                  <h3 className="font-semibold text-strict-black text-lg mb-1">
                    {spec.name}
                  </h3>
                  <p className="text-sm text-quick-silver">{spec.description}</p>
                </div>
                {selectedSpecialization === spec.id && (
                  <div className="text-brandeis-blue text-2xl">✓</div>
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Информация */}
        <div className="bg-alice-blue p-4 rounded-lg mb-6">
          <p className="text-sm text-quick-silver">
            💡 Специализация определяет, какие фехтовальные челленджи вы будете видеть.
            Вы всегда сможете изменить её в настройках профиля.
          </p>
        </div>

        {/* Ошибка */}
        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-4">
            {error}
          </div>
        )}

        {/* Кнопки */}
        <div className="flex gap-3">
          <Button
            onClick={handleSubmit}
            disabled={!selectedSpecialization || isSubmitting}
            variant="primary"
            className="flex-1"
          >
            {isSubmitting ? 'Сохранение...' : 'Продолжить'}
          </Button>
          <Button
            onClick={handleSkip}
            disabled={isSubmitting}
            variant="secondary"
          >
            Пропустить
          </Button>
        </div>

        {/* Дополнительная информация */}
        <p className="text-xs text-quick-silver text-center mt-4">
          Если пропустите выбор, вы сможете установить специализацию позже
        </p>
      </Card>
    </div>
  )
}
