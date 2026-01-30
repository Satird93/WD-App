import { useState } from 'react'
import { USER_ROLES } from '../../utils/constants'
import Header from '../layout/Header'
import Card from '../ui/Card'
import Tabs from '../ui/Tabs'
import FightRecorder from './FightRecorder'
import AchievementGiver from './AchievementGiver'
import ChallengeManagement from './ChallengeManagement'

/**
 * Панель тренера - центральное место для всех функций тренера
 */
export default function TrainerPanel({ user }) {
  const [activeTab, setActiveTab] = useState('fights')

  // Проверка прав доступа
  const isTrainerOrAdmin = user?.role === USER_ROLES.TRAINER || user?.role === USER_ROLES.ADMIN

  if (!isTrainerOrAdmin) {
    return (
      <div className="flex items-center justify-center h-screen bg-alabaster p-6">
        <Card className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-xl font-bold text-strict-black mb-2">
            Доступ запрещён
          </h2>
          <p className="text-quick-silver">
            Эта функция доступна только тренерам и администраторам
          </p>
        </Card>
      </div>
    )
  }

  const tabs = [
    { id: 'fights', label: 'Бои', icon: '⚔️' },
    { id: 'achievements', label: 'Достижения', icon: '🏅' },
    { id: 'challenges', label: 'Челленджи', icon: '💪' },
  ]

  const renderContent = () => {
    switch (activeTab) {
      case 'fights':
        return <FightRecorder user={user} />
      case 'achievements':
        return <AchievementGiver user={user} />
      case 'challenges':
        return <ChallengeManagement user={user} />
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-alabaster pb-24">
      <Header title="Панель тренера" emoji="👨‍🏫" />
      
      <div className="p-4">
        {/* Приветствие */}
        <Card className="mb-4">
          <h2 className="text-xl font-bold text-strict-black mb-2">
            Добро пожаловать, {user.full_name}!
          </h2>
          <p className="text-quick-silver">
            Здесь вы можете управлять боями, выдавать достижения и создавать челленджи
          </p>
        </Card>

        {/* Табы */}
        <div className="mb-6">
          <Tabs
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
        </div>

        {/* Контент */}
        {renderContent()}
      </div>
    </div>
  )
}
