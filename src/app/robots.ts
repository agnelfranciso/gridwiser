import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://gridwise-studio-2026.web.app';
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/signin', '/legal', '/share/'],
        disallow: ['/account', '/api/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
