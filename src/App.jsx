import { useState, useEffect } from 'react'
import { initTelegramApp } from './utils/telegramAuth'
import { useAuth } from './hooks/useAuth'
import { USER_ROLES } from './utils/constants'
import TabBar from './components/layout/TabBar'
import Dashboard from './components/dashboard/Dashboard'
import ChallengesScreen from './components/challenges/ChallengesScreen'
import TrainerPanel from './components/trainer/TrainerPanel'
import Leaderboard from './components/leaderboard/Leaderboard'
import Profile from './components/profile/Profile'
import SpecializationSetup from './components/onboarding/SpecializationSetup'
import Loader from './components/ui/Loader'

/**
 * Главный компонент приложения
 * Following vercel-react-best-practices: rerender-functional-setstate
 */
function App() {
  const [activeTab, setActiveTab] = useState('home')
  const [currentUser, setCurrentUser] = useState(null)
  const { user, loading, error, retry } = useAuth()

  useEffect(() => {
    // Инициализируем Telegram Mini App
    initTelegramApp()
  }, [])

  useEffect(() => {
    if (user) {
      console.log('🔄 User data updated:', user.total_points, 'points')
      setCurrentUser(user)
    }
  }, [user])

  // Обработка ошибок авторизации
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-alabaster p-6 text-center">
        <div className="text-6xl mb-4">⚠️</div>
        <h2 className="text-xl font-bold text-strict-black mb-2">
          Ошибка авторизации
        </h2>
        <p className="text-quick-silver mb-4">{error}</p>
        <p className="text-sm text-quick-silver">
          Попробуйте открыть приложение через Telegram
        </p>
      </div>
    )
  }

  // Загрузка
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-alabaster">
        <Loader size="large" />
        <p className="text-quick-silver mt-4">Загрузка...</p>
      </div>
    )
  }

  // Проверка: нужен ли экран выбора специализации для новых пользователей
  const needsSpecializationSetup =
    currentUser &&
    currentUser.role === USER_ROLES.STUDENT &&
    !currentUser.fencing_specialization

  // Показываем экран настройки специализации для новых учеников
  if (needsSpecializationSetup) {
    return (
      <SpecializationSetup
        user={currentUser}
        onComplete={(updatedUser) => setCurrentUser(updatedUser)}
      />
    )
  }

  // Отображение активного экрана
  const renderScreen = () => {
    switch (activeTab) {
      case 'home':
        return <Dashboard user={currentUser} onNavigate={setActiveTab} />
      case 'challenges':
        // Для тренеров и админов - панель тренера, для студентов - список челленджей
        if (currentUser?.role === USER_ROLES.TRAINER || currentUser?.role === USER_ROLES.ADMIN) {
          return <TrainerPanel user={currentUser} onBack={() => setActiveTab('home')} />
        }
        return <ChallengesScreen user={currentUser} onBack={() => setActiveTab('home')} onUserUpdate={retry} />
      case 'leaderboard':
        return <Leaderboard key={currentUser?.total_points} user={currentUser} />
      case 'profile':
        return <Profile key={currentUser?.total_points} user={currentUser} />
      default:
        return <Dashboard user={currentUser} />
    }
  }

  return (
    <div className="min-h-screen bg-alabaster pb-20">
      {renderScreen()}
      <TabBar activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  )
}

export default App
