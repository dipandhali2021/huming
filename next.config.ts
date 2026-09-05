import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: { optimizePackageImports: ['lucide-react', 'motion'] },

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          // Nothing here is meant to be framed, and a page that proxies
          // the user's API key is a poor thing to let someone else embed.
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
      {
        // The worker sits in front of every GET the app makes, so a
        // stale copy is not a stale file — it is a stale policy. Never
        // cached, and registered with updateViaCache: 'none' from the
        // other side (components/register-sw.tsx). The narrow CSP is
        // belt and braces: a worker that can only load scripts from
        // this origin cannot be turned into someone else's foothold.
        source: '/sw.js',
        headers: [
          { key: 'Content-Type', value: 'application/javascript; charset=utf-8' },
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
          { key: 'Content-Security-Policy', value: "default-src 'self'; script-src 'self'" },
        ],
      },
    ];
  },
};

export default nextConfig;
