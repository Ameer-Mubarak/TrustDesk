/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Aptos"', '"Segoe UI"', 'sans-serif']
      },
      colors: {
        ink: '#13201b',
        paper: '#f7f4ed',
        moss: '#52685a',
        copper: '#b7663b',
        signal: '#0e7c66'
      }
    }
  },
  plugins: []
};
