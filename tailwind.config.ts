import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./features/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: { ink: "#0F172A", gold: "#C8A96B", canvas: "#FAFAFA" },
      fontFamily: { sans: ["var(--font-inter)"], display: ["var(--font-playfair)"] },
      boxShadow: { card: "0 12px 40px rgba(15,23,42,.055)" },
      backgroundImage: { "navy-glow": "radial-gradient(circle at 50% 0%, #17223a 0%, #06101f 52%, #020817 100%)" }
    }
  },
  plugins: []
} satisfies Config;
