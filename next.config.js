/** @type {import('next').NextConfig} */
// allow images from githubusercontent.com
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['avatars.githubusercontent.com'],
  },
}

module.exports = nextConfig
