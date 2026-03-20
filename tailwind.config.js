/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        calidad: '#c0392b',
        produccion: '#1a6fb5',
        almacen: '#d97706',
        mantenimiento: '#16a34a',
      }
    },
  },
  plugins: [],
}