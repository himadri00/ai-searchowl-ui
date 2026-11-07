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
          canvas: '#F7F5F1',
          sidebar: '#F7F5F1',
          line: '#DEDAD3',
          soft: '#F0EDE8',
          primary: '#F05A0A',
          deep: '#171411',
          button: '#171411',
          buttonHover: '#F05A0A',
          violet: '#F05A0A',
          amber: '#F3E5D8',
          olive: '#68625C',
          ink: '#171411',
        },
        sky: {
          400: '#F58A50',
          500: '#F05A0A',
          600: '#C84908',
        },
        blue: {
          50: '#F7F5F1',
          100: '#F0EDE8',
          500: '#F05A0A',
          600: '#C84908',
          700: '#9E3907',
        },
        orange: {
          50: '#FFF8F2',
          100: '#F3E5D8',
          200: '#EBCBB2',
          400: '#F58A50',
          500: '#F05A0A',
          600: '#C84908',
          700: '#9E3907',
        },
        zinc: {
          50: '#FAF9F7',
          100: '#F0EDE8',
          200: '#DEDAD3',
          300: '#C8C2BA',
          400: '#8A857F',
          500: '#68625C',
          600: '#4C4742',
          700: '#302C29',
          800: '#221F1C',
          900: '#171411',
          950: '#100E0C',
        },
      },
      boxShadow: {
        card: '0 1px 2px rgba(23, 20, 17, 0.05), 0 14px 34px rgba(23, 20, 17, 0.06)',
        menu: '0 18px 44px rgba(23, 20, 17, 0.15)',
      },
    },
  },
  plugins: [],
}

export default config
