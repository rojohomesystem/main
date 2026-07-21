/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Amarillo de la marca Rojo Home Improvement
        marca: {
          DEFAULT: '#F5B301',
          claro: '#FFD34E',
          oscuro: '#C98A00',
        },
        tinta: {
          DEFAULT: '#1C1B1A',
          suave: '#3A3836',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Archivo', 'Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
