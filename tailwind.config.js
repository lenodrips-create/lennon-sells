/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        nave: '#0B0709',
        crypt: '#150D10',
        gold: '#D4AF62',
        'gold-deep': '#9C7A35',
        marble: '#EFE7DA',
        rose: '#8E1B2E',
        'rose-bright': '#C2334B',
        lapis: '#1D2A5E',
      },
      fontFamily: {
        gothic: ['UnifrakturCook', 'Cinzel', 'serif'],
        roman: ['Cinzel', 'Times New Roman', 'serif'],
        body: ['Cormorant Garamond', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
};
