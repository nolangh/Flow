/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./screens/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Design system colors
        neon: {
          green: "#00FF00",
          "green-dim": "#00CC00",
          "green-glow": "rgba(0, 255, 0, 0.15)",
          "green-border": "rgba(0, 255, 0, 0.3)",
        },
        danger: {
          pink: "#FF4D6D",
          "pink-dim": "#CC3D57",
          "pink-glow": "rgba(255, 77, 109, 0.15)",
          "pink-border": "rgba(255, 77, 109, 0.3)",
        },
        surface: {
          DEFAULT: "#0D0D0D",
          raised: "#141414",
          overlay: "#1A1A1A",
        },
        border: {
          subtle: "#1F2937",
          dim: "#111827",
        },
      },
      fontFamily: {
        sans: ["System"],
        mono: ["Courier"],
      },
      boxShadow: {
        "neon-green": "0 0 20px rgba(0, 255, 0, 0.4)",
        "neon-pink": "0 0 20px rgba(255, 77, 109, 0.4)",
      },
    },
  },
  plugins: [],
};
