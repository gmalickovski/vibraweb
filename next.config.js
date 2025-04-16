/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config, { isServer }) => {
    // Add any custom webpack config if needed
    return config;
  },
}

module.exports = nextConfig