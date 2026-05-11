import type { Config } from "tailwindcss";
const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        "makati-blue": "#003DA5",
        "makati-gold": "#FFB81C",
      },
    },
  },
  plugins: [],
};
export default config;
