/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#040d1a',
          900: '#0a1628',
          800: '#0f2040',
          700: '#172d58',
          600: '#1e3a70',
        },
        gold: {
          DEFAULT: '#c9a84c',
          light: '#e8c96a',
          muted: '#8a6f2e',
        },
      },
      fontFamily: {
        sans: ['var(--font-noto)', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
