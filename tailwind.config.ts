import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: {
          0: 'rgb(var(--surface-0) / <alpha-value>)',
          1: 'rgb(var(--surface-1) / <alpha-value>)',
          2: 'rgb(var(--surface-2) / <alpha-value>)',
          3: 'rgb(var(--surface-3) / <alpha-value>)',
          4: 'rgb(var(--surface-4) / <alpha-value>)',
        },
        text: {
          primary: 'rgb(var(--text-primary) / <alpha-value>)',
          secondary: 'rgb(var(--text-secondary) / <alpha-value>)',
          tertiary: 'rgb(var(--text-tertiary) / <alpha-value>)',
          onAccent: 'rgb(var(--text-on-accent) / <alpha-value>)',
        },
        accent: {
          DEFAULT: 'rgb(var(--accent-500) / <alpha-value>)',
          400: 'rgb(var(--accent-400) / <alpha-value>)',
          500: 'rgb(var(--accent-500) / <alpha-value>)',
          600: 'rgb(var(--accent-600) / <alpha-value>)',
        },
        hot: {
          DEFAULT: 'rgb(var(--hot-500) / <alpha-value>)',
        },
      },
      fontFamily: {
        display: ['Sora', 'system-ui', 'sans-serif'],
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      spacing: {
        'player-bar': '5.5rem',
        sidebar: '16rem',
        'sidebar-collapsed': '4.5rem',
      },
      borderRadius: {
        xs: '4px',
        sm: '8px',
        md: '12px',
        lg: '16px',
        xl: '24px',
      },
      boxShadow: {
        '1': '0 2px 8px rgb(0 0 0 / 0.3)',
        '2': '0 8px 24px rgb(0 0 0 / 0.4)',
        '3': '0 16px 48px rgb(0 0 0 / 0.5)',
        'glow-sm': '0 0 12px rgb(var(--accent-glow) / 0.35)',
        'glow-md': '0 0 24px rgb(var(--accent-glow) / 0.5)',
        'glow-lg': '0 0 48px rgb(var(--accent-glow) / 0.6)',
      },
      transitionTimingFunction: {
        'out-quart': 'cubic-bezier(0.25, 1, 0.5, 1)',
        'out-expo': 'cubic-bezier(0.19, 1, 0.22, 1)',
        spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { opacity: '0.5' },
          '50%': { opacity: '0.85' },
        },
        marquee: {
          '0%, 8%': { transform: 'translateX(0)' },
          '92%, 100%': { transform: 'translateX(calc(-100% + var(--marquee-viewport, 0px)))' },
        },
        'spin-slow': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      animation: {
        'pulse-glow': 'pulse-glow 4s ease-in-out infinite',
        marquee: 'marquee 14s ease-in-out infinite',
        'spin-slow': 'spin-slow 20s linear infinite',
        'fade-in': 'fade-in 0.2s ease-out',
      },
    },
  },
  plugins: [],
} satisfies Config;
