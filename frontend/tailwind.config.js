/** @type {import('tailwindcss').Config} */
export default {
  // eslint-disable-next-line no-undef
  plugins: [require("postcss-nesting"), require("tailwindcss")],
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx,scss}"],
  theme: {
    extend: {
      fontFamily: {
        spectral: ["Spectral", "fallbackFont", "sans-serif"],
        sans: ["Rubik", "fallbackFont", "sans-serif"], //["Open Sans", "fallbackFont", "sans-serif"],
        rubik: ["Rubik", "fallbackFont", "sans-serif"],
        roboto: ["Roboto", "fallbackFont", "sans-serif"],
        robotoSlap: ["Roboto Slab", "fallbackFont", "sans-serif"],
        ProtestRiot: ["Protest Riot", "fallbackFont", "sans-serif"],
        kalam : ["Kalam", "fallbackFont", "sans-serif"],
      },
      screens: {
        xsm: "480px", // Replace '640px' with your desired width
      },
    },
  },
};
