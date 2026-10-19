/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        wittur: {
          teal: {
            50: '#edfbfb',
            100: '#d1f4f5',
            200: '#a7eaed',
            300: '#6ed9de',
            400: '#2ec0c7',
            500: '#009ba4',
            600: '#007e86',
            700: '#06646b',
            800: '#0c5157',
            900: '#0e4449',
            DEFAULT: '#009ba4',
          },
          gray: {
            50: '#f8fafc',
            100: '#f1f5f9',
            200: '#e2e8f0',
            300: '#cbd5e1',
            400: '#94a3b8',
            500: '#808084',
            600: '#5b6065',
            700: '#43484d',
            800: '#282d32',
            900: '#181c20',
            950: '#0f1215',
            DEFAULT: '#808084',
          }
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'sans-serif'],
      }
    },
  },
  plugins: [],
}