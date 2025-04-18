/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  serverRuntimeConfig: {
    apiTimeout: 60000,
  }
}

module.exports = nextConfig