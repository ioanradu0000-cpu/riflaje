function toAbsoluteUrl(siteUrl: string, path: string) {
  return new URL(path, siteUrl).toString()
}

async function loadSettings(apiBaseUrl: string) {
  const response = await fetch(new URL('/api/settings/public', apiBaseUrl), {
    headers: { Accept: 'application/json' },
  })

  if (!response.ok) {
    throw new Error('Settings could not be loaded for robots.txt.')
  }

  return response.json()
}

export default async function handler(_req: any, res: any) {
  try {
    const apiBaseUrl = process.env.API_URL || process.env.VITE_API_URL
    const fallbackSiteUrl = process.env.SITE_URL || 'https://www.designriflaje.com'
    const settings = apiBaseUrl ? await loadSettings(apiBaseUrl) : null
    const siteUrl = String(settings?.siteUrl || fallbackSiteUrl).trim()
    const robots = [
      'User-agent: *',
      'Allow: /',
      'Disallow: /cos',
      'Disallow: /comanda',
      `Sitemap: ${toAbsoluteUrl(siteUrl, '/sitemap.xml')}`,
      '',
    ].join('\n')

    res.setHeader('Content-Type', 'text/plain; charset=utf-8')
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=86400')
    res.status(200).send(robots)
  } catch (error) {
    console.error('robots.txt generation failed:', error)
    res.setHeader('Content-Type', 'text/plain; charset=utf-8')
    res.status(200).send('User-agent: *\nAllow: /\n')
  }
}
