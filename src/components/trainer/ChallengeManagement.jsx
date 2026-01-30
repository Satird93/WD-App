import { useState, useEffect } from 'react'
import { supabase } from '../../utils/supabaseClient'
import { CATEGORIES, USER_ROLES } from '../../utils/constants'
import Button from '../ui/Button'
import Card from '../ui/Card'
import Loader from '../ui/Loader'
import Tabs from '../ui/Tabs'
import ChallengeForm from './ChallengeForm'

/**
 * Управление челленджами для тренеров
 * Following vercel-react-best-practices: rerender-functional-setstate
 */
export default function ChallengeManagement({ user }) {
  const [challenges, setChallenges] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [editingChallenge, setEditingChallenge] = useState(null)
  const [activeCategory, setActiveCategory] = useState('все')

  const isTrainerOrAdmin = user?.role === USER_ROLES.TRAINER || user?.role === USER_ROLES.ADMIN

  useEffect(() => {
    if (isTrainerOrAdmin) {
      fetchChallenges()
    }
  }, [isTrainerOrAdmin])

  async function fetchChallenges() {
    try {
      setLoading(true)
      const { data, error: fetchError } = await supabase
        .from('challenges')
        .select('*')
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError
      setChallenges(data || [])
    } catch (err) {
      setError(err.message)
      console.error('Error fetching challenges:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateChallenge = async (challengeData) => {
    try {
      const { error: insertError } = await supabase
        .from('challenges')
        .insert({
          ...challengeData,
          created_by: user.id,
        })

      if (insertError) throw insertError

      // Обновляем список
      await fetchChallenges()
      setShowForm(false)
    } catch (err) {
      throw new Error(`Не удалось создать челлендж: ${err.message}`)
    }
  }

  const handleUpdateChallenge = async (challengeData) => {
    try {
      const { error: updateError } = await supabase
        .from('challenges')
        .update(challengeData)
        .eq('id', editingChallenge.id)

      if (updateError) throw updateError

      // Обновляем список
      await fetchChallenges()
      setShowForm(false)
      setEditingChallenge(null)
    } catch (err) {
      throw new Error(`Не удалось обновить челлендж: ${err.message}`)
    }
  }

  const handleToggleActive = async (challenge) => {
    try {
      const { error: updateError } = await supabase
        .from('challenges')
        .update({ is_active: !challenge.is_active })
        .eq('id', challenge.id)

      if (updateError) throw updateError

      // Обновляем локальное состояние
      setChallenges(prev => prev.map(ch =>
        ch.id === challenge.id ? { ...ch, is_active: !ch.is_active } : ch
      ))
    } catch (err) {
      console.error('Error toggling challenge:', err)
    }
  }

  const handleEdit = (challenge) => {
    setEditingChallenge(challenge)
    setShowForm(true)
  }

  const handleCancelForm = () => {
    setShowForm(false)
    setEditingChallenge(null)
  }

  // Проверка прав доступа
  if (!isTrainerOrAdmin) {
    return (
      <div className="flex items-center justify-center h-screen bg-alabaster p-6">
        <Card className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-xl font-bold text-strict-black mb-2">
            Доступ запрещен
          </h2>
          <p className="text-quick-silver">
            Эта функция доступна только тренерам и администраторам
          </p>
        </Card>
      </div>
    )
  }

  // Загрузка
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-alabaster">
        <Loader size="large" />
      </div>
    )
  }

  // Ошибка
  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-alabaster p-6">
        <Card className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-strict-black mb-2">Ошибка</h2>
          <p className="text-quick-silver mb-4">{error}</p>
          <Button onClick={fetchChallenges}>Попробовать снова</Button>
        </Card>
      </div>
    )
  }

  // Форма создания/редактирования
  if (showForm) {
    return (
      <div className="min-h-screen bg-alabaster p-6 pb-24">
        <ChallengeForm
          onSubmit={editingChallenge ? handleUpdateChallenge : handleCreateChallenge}
          onCancel={handleCancelForm}
          initialData={editingChallenge}
          userRole={user.role}
        />
      </div>
    )
  }

  // Фильтрация челленджей
  const filteredChallenges = challenges.filter(ch => {
    if (activeCategory === 'все') return true
    return ch.category === activeCategory
  })

  const tabs = [
    { id: 'все', label: 'Все', count: challenges.length },
    { id: CATEGORIES.OFP, label: 'ОФП', count: challenges.filter(ch => ch.category === CATEGORIES.OFP).length },
    { id: CATEGORIES.FENCING, label: 'Фехтование', count: challenges.filter(ch => ch.category === CATEGORIES.FENCING).length },
  ]

  return (
    <div className="min-h-screen bg-alabaster p-6 pb-24">
      <div className="max-w-4xl mx-auto">
        {/* Заголовок */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-strict-black mb-4">
            Управление челленджами
          </h1>
          <Button 
            onClick={() => setShowForm(true)}
            className="w-full sm:w-auto text-base font-bold py-3 px-6"
          >
            <span className="text-lg mr-2">+</span>
            Создать челлендж
          </Button>
        </div>

        {/* Табы */}
        <div className="mb-6">
          <Tabs
            tabs={tabs}
            activeTab={activeCategory}
            onTabChange={setActiveCategory}
          />
        </div>

        {/* Список челленджей */}
        <div className="space-y-3">
          {filteredChallenges.length === 0 ? (
            <Card className="text-center py-12">
              <p className="text-quick-silver">Нет челленджей в этой категории</p>
            </Card>
          ) : (
            filteredChallenges.map(challenge => (
              <Card key={challenge.id} className="hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-strict-black">
                        {challenge.name}
                      </h3>
                      {!challenge.is_active && (
                        <span className="text-xs bg-quick-silver/20 text-quick-silver px-2 py-1 rounded">
                          Неактивен
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-quick-silver mb-2">
                      {challenge.description}
                    </p>
                    <div className="flex gap-3 text-xs text-quick-silver">
                      <span className="bg-alice-blue px-2 py-1 rounded">
                        {challenge.category}
                      </span>
                      <span className="bg-alice-blue px-2 py-1 rounded">
                        {challenge.difficulty}
                      </span>
                      <span className="bg-brandeis-blue/10 text-brandeis-blue px-2 py-1 rounded font-medium">
                        {challenge.points} очков
                      </span>
                      {challenge.fencing_specialization && (
                        <span className="bg-orange-peel/10 text-orange-peel px-2 py-1 rounded">
                          {challenge.fencing_specialization}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Действия */}
                  <div className="flex flex-col gap-2 ml-4">
                    <button
                      onClick={() => handleEdit(challenge)}
                      className="flex items-center justify-center gap-1 bg-brandeis-blue text-white hover:bg-brandeis-blue/90 text-sm font-semibold px-4 py-2.5 rounded-lg border-2 border-strict-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all w-full whitespace-nowrap"
                    >
                      <span>✏️</span>
                      <span>Изменить</span>
                    </button>
                    <button
                      onClick={() => handleToggleActive(challenge)}
                      className={`flex items-center justify-center gap-1 text-sm font-semibold px-4 py-2.5 rounded-lg border-2 border-strict-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all w-full whitespace-nowrap ${
                        challenge.is_active
                          ? 'bg-quick-silver/20 text-quick-silver hover:bg-quick-silver/30'
                          : 'bg-green-500 text-white hover:bg-green-600'
                      }`}
                    >
                      <span>{challenge.is_active ? '🚫' : '✅'}</span>
                      <span>{challenge.is_active ? 'Выкл' : 'Вкл'}</span>
                    </button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
