/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['Inter', 'Geist Sans', 'system-ui', 'sans-serif'] },
      colors: {
        navy: { DEFAULT: '#14243A', dark: '#1C304A' },
        canvas: '#F6F8FB',
        line: '#E5EAF0',
        accent: { DEFAULT: '#3978C5', soft: '#EAF1FA' },
        critical: '#DC4545',
        high: '#E58A35',
        medium: '#D6AE43',
        low: '#429B75',
        neutral: '#718096',
      },
      borderRadius: { card: '12px' },
      boxShadow: { soft: '0 1px 2px rgba(20,36,58,.04), 0 2px 8px rgba(20,36,58,.04)' },
    },
  },
  plugins: [],
};
