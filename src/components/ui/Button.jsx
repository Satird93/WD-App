// Базовая кнопка с поддержкой вариантов (Soft Neobrutalism)
// Following vercel-react-best-practices: rendering-hoist-jsx
export default function Button({
  children,
  variant = 'primary',
  onClick,
  disabled = false,
  className = '',
  type = 'button',
}) {
  const baseStyles = 'px-5 py-2.5 font-bold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed border-2 border-strict-black'

  const variants = {
    primary: 'bg-accent-orange text-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] active:translate-x-1 active:translate-y-1 active:shadow-none',
    secondary: 'bg-brandeis-blue text-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] active:translate-x-1 active:translate-y-1 active:shadow-none',
    outline: 'bg-white text-strict-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] active:translate-x-1 active:translate-y-1 active:shadow-none',
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  )
}
