/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', 'bcrypt']
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'x-created-by', value: 'saas-platform' },
        ],
      },
    ]
  }
}

module.exports = nextConfig