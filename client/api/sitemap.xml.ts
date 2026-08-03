function slugify(value: string) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')
}

function toAbsoluteUrl(siteUrl: string, path: string) {
  return new URL(path, siteUrl).toString()
}

function buildProductPath(product: { id: string; title: string }) {
  const slug = slugify(product.title) || 'produs'
  return `/produse/${slug}--${product.id}`
}

function buildCollectionPath(collection: { id: string; title: string }) {
  const slug = slugify(collection.title) || 'colectie'
  return `/colectii/${slug}--${collection.id}`
}

async function loadSeoData(apiBaseUrl: string) {
  const [productsResponse, collectionsResponse, settingsResponse] = await Promise.all([
    fetch(new URL('/api/products', apiBaseUrl), { headers: { Accept: 'application/json' } }),
    fetch(new URL('/api/collections', apiBaseUrl), { headers: { Accept: 'application/json' } }),
    fetch(new URL('/api/settings/public', apiBaseUrl), { headers: { Accept: 'application/json' } }),
  ])

  if (!productsResponse.ok || !collectionsResponse.ok || !settingsResponse.ok) {
    throw new Error('SEO data could not be loaded for sitemap.xml.')
  }

  return {
    products: await productsResponse.json(),
    collections: await collectionsResponse.json(),
    settings: await settingsResponse.json(),
  }
}

function buildUrlTag(loc: string, priority: string, changefreq: string) {
  const lastmod = new Date().toISOString().slice(0, 10)
  return [
    '  <url>',
    `    <loc>${loc}</loc>`,
    `    <lastmod>${lastmod}</lastmod>`,
    `    <changefreq>${changefreq}</changefreq>`,
    `    <priority>${priority}</priority>`,
    '  </url>',
  ].join('\n')
}

export default async function handler(_req: any, res: any) {
  try {
    const apiBaseUrl = process.env.API_URL || process.env.VITE_API_URL
    const fallbackSiteUrl = process.env.SITE_URL || 'https://www.designriflaje.com'

    if (!apiBaseUrl) {
      throw new Error('Missing API_URL or VITE_API_URL.')
    }

    const { products, collections, settings } = await loadSeoData(apiBaseUrl)
    const siteUrl = String(settings?.siteUrl || fallbackSiteUrl).trim()
    const urls = [
      buildUrlTag(toAbsoluteUrl(siteUrl, '/'), '1.0', 'daily'),
      buildUrlTag(toAbsoluteUrl(siteUrl, '/colectii-riflaje'), '0.85', 'weekly'),
      buildUrlTag(toAbsoluteUrl(siteUrl, '/cerere-oferta'), '0.75', 'weekly'),
      ...collections.map((collection: { id: string; title: string }) =>
        buildUrlTag(toAbsoluteUrl(siteUrl, buildCollectionPath(collection)), '0.8', 'weekly'),
      ),
      ...products.map((product: { id: string; title: string }) =>
        buildUrlTag(toAbsoluteUrl(siteUrl, buildProductPath(product)), '0.9', 'weekly'),
      ),
    ]

    const sitemap = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
      ...urls,
      '</urlset>',
      '',
    ].join('\n')

    res.setHeader('Content-Type', 'application/xml; charset=utf-8')
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=86400')
    res.status(200).send(sitemap)
  } catch (error) {
    console.error('sitemap.xml generation failed:', error)
    res.setHeader('Content-Type', 'application/xml; charset=utf-8')
    res.status(500).send('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>')
  }
}
