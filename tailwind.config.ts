import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        nuw: {
          canvas: '#FFFFFF',
          sidebar: '#FFFFFF',
          line: '#F3E6DC',
          soft: '#FFF4EC',
          primary: '#E85D0C',
          deep: '#1A1A1A',
          button: '#E85D0C',
          buttonHover: '#C44708',
          violet: '#E85D0C',
          amber: '#FFE4CC',
          olive: '#6F6A66',
          ink: '#1A1A1A',
        },
        sky: {
          400: '#F0A06A',
          500: '#E85D0C',
          600: '#C44708',
        },
        blue: {
          50: '#FFF6F0',
          100: '#FFE4CC',
          500: '#E85D0C',
          600: '#C44708',
          700: '#9A3412',
        },
        orange: {
          50: '#FFF6F0',
          100: '#FFE4CC',
          200: '#FFD0B0',
          400: '#F08A3A',
          500: '#E85D0C',
          600: '#C44708',
          700: '#9A3412',
        },
        zinc: {
          50: '#FFFFFF',
          100: '#FFF8F4',
          200: '#F3E6DC',
          300: '#E4D5C8',
          400: '#8A8178',
          500: '#6F6A66',
          600: '#3F3A36',
          700: '#1A1A1A',
          800: '#1A1A1A',
          900: '#1A1A1A',
          950: '#1A1A1A',
        },
      },
      boxShadow: {
        card: '0 1px 2px rgba(23, 21, 18, 0.05), 0 12px 28px rgba(23, 21, 18, 0.06)',
        menu: '0 12px 32px rgba(23, 21, 18, 0.14)',
      },
    },
  },
  plugins: [],
}

export default config
