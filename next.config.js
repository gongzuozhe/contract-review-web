/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: {
    serverActions: {
      bodyParser: false
    }
  }
}

module.exports = nextConfig
