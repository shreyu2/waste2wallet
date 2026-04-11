/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Outfit', 'sans-serif'],
      },
      colors: {
        sustainability: {
          900: '#064e3b',
          800: '#065f46',
          700: '#047857',
        }
      }
    },
  },
  plugins: [],
}
