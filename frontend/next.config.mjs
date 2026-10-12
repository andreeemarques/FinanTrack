// Endereço da API, usado só no servidor (os pedidos do browser passam por /api)
const urlApi = (process.env.API_URL ?? 'http://localhost:3001').replace(/\/$/, '')

const cabecalhosSeguranca = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
]

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
  async headers() {
    return [{ source: '/:path*', headers: cabecalhosSeguranca }]
  },
  // O browser fala sempre com o próprio site (/api/...), que reencaminha para a API.
  // Assim, os cookies serão do mesmo site e dispensa-se o CORS.
  async rewrites() {
    return [{ source: '/api/:path*', destination: `${urlApi}/:path*` }]
  },
}

export default nextConfig