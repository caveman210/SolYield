const { theme } = require('./app/theme/theme');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: theme.colors,
      spacing: theme.spacing,
      borderRadius: theme.borderRadius,
    },
    fontSize: theme.typography.fontSize,
    fontWeight: theme.typography.fontWeight,
    fontFamily: {
      sans: [theme.typography.fontFamily],
    },
  },
  plugins: [],
};

