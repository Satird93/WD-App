import { useState, useEffect } from 'react'
import { supabase } from '../../utils/supabaseClient'
import Header from '../layout/Header'
import Card from '../ui/Card'
import StatsChart from './StatsChart'
import Achievements from './Achievements'
import Loader from '../ui/Loader'

/**
 * Экран профиля пользователя
 * Загружает актуальные данные из БД при каждом открытии
 */
export default function Profile({ user }) {
  const [userData, setUserData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user?.id) {
      fetchUserData()
    }
  }, [user?.id])

  async function fetchUserData() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) throw error
      setUserData(data)
    } catch (err) {
      console.error('Error fetching user data:', err)
      // Fallback к переданному user, если ошибка
      setUserData(user)
    } finally {
      setLoading(false)
    }
  }

  if (loading || !userData) {
    return (
      <div className="flex items-center justify-center h-screen bg-alabaster">
        <Loader size="large" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-alabaster pb-24">
      <Header title="Профиль" showBack={false} />
      
      <div className="p-4 space-y-4">
        {/* Карточка пользователя */}
        <Card className="text-center">
          <div className="text-6xl mb-4">👤</div>
          <h2 className="text-2xl font-bold text-strict-black mb-2">
            {userData.full_name}
          </h2>
          <p className="text-quick-silver mb-4">
            @{userData.username || 'пользователь'}
          </p>

          {/* Статистика */}
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-brandeis-blue">
                {userData.level || 1}
              </div>
              <div className="text-xs text-quick-silver mt-1">Уровень</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-brandeis-blue">
                {userData.total_points || 0}
              </div>
              <div className="text-xs text-quick-silver mt-1">Очков</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-peel">
                {userData.current_streak || 0}
              </div>
              <div className="text-xs text-quick-silver mt-1">
                Дней подряд
              </div>
            </div>
          </div>

          {/* Специализация (если есть) */}
          {userData.fencing_specialization && (
            <div className="mt-4 pt-4 border-t border-alice-blue">
              <p className="text-sm text-quick-silver">Специализация</p>
              <p className="text-lg font-semibold text-strict-black mt-1">
                {userData.fencing_specialization}
              </p>
            </div>
          )}

          {/* Роль */}
          {userData.role && (
            <div className="mt-2">
              <span
                className={`
                  inline-block px-3 py-1 rounded text-sm
                  ${
                    userData.role === 'trainer' || userData.role === 'admin'
                      ? 'bg-orange-peel/10 text-orange-peel'
                      : 'bg-brandeis-blue/10 text-brandeis-blue'
                  }
                `}
              >
                {userData.role === 'trainer'
                  ? 'Тренер'
                  : userData.role === 'admin'
                  ? 'Администратор'
                  : 'Ученик'}
              </span>
            </div>
          )}
        </Card>

        {/* График прогресса */}
        <StatsChart userId={userData.id} />

        {/* Достижения */}
        <Achievements userId={userData.id} />
      </div>
    </div>
  )
}
