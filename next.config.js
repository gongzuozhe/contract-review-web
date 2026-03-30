/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  outputExport: 'next',
  experimental: {
    serverActions: {
      bodyParser: false
    }
  },
  images: {
    unoptimized: true
  }
}

module.exports = nextConfig
