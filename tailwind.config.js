/** @type {import('tailwindcss').Config} */
const config = {
  // CRÍTICO para el modo oscuro con la clase .dark en el <body> o <html>
  darkMode: ["class"], 
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      // Define el color de borde por defecto para la clase 'border' sin sufijo
      borderColor: {
        DEFAULT: "var(--border)",
      },
      // Define tus colores personalizados
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        destructive: {
          DEFAULT: "var(--destructive)",
          foreground: "var(--destructive-foreground)",
        },
        // Estas entradas generan clases como border-border, bg-border, etc.
        border: "var(--border)", 
        input: "var(--input)",
        ring: "var(--ring)",
      },
    },
  },
  plugins: [],
};

module.exports = config;
