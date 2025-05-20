/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./webview/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      keyframes: {
        spinner: {
          '0%': {
            opacity: '1',
          },
          '100%': {
            opacity: '0',
          },
        },
      },
      animation: {
        spinner: 'spinner 1.2s linear infinite',
      },
    },
  },
  plugins: [],
};
