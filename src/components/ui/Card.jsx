// Карточка для группировки контента (Soft Neobrutalism)
// Following vercel-react-best-practices: rendering-hoist-jsx
export default function Card({ children, className = '', onClick }) {
  const baseStyles = 'bg-white border-2 border-strict-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-4 rounded-lg'

  const Component = onClick ? 'button' : 'div'
  const interactiveStyles = onClick ? 'cursor-pointer hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all duration-150' : ''

  return (
    <Component
      onClick={onClick}
      className={`${baseStyles} ${interactiveStyles} ${className}`}
    >
      {children}
    </Component>
  )
}
