/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'rgb(var(--color-bg) / <alpha-value>)',
        surface: {
          DEFAULT: 'rgb(var(--color-surface) / <alpha-value>)',
          raised: 'rgb(var(--color-surface-raised) / <alpha-value>)',
          border: 'rgb(var(--color-surface-border) / <alpha-value>)'
        },
        text: {
          primary: 'rgb(var(--color-text-primary) / <alpha-value>)',
          secondary: 'rgb(var(--color-text-secondary) / <alpha-value>)',
          muted: 'rgb(var(--color-text-muted) / <alpha-value>)'
        },
        accent: {
          DEFAULT: '#6366F1',
          dark: '#4338CA',
          light: '#A5B4FC',
          cyan: '#22D3EE',
          violet: '#A855F7'
        },
        ok: {
          DEFAULT: '#34D399',
          text: 'rgb(var(--color-ok-text) / <alpha-value>)'
        },
        warn: {
          DEFAULT: '#FBBF24',
          text: 'rgb(var(--color-warn-text) / <alpha-value>)'
        },
        danger: {
          DEFAULT: '#F87171',
          text: 'rgb(var(--color-danger-text) / <alpha-value>)'
        }
      },
      fontFamily: {
        sans: ['Inter', 'Segoe UI', 'system-ui', 'sans-serif']
      },
      boxShadow: {
        card: '0 8px 30px rgba(0,0,0,0.25), 0 0 0 1px rgba(255,255,255,0.04)',
        glow: '0 0 40px rgba(99,102,241,0.35)'
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(115deg, #22D3EE 0%, #6366F1 55%, #A855F7 100%)'
      }
    }
  },
  plugins: []
}
