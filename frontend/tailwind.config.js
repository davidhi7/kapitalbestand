/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        branding: {
          '0': '#155799',
          '1': '#159957',
          '0-dark': '#1F7FDF',
          '1-dark': '#1FDF7F'
        },
        'main': '#444',
        'secondary': '#888',
        'tertiary': '#666',
        'main-dark': '#DDD',
        'secondary-dark': '#AAA',
        'tertiary-dark': '#CCC',
        'main-bg': '#FFF',
        'main-bg-dark': 'hsl(0, 0%, 10%)',
        'header-bg': 'hsl(0, 0%, 10%)',
        'header-bg-dark': 'hsl(0, 0%, 5%)',
      }
    }
  },
  plugins: [],
}
