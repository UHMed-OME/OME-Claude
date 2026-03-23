import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          900: '#0a0e1a',
          800: '#0f1629',
          700: '#151d38',
          600: '#1e2a4a',
        },
        accent: {
          500: '#22c55e',
          400: '#4ade80',
          600: '#16a34a',
        },
      },
    },
  },
} satisfies Config
