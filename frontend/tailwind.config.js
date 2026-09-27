/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        adventure: {
          blue: '#38BDF8',
          yellow: '#FBBF24',
          coral: '#FB7185',
          green: '#4ADE80',
          purple: '#C084FC',
          orange: '#FB923C',
          cream: '#FFFBEB',
        }
      },
      fontFamily: {
        bubble: ['"Fredoka"', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        bounceSubtle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        wiggle: {
          '0%, 100%': { transform: 'rotate(-3deg)' },
          '50%': { transform: 'rotate(3deg)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 15px rgba(251, 191, 36, 0.7)' },
          '50%': { boxShadow: '0 0 35px rgba(251, 191, 36, 1)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        }
      },
      animation: {
        'bounce-subtle': 'bounceSubtle 2s infinite ease-in-out',
        'wiggle': 'wiggle 1s infinite ease-in-out',
        'pulse-glow': 'pulseGlow 2s infinite ease-in-out',
        'float': 'float 3s infinite ease-in-out',
      }
    },
  },
  plugins: [],
}
