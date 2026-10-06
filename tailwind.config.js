/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0F0A07',
        umber: '#1B130D',
        gold: '#D2AE62',
        'gold-deep': '#9A7633',
        marble: '#EEE7DB',
        imperial: '#9E2B1F',
        'imperial-bright': '#C9402C',
        ochre: '#B98A4E',
        sky: '#8FB3D1',
      },
      fontFamily: {
        display: ['Cinzel', 'Times New Roman', 'serif'],
        body: ['Cormorant Garamond', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
};
