/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    '@tailwindcss/postcss': {}, // ✅ use the new PostCSS plugin
    autoprefixer: {},           // still needed for browser prefixes
  },
};

export default config;
