export type PublicPage =
  | 'home'
  | 'collection'
  | 'collectionsGuide'
  | 'product'
  | 'quoteRequest'
  | 'cart'
  | 'checkout'
  | 'confirmation'

export type SiteRoute = {
  page: PublicPage
  collectionId?: string | null
  productId?: string | null
  quoteProductId?: string | null
}

type RouteEntity = {
  id: string
  title: string
}

function normalizePath(pathname: string) {
  const trimmed = pathname.replace(/\/+$/, '')
  return trimmed || '/'
}

function extractEntityId(segment: string) {
  const separatorIndex = segment.lastIndexOf('--')
  return separatorIndex >= 0 ? segment.slice(separatorIndex + 2) : segment
}

export function slugify(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')
}

export function buildProductPath(product: RouteEntity) {
  const slug = slugify(product.title) || 'produs'
  return `/produse/${slug}--${product.id}`
}

export function buildCollectionPath(collection: RouteEntity) {
  const slug = slugify(collection.title) || 'colectie'
  return `/colectii/${slug}--${collection.id}`
}

export function parseRoutePath(pathname: string): SiteRoute {
  const normalized = normalizePath(pathname)

  const params = new URLSearchParams(window.location.search)

  if (normalized === '/cos') {
    return { page: 'cart' }
  }

  if (normalized === '/comanda') {
    return { page: 'checkout' }
  }

  if (normalized === '/comanda/confirmare') {
    return { page: 'confirmation' }
  }

  if (normalized === '/cerere-oferta') {
    return {
      page: 'quoteRequest',
      quoteProductId: params.get('produs'),
    }
  }

  if (normalized === '/colectii-riflaje') {
    return { page: 'collectionsGuide' }
  }

  if (normalized.startsWith('/produse/')) {
    return {
      page: 'product',
      productId: extractEntityId(normalized.slice('/produse/'.length)),
    }
  }

  if (normalized.startsWith('/colectii/')) {
    return {
      page: 'collection',
      collectionId: extractEntityId(normalized.slice('/colectii/'.length)),
    }
  }

  return { page: 'home' }
}

export function buildRoutePath(
  route: SiteRoute,
  options: {
    product?: RouteEntity | null
    collection?: RouteEntity | null
  } = {},
) {
  if (route.page === 'product') {
    return options.product ? buildProductPath(options.product) : '/produse'
  }

  if (route.page === 'collection') {
    return options.collection ? buildCollectionPath(options.collection) : '/colectii'
  }

  if (route.page === 'cart') {
    return '/cos'
  }

  if (route.page === 'quoteRequest') {
    return route.quoteProductId ? `/cerere-oferta?produs=${encodeURIComponent(route.quoteProductId)}` : '/cerere-oferta'
  }

  if (route.page === 'collectionsGuide') {
    return '/colectii-riflaje'
  }

  if (route.page === 'checkout') {
    return '/comanda'
  }

  if (route.page === 'confirmation') {
    return '/comanda/confirmare'
  }

  return '/'
}
