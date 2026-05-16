/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  // NOTE: API proxying is now handled by app/api/[...path]/route.ts
  // which properly forwards Authorization headers (Next.js rewrites strip them).
}

module.exports = nextConfig
