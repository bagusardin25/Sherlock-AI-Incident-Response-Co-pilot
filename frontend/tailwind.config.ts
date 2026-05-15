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
          DEFAULT: '#3B82F6',
          foreground: '#FAF5FF',
        },
        accent: {
          DEFAULT: '#F97316',
          foreground: '#FAF5FF',
        },
        success: {
          DEFAULT: '#22C55E',
          foreground: '#F0FDF4',
        },
        muted: {
          DEFAULT: '#1E293B',
          foreground: '#94A3B8',
        }
      },
      fontFamily: {
        sans: ['var(--font-poppins)', 'sans-serif'],
        mono: ['var(--font-fira-code)', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'slide-in': 'slideIn 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'scan': 'scan 3s linear infinite',
      },
      keyframes: {
        slideIn: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(124, 58, 237, 0.2)' },
          '100%': { boxShadow: '0 0 20px rgba(124, 58, 237, 0.6)' },
        },
        scan: {
          '0%': { transform: 'translateY(0)' },
          '100%': { transform: 'translateY(160px)' },
        }
      }
    },
  },
  plugins: [],
}
export default config
