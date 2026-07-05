/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './games/**/*.{ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        bg: '#0b0620',
        panel: '#150c30',
        purple: '#7c3aed',
        pink: '#ec4899',
        blue: '#3b82f6'
      },
      backgroundImage: {
        'app-gradient': 'radial-gradient(circle at 20% 20%, #2d1b69 0%, #0b0620 50%), radial-gradient(circle at 80% 80%, #4c1d95 0%, transparent 50%)'
      }
    }
  },
  plugins: []
};
