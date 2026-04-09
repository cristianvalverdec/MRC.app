/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['Barlow Condensed', 'sans-serif'],
        body: ['Barlow', 'sans-serif'],
      },
      colors: {
        navy: {
          DEFAULT: '#1B2A4A',
          mid: '#243357',
          light: '#2E3F6E',
        },
        brand: {
          orange: '#F57C20',
          'orange-dark': '#D4640F',
          blue: '#1A52B8',
          'blue-dark': '#153FA0',
        },
      },
      borderRadius: {
        card: '12px',
        btn: '8px',
        pill: '999px',
      },
      animation: {
        float: 'float 4s ease-in-out infinite',
        shimmer: 'shimmer 2.5s linear infinite',
        grain: 'grain 0.5s steps(1) infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-400px 0' },
          '100%': { backgroundPosition: '400px 0' },
        },
        grain: {
          '0%, 100%': { transform: 'translate(0, 0)' },
          '10%': { transform: 'translate(-2%, -3%)' },
          '20%': { transform: 'translate(3%, 1%)' },
          '30%': { transform: 'translate(-1%, 4%)' },
          '40%': { transform: 'translate(2%, -2%)' },
          '50%': { transform: 'translate(-3%, 2%)' },
          '60%': { transform: 'translate(1%, -4%)' },
          '70%': { transform: 'translate(-2%, 3%)' },
          '80%': { transform: 'translate(3%, -1%)' },
          '90%': { transform: 'translate(-1%, 2%)' },
        },
      },
    },
  },
  plugins: [],
}
