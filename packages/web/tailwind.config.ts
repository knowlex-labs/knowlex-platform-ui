import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'ledger-black': 'var(--ledger-black)',
        'ledger-white': 'var(--ledger-white)',
        'ledger-gray': {
          50: 'var(--ledger-gray-50)',
          100: 'var(--ledger-gray-100)',
          200: 'var(--ledger-gray-200)',
          300: 'var(--ledger-gray-300)',
          400: 'var(--ledger-gray-400)',
          500: 'var(--ledger-gray-500)',
          600: 'var(--ledger-gray-600)',
          700: 'var(--ledger-gray-700)',
          800: 'var(--ledger-gray-800)',
          900: 'var(--ledger-gray-900)',
          950: 'var(--ledger-gray-950)',
        },
        'kx-primary': {
          50: 'var(--kx-primary-50)',
          100: 'var(--kx-primary-100)',
          200: 'var(--kx-primary-200)',
          300: 'var(--kx-primary-300)',
          400: 'var(--kx-primary-400)',
          500: 'var(--kx-primary-500)',
          600: 'var(--kx-primary-600)',
          700: 'var(--kx-primary-700)',
          800: 'var(--kx-primary-800)',
          900: 'var(--kx-primary-900)',
          950: 'var(--kx-primary-950)',
        },
        'kx-card': 'var(--kx-card-bg)',
        'kx-card-border': 'var(--kx-card-border)',
        'kx-surface': 'var(--kx-surface)',
        'kx-accent': {
          400: 'var(--kx-accent-400)',
          500: 'var(--kx-accent-500)',
          600: 'var(--kx-accent-600)',
        },
        'kx-text': {
          primary: 'var(--kx-text-primary)',
          secondary: 'var(--kx-text-secondary)',
        },
        'nb-panel': 'var(--nb-panel-bg)',
        'nb-panel-border': 'var(--nb-panel-border)',
        'nb-separator': 'var(--nb-separator-bg)',
        'nb-sidebar': 'var(--nb-sidebar-bg)',
        'nb-sidebar-hover': 'var(--nb-sidebar-hover)',
        'nb-input': 'var(--nb-input-bg)',
        'nb-input-border': 'var(--nb-input-border)',
        'nb-text-muted': 'var(--nb-text-muted)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['"Times New Roman"', 'Times', 'serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        DEFAULT: '8px',
        none: '0px',
        sm: '4px',
        md: '8px',
        lg: '12px',
        xl: '16px',
        '2xl': '20px',
        full: '9999px',
      },
      boxShadow: {
        DEFAULT: '0 1px 3px var(--shadow-sm)',
        sm: '0 1px 2px var(--shadow-xs)',
        md: '0 4px 12px var(--shadow-md)',
        lg: '0 8px 24px var(--shadow-lg)',
        xl: '0 16px 48px var(--shadow-xl)',
        'glow': '0 0 20px var(--shadow-glow)',
      },
      animation: {
        'fade-in-up': 'fade-in-up 0.6s ease-out forwards',
        'fade-in': 'fade-in 0.6s ease-out forwards',
        'gradient-shift': 'gradient-shift 8s ease infinite',
        'float': 'float 6s ease-in-out infinite',
        'blink': 'blink 1s step-end infinite',
        'bounce-in': 'bounce-in 0.5s ease-out forwards',
        'marquee': 'marquee 45s linear infinite',
        'marquee-reverse': 'marquee-reverse 55s linear infinite',
        'shimmer': 'shimmer 1.5s ease-in-out infinite',
      },
      keyframes: {
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'gradient-shift': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        'blink': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
        'bounce-in': {
          '0%': { opacity: '0', transform: 'translateY(16px) scale(0.97)' },
          '60%': { opacity: '1', transform: 'translateY(-4px) scale(1.01)' },
          '80%': { transform: 'translateY(2px) scale(0.995)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        'marquee': {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        'marquee-reverse': {
          '0%': { transform: 'translateX(-50%)' },
          '100%': { transform: 'translateX(0)' },
        },
        'shimmer': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(200%)' },
        },
      },
    },
  },
  plugins: [],
}

export default config
