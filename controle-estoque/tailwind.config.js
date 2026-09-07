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
        brand: {
          from: '#5B35E8',
          to: '#461CDC'
        },
        accent: {
          DEFAULT: '#461CDC',
          dark: '#3517AD',
          light: '#7C5CF0'
        },
        ok: {
          DEFAULT: '#6BFF50',
          text: 'rgb(var(--color-ok-text) / <alpha-value>)'
        },
        warn: {
          DEFAULT: '#F59E0B',
          text: 'rgb(var(--color-warn-text) / <alpha-value>)'
        },
        danger: {
          DEFAULT: '#EF4444',
          text: 'rgb(var(--color-danger-text) / <alpha-value>)'
        }
      },
      fontFamily: {
        sans: ['Inter', 'Segoe UI', 'system-ui', 'sans-serif']
      },
      boxShadow: {
        card: '0 1px 2px rgba(20,21,26,0.06), 0 0 0 1px rgba(20,21,26,0.04)'
      }
    }
  },
  plugins: []
}
