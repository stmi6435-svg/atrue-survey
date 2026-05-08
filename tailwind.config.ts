import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./features/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ivory: "#FFF9EF",
        oatmeal: "#EFE0CD",
        sand: "#D7B98D",
        cocoa: "#6F553C",
        charcoal: "#262320",
        clay: "#B67854",
      },
      boxShadow: {
        soft: "0 18px 60px rgba(38, 35, 32, 0.10)",
      },
    },
  },
  plugins: [],
};

export default config;
