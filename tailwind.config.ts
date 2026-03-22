import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        accent:   '#1B4332',
        accent2:  '#2D6A4F',
        accent3:  '#40916C',
        bg:       '#F4F3EF',
        surface:  '#FFFFFF',
        surface2: '#F9F8F5',
        border:   '#E2E0D8',
        text:     '#1A1916',
        text2:    '#6B6960',
        text3:    '#9C9A92',
        danger:   '#9B2226',
        warning:  '#7D4E00',
        info:     '#1B3A5C',
      },
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
        mono: ['DM Mono', 'monospace'],
      },
      fontSize: {
        '10': ['10px', { lineHeight: '14px' }],
        '11': ['11px', { lineHeight: '16px' }],
        '12': ['12px', { lineHeight: '16px' }],
        '13': ['13px', { lineHeight: '20px' }],
      },
    },
  },
  plugins: [],
}

export default config
