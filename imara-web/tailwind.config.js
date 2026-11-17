/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        imara: {
          pink: "#FF2D6B",
          pinkDim: "#CC1F52",
          amber: "#FFB300",
          grey: "#9E9E9E",
          greyDim: "#555555",
          blue: "#3B82F6",
          purple: "#8B5CF6",
          green: "#10B981",
        },
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
    },
  },
  plugins: [
    function ({ addBase }) {
      addBase({
        '@media print': {
          'body': { backgroundColor: '#ffffff !important', color: '#000000 !important' },
          '.print\\:hidden': { display: 'none !important' },
          'main': { padding: '0 !important' },
        },
      });
    },
  ],
};

module.exports = config;