/* eslint-env node */
/**
 * next-sitemap config. Runs at `postbuild`. We do two things beyond the
 * stock setup:
 *  1. List the curated public routes by hand so the priority/changefreq
 *     reflect their real importance (home and category pages > stubs).
 *  2. Fetch published property slugs from the live API and emit a row
 *     per /property/<slug>. If the API is unreachable at build time,
 *     swallow the error so a deploy never breaks over a sitemap entry.
 */

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api/v1';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

/** Curated catalogue of static routes with their per-route priority. */
const STATIC_ROUTES = [
  { path: '/',             priority: 1.0, changefreq: 'daily'   },
  { path: '/buy',          priority: 0.9, changefreq: 'hourly'  },
  { path: '/rent',         priority: 0.9, changefreq: 'hourly'  },
  { path: '/new-projects', priority: 0.8, changefreq: 'daily'   },
  { path: '/commercial',   priority: 0.8, changefreq: 'daily'   },
  { path: '/plots',        priority: 0.8, changefreq: 'daily'   },
  { path: '/sell',         priority: 0.7, changefreq: 'weekly'  },
  { path: '/agents',       priority: 0.7, changefreq: 'daily'   },
  { path: '/about',        priority: 0.5, changefreq: 'monthly' },
  { path: '/contact',      priority: 0.5, changefreq: 'monthly' },
  { path: '/privacy',      priority: 0.3, changefreq: 'yearly'  },
  { path: '/terms',        priority: 0.3, changefreq: 'yearly'  },
];

/**
 * Walks every page of `/properties` and returns all published slugs.
 * Bounded at 50 pages × 60 listings each so a runaway dataset can't
 * stall a deploy. Most catalogs sit well under that.
 */
async function fetchPropertySlugs() {
  const slugs = [];
  for (let page = 1; page <= 50; page += 1) {
    let res;
    try {
      res = await fetch(
        `${API_BASE_URL}/properties?page=${page}&limit=60&sort=-createdAt`,
        { headers: { accept: 'application/json' } },
      );
    } catch (err) {
      console.warn('[sitemap] property fetch failed:', err.message);
      break;
    }
    if (!res.ok) break;
    const body = await res.json().catch(() => null);
    const items = body && body.data;
    if (!Array.isArray(items) || items.length === 0) break;
    for (const it of items) {
      if (it && it.slug) slugs.push(it.slug);
    }
    if (items.length < 60) break;
  }
  return slugs;
}

/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: SITE_URL,
  generateRobotsTxt: true,
  generateIndexSitemap: true,
  /* Skip stock auto-discovery — additionalPaths owns the full list. */
  exclude: ['*'],
  robotsTxtOptions: {
    policies: [
      { userAgent: '*', allow: '/' },
      { userAgent: '*', disallow: ['/admin', '/dashboard', '/api'] },
    ],
  },
  async additionalPaths() {
    const now = new Date().toISOString();

    const staticEntries = STATIC_ROUTES.map((r) => ({
      loc: r.path,
      changefreq: r.changefreq,
      priority: r.priority,
      lastmod: now,
    }));

    const slugs = await fetchPropertySlugs();
    const propertyEntries = slugs.map((slug) => ({
      loc: `/property/${slug}`,
      changefreq: 'weekly',
      priority: 0.6,
      lastmod: now,
    }));

    if (slugs.length === 0) {
      console.warn(
        '[sitemap] no property slugs — emitting static routes only',
      );
    } else {
      console.log(`[sitemap] emitted ${slugs.length} property routes`);
    }

    return [...staticEntries, ...propertyEntries];
  },
};
