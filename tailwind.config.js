/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./src/**/*.{html,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif']
      },
      colors: {
        bg: {
          primary: '#0f0f13',
          secondary: '#1a1a24',
          card: '#22223a',
          hover: '#2d2d45'
        },
        accent: {
          DEFAULT: '#6366f1',
          hover: '#4f46e5'
        },
        text: {
          primary: '#f0f0f5',
          secondary: '#9999bb',
          muted: '#666680'
        },
        border: {
          DEFAULT: '#333355'
        },
        success: '#22c55e',
        category: {
          personal: '#6366f1',
          financial: '#10b981',
          business: '#f59e0b',
          documents: '#ef4444',
          custom: '#8b5cf6'
        }
      },
      keyframes: {
        'slide-fade-in': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        'flash-success': {
          '0%': { backgroundColor: 'rgba(34, 197, 94, 0.25)' },
          '100%': { backgroundColor: 'transparent' }
        }
      },
      animation: {
        'slide-fade-in': 'slide-fade-in 150ms ease-out',
        'flash-success': 'flash-success 1.5s ease-out'
      }
    }
  },
  plugins: []
};
