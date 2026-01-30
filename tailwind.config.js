/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        'strict-black': '#222222',
        'quick-silver': '#A3A3A3',
        'accent-orange': '#EE5A24',
        'alabaster': '#EFE5DC',
        'brandeis-blue': '#0066FF',
        'alice-blue': '#F0F8FF',
        'orange-peel': '#FF9F00',
      },
      fontFamily: {
        sans: ['Poppins', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 2px 8px rgba(0, 0, 0, 0.1)',
      },
    },
  },
  // Safelist ensures dynamic classes work
  safelist: [
    'bg-accent-orange',
    'bg-brandeis-blue',
    'bg-green-500',
    'bg-red-500',
    'bg-yellow-500',
  ],
  plugins: [],
}
