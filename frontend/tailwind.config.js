/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],

  theme: {
    extend: {
      colors: {
        rose: {
          50: '#fdf6f0',
          100: '#fae8e0',
          200: '#f4cfc1',
          300: '#e8a598',
          400: '#d4847b',
          500: '#c9808a',
          600: '#b56871',
          700: '#9a4f5a',
        },

        peach: {
          100: '#fbe5d6',
          200: '#f8c9a9',
          300: '#f2c4a0',
          400: '#e8a87c',
        },

        cream: {
          50: '#fffaf5',
          100: '#fdf6f0',
          200: '#f7eee5',
        },

        warm: {
          50: '#5a3e36',
          100: '#7a5a52',
        },
      },

      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Playfair Display', 'Georgia', 'serif'],
      },

      animation: {
        'fade-in': 'fadeIn 0.4s ease-out both',
        'slide-up': 'slideUp 0.5s ease-out both',
        'slide-down': 'slideDown 0.4s ease-out both',
        'scale-in': 'scaleIn 0.3s ease-out both',
        float: 'float 4s ease-in-out infinite',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
      },

      keyframes: {
        fadeIn: {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 },
        },

        slideUp: {
          '0%': {
            opacity: 0,
            transform: 'translateY(24px)',
          },
          '100%': {
            opacity: 1,
            transform: 'translateY(0)',
          },
        },

        slideDown: {
          '0%': {
            opacity: 0,
            transform: 'translateY(-16px)',
          },
          '100%': {
            opacity: 1,
            transform: 'translateY(0)',
          },
        },

        scaleIn: {
          '0%': {
            opacity: 0,
            transform: 'scale(0.95)',
          },
          '100%': {
            opacity: 1,
            transform: 'scale(1)',
          },
        },

        float: {
          '0%, 100%': {
            transform: 'translateY(0)',
          },
          '50%': {
            transform: 'translateY(-12px)',
          },
        },

        pulseGlow: {
          '0%, 100%': {
            boxShadow: '0 0 0 0 rgba(201, 128, 138, 0.4)',
          },
          '50%': {
            boxShadow: '0 0 0 12px rgba(201, 128, 138, 0)',
          },
        },
      },
    },
  },

  plugins: [],
}