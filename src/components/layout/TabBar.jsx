import { useState } from 'react'

/**
 * Нижняя навигация приложения
 * Following vercel-react-best-practices: rendering-hoist-jsx
 */

// Hoisted static data
const TABS = [
  { id: 'home', label: 'Главная', icon: '🏠' },
  { id: 'challenges', label: 'Челленджи', icon: '💪' },
  { id: 'leaderboard', label: 'Бои', icon: '⚔️' },
  { id: 'profile', label: 'Профиль', icon: '👤' },
]

export default function TabBar({ activeTab, onTabChange }) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
      <div className="flex justify-around items-center h-16 max-w-2xl mx-auto">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`
                flex flex-col items-center justify-center flex-1 h-full
                transition-colors
                ${isActive ? 'text-accent-orange' : 'text-quick-silver'}
                hover:bg-gray-50 active:bg-gray-100
              `}
            >
              <span className="text-2xl mb-1">{tab.icon}</span>
              <span className="text-xs font-medium">{tab.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
