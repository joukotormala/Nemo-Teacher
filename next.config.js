/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: process.env.NEXT_DIST_DIR || '.next',
  output: process.env.NEXT_OUTPUT_MODE,
  productionBrowserSourceMaps: false,

  // turbopack: {} tells Next.js 16 we're happy with Turbopack defaults
  // and silences the "webpack config but no turbopack config" error
  turbopack: {},

  typescript: {
    ignoreBuildErrors: false,
  },
  images: { unoptimized: true },
};

module.exports = nextConfig;