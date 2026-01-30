/**
 * Компонент шапки с навигацией (Soft Neobrutalism)
 */
export default function Header({ title, onBack, showBack = true }) {
  return (
    <div className="sticky top-0 z-10 bg-accent-orange border-b-2 border-strict-black">
      <div className="flex items-center h-16 px-4">
        {showBack && (
          <button
            onClick={onBack}
            className="mr-3 p-2 rounded bg-white border-2 border-strict-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all"
            aria-label="Назад"
          >
            <svg
              className="w-5 h-5 text-strict-black"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
        )}
        <h1 className="text-xl font-bold text-white">{title}</h1>
      </div>
    </div>
  )
}
