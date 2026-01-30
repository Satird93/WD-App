import { useState } from 'react'
import { useLeaderboard } from '../../hooks/useLeaderboard'
import Tabs from '../ui/Tabs'
import HomeLeaderboard from './HomeLeaderboard'
import FightsLeaderboard from './FightsLeaderboard'
import Header from '../layout/Header'

/**
 * Главный экран рейтингов
 */
export default function Leaderboard({ user }) {
  const [activeTab, setActiveTab] = useState('home')
  
  const {
    leaderboard: homeLeaderboard,
    loading: homeLoading,
    error: homeError,
  } = useLeaderboard('home', 50)

  const {
    leaderboard: fightsLeaderboard,
    loading: fightsLoading,
    error: fightsError,
  } = useLeaderboard('fights', 50)

  const tabs = [
    { id: 'home', label: 'Домашние тренировки', icon: '🏠' },
    { id: 'fights', label: 'Бои', icon: '⚔️' },
  ]

  return (
    <div className="min-h-screen bg-alabaster pb-24">
      <Header title="Рейтинги" emoji="🏆" />
      
      <div className="p-4">
        {/* Табы */}
        <div className="mb-6">
          <Tabs
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
        </div>

        {/* Контент */}
        {activeTab === 'home' ? (
          <HomeLeaderboard
            leaderboard={homeLeaderboard}
            loading={homeLoading}
            error={homeError}
            currentUserId={user?.id}
          />
        ) : (
          <FightsLeaderboard
            leaderboard={fightsLeaderboard}
            loading={fightsLoading}
            error={fightsError}
            currentUserId={user?.id}
          />
        )}
      </div>
    </div>
  )
}
