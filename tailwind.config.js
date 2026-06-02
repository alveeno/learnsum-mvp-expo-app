/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#2D6A4F",
        accent: "#F4A923",
        background: "#FFFFFF",
        surface: "#F9F9F7",
        muted: "#6B7280",
        destructive: "#E63946",
      },
    },
  },
  plugins: [],
}
