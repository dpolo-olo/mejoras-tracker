/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Sora', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      colors: {
        cream: {
          50:  '#FEFCF8',
          100: '#F5F0E8',
          200: '#EDE7D8',
          300: '#E0D8C6',
          400: '#C8BEA8',
          500: '#A89880',
        },
        navy: {
          900: '#1A1A2E',
          800: '#252540',
          700: '#333358',
          600: '#44446B',
          500: '#6666AA',
        },
        coral: {
          500: '#FF6B35',
          600: '#E85A24',
        },
      },
    },
  },
  plugins: [],
}
