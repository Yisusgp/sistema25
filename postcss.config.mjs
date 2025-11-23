/**
 * PostCSS Configuration for Next.js and Tailwind CSS v3.
 * IMPORTANT: Must use CommonJS export format (module.exports) for compatibility
 * with Next.js internal build process.
 */
module.exports = {
  plugins: {
    // Tailwind CSS v3 acts as the PostCSS plugin itself.
    'tailwindcss': {},
    // Autoprefixer is required for v3 to handle vendor prefixes.
    'autoprefixer': {},
  },
};
