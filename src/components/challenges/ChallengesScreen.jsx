import { useState, useEffect } from 'react'
import { supabase } from '../../utils/supabaseClient'
import { CATEGORIES, DIFFICULTY } from '../../utils/constants'
import Button from '../ui/Button'
import Card from '../ui/Card'
import Loader from '../ui/Loader'
import Tabs from '../ui/Tabs'
import Header from '../layout/Header'
import { useChallenges } from '../../hooks/useChallenges'

/**
 * Экран челленджей для студентов
 * Отображает доступные задания с учетом специализации
 * Following vercel-react-best-practices: rerender-functional-setstate
 */
export default function ChallengesScreen({ user, onBack, onUserUpdate }) {
  const [activeCategory, setActiveCategory] = useState(CATEGORIES.OFP)
  const [activeDifficulty, setActiveDifficulty] = useState('все')
  const [completedToday, setCompletedToday] = useState(new Set())
  const [loadingCompleted, setLoadingCompleted] = useState(true)

  const { challenges, loading, error, completeChallenge, refetch } = useChallenges(activeCategory)

  useEffect(() => {
    fetchCompletedToday()
  }, [user?.id])

  async function fetchCompletedToday() {
    try {
      setLoadingCompleted(true)
      const today = new Date().toISOString().split('T')[0]

      const { data, error: fetchError } = await supabase
        .from('user_challenges')
        .select('challenge_id')
        .eq('user_id', user.id)
        .gte('completed_at', `${today}T00:00:00`)
        .lt('completed_at', `${today}T23:59:59`)

      if (fetchError) throw fetchError

      const completedIds = new Set(data.map(item => item.challenge_id))
      setCompletedToday(completedIds)
    } catch (err) {
      console.error('Error fetching completed challenges:', err)
    } finally {
      setLoadingCompleted(false)
    }
  }

  const handleCompleteChallenge = async (challenge) => {
    try {
      await completeChallenge(user.id, challenge.id, challenge.points)

      // Обновляем список выполненных
      setCompletedToday(prev => new Set([...prev, challenge.id]))

      // Обновляем данные пользователя (если передан callback)
      if (onUserUpdate) {
        console.log('🔄 Calling onUserUpdate to refresh user data...')
        onUserUpdate()
      } else {
        console.warn('⚠️ onUserUpdate callback is not provided!')
      }

      // Показываем уведомление
      alert(`Челлендж выполнен! +${challenge.points} очков`)
    } catch (err) {
      alert(err.message)
    }
  }

  // Фильтрация челленджей по специализации и сложности
  const filteredChallenges = challenges.filter(ch => {
    // Фильтр по сложности
    if (activeDifficulty !== 'все' && ch.difficulty !== activeDifficulty) {
      return false
    }

    // Для фехтования фильтруем по специализации пользователя
    if (activeCategory === CATEGORIES.FENCING) {
      // Показываем общие челленджи и челленджи для специализации пользователя
      return ch.fencing_specialization === 'общее' ||
             ch.fencing_specialization === user?.fencing_specialization
    }

    return true
  })

  // Группировка по сложности
  const groupedChallenges = {
    [DIFFICULTY.EASY]: filteredChallenges.filter(ch => ch.difficulty === DIFFICULTY.EASY),
    [DIFFICULTY.MEDIUM]: filteredChallenges.filter(ch => ch.difficulty === DIFFICULTY.MEDIUM),
    [DIFFICULTY.HARD]: filteredChallenges.filter(ch => ch.difficulty === DIFFICULTY.HARD),
  }

  if (loading || loadingCompleted) {
    return (
      <div className="flex items-center justify-center h-screen bg-alabaster">
        <Loader size="large" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-alabaster p-6">
        <Card className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-strict-black mb-2">Ошибка</h2>
          <p className="text-quick-silver mb-4">{error}</p>
          <Button onClick={refetch}>Попробовать снова</Button>
        </Card>
      </div>
    )
  }

  const categoryTabs = [
    { id: CATEGORIES.OFP, label: 'ОФП' },
    { id: CATEGORIES.FENCING, label: 'Фехтование' },
  ]

  const difficultyTabs = [
    { id: 'все', label: 'Все', count: filteredChallenges.length },
    { id: DIFFICULTY.EASY, label: 'Легко', count: groupedChallenges[DIFFICULTY.EASY].length },
    { id: DIFFICULTY.MEDIUM, label: 'Средне', count: groupedChallenges[DIFFICULTY.MEDIUM].length },
    { id: DIFFICULTY.HARD, label: 'Хард', count: groupedChallenges[DIFFICULTY.HARD].length },
  ]

  return (
    <div className="min-h-screen bg-alabaster pb-20">
      <Header title="Челленджи" onBack={onBack} />

      <div className="p-4 max-w-4xl mx-auto">
        {/* Специализация */}
        {user?.fencing_specialization && activeCategory === CATEGORIES.FENCING && (
          <div className="mb-4 px-4 py-3 bg-gradient-to-r from-accent-orange/10 to-accent-orange/5 rounded-xl border border-accent-orange/20">
            <p className="text-sm text-accent-orange font-medium">
              🎯 Ваша специализация: {user.fencing_specialization}
            </p>
          </div>
        )}

        {/* Табы категорий */}
        <div className="mb-4">
          <Tabs
            tabs={categoryTabs}
            activeTab={activeCategory}
            onTabChange={setActiveCategory}
          />
        </div>

        {/* Табы сложности */}
        <div className="mb-6">
          <Tabs
            tabs={difficultyTabs}
            activeTab={activeDifficulty}
            onTabChange={setActiveDifficulty}
          />
        </div>

        {/* Список челленджей */}
        <div className="space-y-4">
          {activeDifficulty === 'все' ? (
            // Группированный вывод
            <>
              {Object.entries(groupedChallenges).map(([difficulty, items]) => {
                if (items.length === 0) return null

                return (
                  <div key={difficulty}>
                    <h3 className="text-sm font-semibold text-quick-silver uppercase mb-3">
                      {difficulty}
                    </h3>
                    <div className="space-y-3 mb-6">
                      {items.map(challenge => (
                        <ChallengeCard
                          key={challenge.id}
                          challenge={challenge}
                          isCompleted={completedToday.has(challenge.id)}
                          onComplete={handleCompleteChallenge}
                        />
                      ))}
                    </div>
                  </div>
                )
              })}
            </>
          ) : (
            // Простой список
            filteredChallenges.length === 0 ? (
              <Card className="text-center py-12">
                <p className="text-quick-silver">Нет челленджей этой сложности</p>
              </Card>
            ) : (
              filteredChallenges.map(challenge => (
                <ChallengeCard
                  key={challenge.id}
                  challenge={challenge}
                  isCompleted={completedToday.has(challenge.id)}
                  onComplete={handleCompleteChallenge}
                />
              ))
            )
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * Карточка челленджа (Soft Neobrutalism)
 */
function ChallengeCard({ challenge, isCompleted, onComplete }) {
  const difficultyColors = {
    легко: 'bg-green-100',
    средне: 'bg-yellow-100',
    хард: 'bg-red-100',
  }

  const difficultyTextColors = {
    легко: 'text-green-700',
    средне: 'text-yellow-700',
    хард: 'text-red-700',
  }

  const difficultyIcons = {
    легко: '⭐',
    средне: '⭐⭐',
    хард: '⭐⭐⭐',
  }

  return (
    <Card className={isCompleted ? 'bg-green-50' : 'bg-white'}>
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-bold text-strict-black text-base">{challenge.name}</h3>
            {challenge.fencing_specialization && challenge.fencing_specialization !== 'общее' && (
              <span className="text-xs bg-accent-orange text-white px-2 py-0.5 rounded font-semibold border border-strict-black">
                {challenge.fencing_specialization}
              </span>
            )}
          </div>

          <p className="text-sm text-strict-black mb-3 leading-relaxed">{challenge.description}</p>

          <div className="flex gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1 text-xs bg-brandeis-blue text-white px-2.5 py-1 rounded font-bold border border-strict-black">
              🏆 +{challenge.points}
            </span>

            <span className={`inline-flex items-center gap-1 text-xs ${difficultyColors[challenge.difficulty]} ${difficultyTextColors[challenge.difficulty]} px-2.5 py-1 rounded font-bold border border-strict-black`}>
              {difficultyIcons[challenge.difficulty]} {challenge.difficulty}
            </span>

            {isCompleted && (
              <span className="inline-flex items-center gap-1 text-xs bg-green-600 text-white px-2.5 py-1 rounded font-bold border border-strict-black">
                ✓ Готово
              </span>
            )}
          </div>
        </div>

        {!isCompleted && (
          <Button
            variant="primary"
            onClick={() => onComplete(challenge)}
            className="shrink-0 text-sm px-4 py-2"
          >
            ✓
          </Button>
        )}
      </div>
    </Card>
  )
}
