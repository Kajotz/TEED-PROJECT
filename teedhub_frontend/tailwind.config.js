/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // 1. Core Logic for Moving/Interchanging Colors
      animation: {
        'mesh-slow': 'mesh 25s ease-in-out infinite',
        'mesh-medium': 'mesh 18s ease-in-out infinite reverse',
        'mesh-fast': 'mesh 12s ease-in-out infinite',
        'blob': "blob 10s infinite",
      },
      keyframes: {
        mesh: {
          '0%, 100%': { 
            transform: 'translate(0, 0) scale(1) rotate(0deg)',
          },
          '33%': { 
            transform: 'translate(10%, -15%) scale(1.3) rotate(8deg)',
          },
          '66%': { 
            transform: 'translate(-10%, 10%) scale(0.7) rotate(-8deg)',
          },
        },
        blob: {
          "0%": {
            transform: "translate(0px, 0px) scale(1)",
          },
          "33%": {
            transform: "translate(50px, -70px) scale(1.2)",
          },
          "66%": {
            transform: "translate(-40px, 40px) scale(0.8)",
          },
          "100%": {
            transform: "translate(0px, 0px) scale(1)",
          },
        },
      },

      // 2. Your Existing Semantic Color Tokens
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      
      // 3. Your Existing Layout Tokens
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },

      // 4. Utility for Extra Smooth Blurs
      blur: {
        '3xl': '64px',
        '4xl': '100px',
        '5xl': '150px',
      },
    },
  },
  plugins: [],
};