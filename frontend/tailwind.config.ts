import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        primary: {
          DEFAULT: '#7C3AED',
          foreground: '#FAF5FF',
        },
        secondary: {
          DEFAULT: '#A78BFA',
          foreground: '#4C1D95',
        },
        accent: {
          DEFAULT: '#F97316',
          foreground: '#FAF5FF',
        },
        muted: {
          DEFAULT: '#1E293B',
          foreground: '#94A3B8',
        }
      },
      fontFamily: {
        sans: ['var(--font-fira-sans)', 'sans-serif'],
        mono: ['var(--font-fira-code)', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'slide-in': 'slideIn 0.3s ease-out',
      },
      keyframes: {
        slideIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        }
      }
    },
  },
  plugins: [],
}
export default config
