import path from 'node:path';

const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? '/api/v1';
const proxyOriginFromPublic = (() => {
  try {
    const url = new URL(apiBase);
    if (url.protocol === 'http:' || url.protocol === 'https:') {
      return url.origin;
    }
    return null;
  } catch {
    return null;
  }
})();

function normalizeProxyOrigin(value) {
  if (!value) return null;
  try {
    const url = new URL(String(value).trim());
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    return url.origin;
  } catch {
    return null;
  }
}

const API_PROXY_ORIGIN =
  normalizeProxyOrigin(process.env.API_PROXY_ORIGIN) ?? proxyOriginFromPublic;

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Compile SCSS @use paths without long relative chains.
  sassOptions: {
    includePaths: [path.join(process.cwd(), 'src/styles')],
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    /* Hosts the <Image> loader is allowed to fetch from.
     * `res.cloudinary.com`   — CDN media (MEDIA_PROVIDER=cloudinary)
     * `images.unsplash.com`  — seed/sample property photos
     * `*.up.railway.app`     — local-disk uploads served from the Railway
     *                          backend until Cloudinary is enabled. Add
     *                          your custom backend domain here too once
     *                          you attach one. */
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: '*.up.railway.app' },
      { protocol: 'https', hostname: '*.railway.app' },
    ],
  },
  // Keep dev memory/CPU low: do not bundle heavy libs into the server graph.
  experimental: {
    optimizePackageImports: ['framer-motion', 'maplibre-gl'],
  },
  async headers() {
    return [
      {
        // Public, cacheable GET pages — tune per route as needed.
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ];
  },
  async rewrites() {
    if (!API_PROXY_ORIGIN) return [];
    return [
      {
        source: '/api/v1/:path*',
        destination: `${API_PROXY_ORIGIN}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
