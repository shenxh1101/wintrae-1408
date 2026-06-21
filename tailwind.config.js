/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        primary: {
          50: "#FFF5F0",
          100: "#FFE8DB",
          200: "#FFD0B8",
          300: "#FFB085",
          400: "#FF8A50",
          500: "#FF7A45",
          600: "#F06230",
          700: "#D44D20",
          800: "#A83C18",
          900: "#7A2B10",
        },
        secondary: {
          50: "#F0F7F7",
          100: "#DBECEC",
          200: "#B5D8D8",
          300: "#7FB5B5",
          400: "#4A8A8A",
          500: "#2D6A6A",
          600: "#255656",
          700: "#1E4545",
          800: "#173434",
          900: "#0F2222",
        },
        warm: {
          50: "#FAF8F5",
          100: "#F5F1EA",
          200: "#EBE4D8",
          300: "#DCD1BD",
          400: "#C7B79B",
          500: "#B09A78",
          600: "#8C7A5E",
          700: "#6B5D48",
          800: "#4A4032",
          900: "#2D271E",
        },
        success: {
          50: "#ECFDF5",
          500: "#10B981",
          600: "#059669",
        },
        warning: {
          50: "#FFFBEB",
          500: "#F59E0B",
          600: "#D97706",
        },
        danger: {
          50: "#FEF2F2",
          500: "#EF4444",
          600: "#DC2626",
        },
      },
      fontFamily: {
        sans: ['"Noto Sans SC"', "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 2px 8px rgba(0, 0, 0, 0.06)",
        "card-hover": "0 8px 24px rgba(0, 0, 0, 0.1)",
        "card-lg": "0 4px 16px rgba(0, 0, 0, 0.08)",
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-out",
        "slide-up": "slideUp 0.3s ease-out",
        "slide-right": "slideRight 0.3s ease-out",
        "pulse-soft": "pulseSoft 2s ease-in-out infinite",
        "bounce-subtle": "bounceSubtle 0.6s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideRight: {
          "0%": { opacity: "0", transform: "translateX(-20px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        pulseSoft: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.7" },
        },
        bounceSubtle: {
          "0%": { transform: "scale(0.95)" },
          "50%": { transform: "scale(1.02)" },
          "100%": { transform: "scale(1)" },
        },
      },
    },
  },
  plugins: [],
};
