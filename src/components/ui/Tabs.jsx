// Компонент табов для переключения между разделами (Soft Neobrutalism)
// Following vercel-react-best-practices: rerender-functional-setstate
export default function Tabs({ tabs, activeTab, onTabChange, className = '' }) {
  return (
    <div className={`inline-flex gap-2 ${className}`}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id

        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`
              px-4 py-2 font-bold rounded-lg transition-all border-2 border-strict-black
              ${isActive
                ? 'bg-accent-orange text-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]'
                : 'bg-white text-strict-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]'
              }
            `}
          >
            <span className="flex items-center gap-2 text-sm">
              {tab.label}
              {tab.count !== undefined && (
                <span className={`
                  text-xs px-2 py-0.5 rounded border-2 border-strict-black font-bold
                  ${isActive ? 'bg-white text-accent-orange' : 'bg-strict-black text-white'}
                `}>
                  {tab.count}
                </span>
              )}
            </span>
          </button>
        )
      })}
    </div>
  )
}
