import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  Clipboard,
  Mail,
  Menu,
  Minus,
  Phone,
  Plus,
  ShoppingBag,
  ShoppingCart,
  Trash2,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'

type ImagePosition = {
  x: number
  y: number
}

type Product = {
  id: string
  title: string
  price: string
  description: string
  image: string
  images: string[]
  imageZooms: number[]
  imagePositions: ImagePosition[]
  riflajeImages: string[]
  noRiflajeImages: string[]
  panelWidthMm: number
  panelLengthMm: number
  available: boolean
  active: boolean
}

type Collection = {
  id: string
  title: string
  description: string
  image: string
  images: string[]
  productIds: string[]
  active: boolean
  products: Product[]
}

type Settings = {
  siteTitle: string
  siteUrl: string
  logo: string
  showSiteTitle: boolean
  heroTitle: string
  heroDescription: string
  heroImage: string
  heroImages: string[]
  email: string
  phone: string
  whatsapp: string
  bankBeneficiary: string
  bankIban: string
  bankName: string
  bankInstructions: string
  freeShippingMessage: string
  shippingCostPerItem: number
  seoTitle: string
  seoDescription: string
  seoImage: string
}

type CartLine = {
  productId: string
  quantity: number
}

type CheckoutForm = {
  fullName: string
  phone: string
  county: string
  locality: string
  address: string
  postalCode: string
  notes: string
}

type OrderResponse = {
  order: {
    id: string
    orderNumber: string
    customer: CheckoutForm
    items: Array<{
      productId: string
      title: string
      quantity: number
      unitPrice: string
      subtotal: string
    }>
    subtotal: string
    shipping: string
    total: string
    paymentStatus: string
  }
  bank: Settings
}

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000'
const cartStorageKey = 'pcforge-cart'
const fallbackHeroImage =
  'https://images.unsplash.com/photo-1516972810927-80185027ca84?auto=format&fit=crop&w=1400&q=80'

function getImageSet(primary: string, images: string[] | undefined) {
  return [...new Set([primary, ...(images || [])].map((image) => image?.trim()).filter(Boolean))]
}

function upsertMetaTag(attribute: 'name' | 'property', key: string, content: string) {
  let element = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`)

  if (!element) {
    element = document.createElement('meta')
    element.setAttribute(attribute, key)
    document.head.appendChild(element)
  }

  element.setAttribute('content', content)
}

function upsertLinkTag(rel: string, href: string) {
  let element = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`)

  if (!element) {
    element = document.createElement('link')
    element.setAttribute('rel', rel)
    document.head.appendChild(element)
  }

  element.setAttribute('href', href)
}

function normalizeZooms(zooms: number[] | undefined, count: number) {
  return Array.from({ length: count }, (_, index) => {
    const zoom = Number(zooms?.[index] ?? 100)
    return Number.isFinite(zoom) ? Math.min(220, Math.max(40, Math.round(zoom))) : 100
  })
}

function normalizePositions(positions: ImagePosition[] | undefined, count: number) {
  return Array.from({ length: count }, (_, index) => {
    const position = positions?.[index]
    const x = Number(position?.x ?? 50)
    const y = Number(position?.y ?? 50)

    return {
      x: Number.isFinite(x) ? Math.min(100, Math.max(0, Math.round(x))) : 50,
      y: Number.isFinite(y) ? Math.min(100, Math.max(0, Math.round(y))) : 50,
    }
  })
}

function SlidingImages({
  images,
  imageZooms,
  imagePositions,
  alt,
  className,
  interval = 3600,
  autoPlay = true,
  showDots = false,
  showControls = false,
  fit = 'cover',
}: {
  images: string[]
  imageZooms?: number[]
  imagePositions?: ImagePosition[]
  alt: string
  className: string
  interval?: number
  autoPlay?: boolean
  showDots?: boolean
  showControls?: boolean
  fit?: 'cover' | 'contain'
}) {
  const safeImages = images.length > 0 ? images : [fallbackHeroImage]
  const safeZooms = normalizeZooms(imageZooms, safeImages.length)
  const safePositions = normalizePositions(imagePositions, safeImages.length)
  const [index, setIndex] = useState(0)

  useEffect(() => {
    if (!autoPlay || safeImages.length <= 1) return

    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % safeImages.length)
    }, interval)

    return () => window.clearInterval(timer)
  }, [autoPlay, interval, safeImages.length])

  useEffect(() => {
    if (index >= safeImages.length) {
      setIndex(0)
    }
  }, [index, safeImages.length])

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <div
        className="flex h-full transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
        style={{ transform: `translateX(-${index * 100}%)` }}
      >
        {safeImages.map((image, imageIndex) => (
          <img
            alt={imageIndex === index ? alt : ''}
            className={`h-full w-full shrink-0 ${fit === 'contain' ? 'object-contain p-3' : 'object-cover'}`}
            key={`${image}-${imageIndex}`}
            src={image}
            style={{
              objectPosition: `${safePositions[imageIndex].x}% ${safePositions[imageIndex].y}%`,
              transform: `scale(${safeZooms[imageIndex] / 100})`,
              transformOrigin: `${safePositions[imageIndex].x}% ${safePositions[imageIndex].y}%`,
            }}
          />
        ))}
      </div>
      {showDots && safeImages.length > 1 && (
        <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2 rounded-full bg-black/30 px-3 py-2 backdrop-blur">
          {safeImages.map((image, dotIndex) => (
            <button
              aria-label={`Imaginea ${dotIndex + 1}`}
              className={`size-2.5 rounded-full transition ${
                dotIndex === index ? 'w-7 bg-white' : 'bg-white/55 hover:bg-white'
              }`}
              key={`${image}-dot-${dotIndex}`}
              onClick={(event) => {
                event.stopPropagation()
                setIndex(dotIndex)
              }}
              type="button"
            />
          ))}
        </div>
      )}
      {showControls && safeImages.length > 1 && (
        <>
          <button
            aria-label="Poza anterioara"
            className="absolute left-4 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-[#211c16] shadow-lg transition hover:bg-white"
            onClick={(event) => {
              event.stopPropagation()
              setIndex((current) => (current - 1 + safeImages.length) % safeImages.length)
            }}
            type="button"
          >
            <ArrowLeft className="size-5" aria-hidden="true" />
          </button>
          <button
            aria-label="Poza urmatoare"
            className="absolute right-4 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-[#211c16] shadow-lg transition hover:bg-white"
            onClick={(event) => {
              event.stopPropagation()
              setIndex((current) => (current + 1) % safeImages.length)
            }}
            type="button"
          >
            <ArrowRight className="size-5" aria-hidden="true" />
          </button>
        </>
      )}
    </div>
  )
}

function ProductRiflajeComparison({ product }: { product: Product }) {
  const withImages = getImageSet('', product.riflajeImages)
  const withoutImages = getImageSet('', product.noRiflajeImages)
  const [mode, setMode] = useState<'with' | 'without'>(withImages.length > 0 ? 'with' : 'without')
  const hasAnyImages = withImages.length > 0 || withoutImages.length > 0
  const effectiveMode =
    mode === 'with' && withImages.length === 0
      ? 'without'
      : mode === 'without' && withoutImages.length === 0
        ? 'with'
        : mode
  const activeImages = effectiveMode === 'with' ? withImages : withoutImages

  if (!hasAnyImages) {
    return null
  }

  return (
    <section className="mt-8 overflow-hidden rounded-lg border border-[#ded7cb] bg-[#f6f4ef] p-5">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-[#7a4d2b]">
            Comparatie
          </p>
          <h2 className="mt-1 text-2xl font-semibold">Cu riflaje / fara riflaje</h2>
        </div>
        <div className="inline-grid grid-cols-2 rounded-md border border-[#cfc6b7] bg-white p-1 text-sm font-semibold">
          <button
            className={`rounded px-4 py-2 transition ${
              effectiveMode === 'with' ? 'bg-[#211c16] text-white shadow-sm' : 'text-[#665d52] hover:text-[#211c16]'
            }`}
            disabled={withImages.length === 0}
            onClick={() => setMode('with')}
            type="button"
          >
            Cu riflaje
          </button>
          <button
            className={`rounded px-4 py-2 transition ${
              effectiveMode === 'without' ? 'bg-[#211c16] text-white shadow-sm' : 'text-[#665d52] hover:text-[#211c16]'
            }`}
            disabled={withoutImages.length === 0}
            onClick={() => setMode('without')}
            type="button"
          >
            Fara riflaje
          </button>
        </div>
      </div>

      <div className="mt-5 rounded-lg border border-[#ded7cb] bg-white p-2 shadow-sm">
        <div key={effectiveMode} className="animate-comparison-swap">
          <SlidingImages
            alt={`${product.title} ${effectiveMode === 'with' ? 'cu riflaje' : 'fara riflaje'}`}
            autoPlay={false}
            className="h-[320px] w-full rounded-md bg-white sm:h-[420px]"
            fit="contain"
            images={activeImages}
            showControls
            showDots
          />
        </div>
      </div>
    </section>
  )
}

function MobileExpandablePanel({
  eyebrow,
  title,
  children,
  defaultOpen = false,
}: {
  eyebrow?: string
  title: string
  children: ReactNode
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <section className="rounded-lg border border-[#ded7cb] bg-white p-5 shadow-sm">
      <div className="hidden sm:block">
        {eyebrow && (
          <p className="text-sm font-semibold uppercase tracking-wide text-[#7a4d2b]">{eyebrow}</p>
        )}
        <h2 className="mt-1 text-2xl font-semibold">{title}</h2>
      </div>

      <button
        aria-expanded={open}
        className="mobile-disclosure-trigger flex w-full items-center justify-between gap-4 text-left sm:hidden"
        onClick={() => setOpen((current) => !current)}
        type="button"
      >
        <div>
          {eyebrow && (
            <p className="text-sm font-semibold uppercase tracking-wide text-[#7a4d2b]">{eyebrow}</p>
          )}
          <h2 className="mt-1 text-xl font-semibold">{title}</h2>
        </div>
        <span
          className={`grid size-10 shrink-0 place-items-center rounded-full border border-[#ded7cb] bg-[#f6f4ef] text-[#211c16] transition-transform duration-300 ${
            open ? 'rotate-180' : ''
          }`}
        >
          <ChevronDown className="size-5" aria-hidden="true" />
        </span>
      </button>

      <div className={`mobile-disclosure-content ${open ? 'is-open' : ''} sm:mt-5 sm:!grid-rows-[1fr] sm:!opacity-100`}>
        <div className="overflow-hidden">
          <div className="pt-4 sm:pt-0">{children}</div>
        </div>
      </div>
    </section>
  )
}

function ProductWallCalculator({
  product,
  onAddQuantity,
}: {
  product: Product
  onAddQuantity: (product: Product, quantity: number) => void
}) {
  const [wallWidthCm, setWallWidthCm] = useState('')
  const [wallHeightCm, setWallHeightCm] = useState('')
  const panelWidthMm = Number(product.panelWidthMm || 0)
  const panelLengthMm = Number(product.panelLengthMm || 0)
  const widthCm = Number(wallWidthCm)
  const heightCm = Number(wallHeightCm)
  const canCalculate = panelWidthMm > 0 && panelLengthMm > 0 && widthCm > 0 && heightCm > 0
  const wallHeightMm = heightCm * 10
  const stripsAcross = canCalculate ? Math.ceil((widthCm * 10) / panelWidthMm) : 0
  const fullPanelsPerStrip = canCalculate ? Math.floor(wallHeightMm / panelLengthMm) : 0
  const remainderHeightMm = canCalculate ? wallHeightMm % panelLengthMm : 0
  const extraStripsPerPanel =
    canCalculate && remainderHeightMm > 0 ? Math.max(1, Math.floor(panelLengthMm / remainderHeightMm)) : 0
  const fullPanelsTotal = stripsAcross * fullPanelsPerStrip
  const extraPanelsTotal = remainderHeightMm > 0 ? Math.ceil(stripsAcross / extraStripsPerPanel) : 0
  const totalPieces = fullPanelsTotal + extraPanelsTotal

  if (panelWidthMm <= 0 || panelLengthMm <= 0) {
    return null
  }

  return (
    <MobileExpandablePanel eyebrow="Calculator" title="Cate riflaje trebuie sa comanzi">
      <p className="max-w-2xl text-sm leading-6 text-[#665d52]">
            Introdu dimensiunea peretelui. Calculul foloseste dimensiunea produsului:
        {' '}
        <strong className="text-[#211c16]">{panelWidthMm} x {panelLengthMm} mm</strong>.
      </p>

      <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_280px]">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-medium text-[#665d52]">
            Latime perete (cm)
            <input
              className="mt-2 w-full rounded-md border border-[#cfc6b7] px-3 py-3 text-lg font-semibold outline-none focus:border-[#7a4d2b]"
              min={1}
              onChange={(event) => setWallWidthCm(event.target.value)}
              placeholder="ex. 350"
              type="number"
              value={wallWidthCm}
            />
          </label>
          <label className="text-sm font-medium text-[#665d52]">
            Inaltime perete (cm)
            <input
              className="mt-2 w-full rounded-md border border-[#cfc6b7] px-3 py-3 text-lg font-semibold outline-none focus:border-[#7a4d2b]"
              min={1}
              onChange={(event) => setWallHeightCm(event.target.value)}
              placeholder="ex. 260"
              type="number"
              value={wallHeightCm}
            />
          </label>
        </div>

        <div className="rounded-md bg-[#f6f4ef] p-4">
          {canCalculate ? (
            <div key={`${stripsAcross}-${fullPanelsPerStrip}-${extraPanelsTotal}`} className="animate-card-in">
              <p className="text-sm font-semibold text-[#665d52]">Necesar estimat</p>
              <p className="mt-1 text-4xl font-semibold text-[#211c16]">{totalPieces}</p>
              <p className="mt-1 text-sm text-[#665d52]">bucati</p>
              <div className="mt-4 grid gap-1 text-sm text-[#665d52]">
                <p>{stripsAcross} fasii necesare pe latime</p>
                {fullPanelsPerStrip > 0 && <p>{fullPanelsTotal} panouri intregi pentru inaltime</p>}
                {remainderHeightMm > 0 && (
                  <p>
                    {extraPanelsTotal} panouri pentru bucati de completare de {remainderHeightMm} mm
                  </p>
                )}
              </div>
              {product.available && (
                <button
                  className="mt-4 w-full rounded-md bg-[#7a4d2b] px-4 py-3 font-semibold text-white transition hover:bg-[#633d21]"
                  onClick={() => onAddQuantity(product, totalPieces)}
                  type="button"
                >
                  Adauga {totalPieces} in cos
                </button>
              )}
            </div>
          ) : (
            <p className="text-sm leading-6 text-[#665d52]">
              Completeaza latimea si inaltimea peretelui pentru a vedea cantitatea recomandata.
            </p>
          )}
        </div>
      </div>
      <p className="mt-4 text-xs leading-5 text-[#81786c]">
        Estimarea presupune montaj vertical si folosirea resturilor taiate pe inaltime. Nu include pierderi pentru debitare, colturi sau rezerve.
      </p>
    </MobileExpandablePanel>
  )
}

function loadCart() {
  try {
    const parsed = JSON.parse(localStorage.getItem(cartStorageKey) || '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function parseMoneyToCents(value: string) {
  const raw = value.replace(/\s/g, '')
  const match = raw.match(/\d[\d.,]*/)

  if (!match) return 0

  let amount = match[0]

  if (amount.includes(',')) {
    amount = amount.replace(/\./g, '').replace(',', '.')
  } else if (/\.\d{3}$/.test(amount)) {
    amount = amount.replace(/\./g, '')
  }

  return Math.max(0, Math.round((Number.parseFloat(amount) || 0) * 100))
}

function formatLei(cents: number) {
  return new Intl.NumberFormat('ro-RO', {
    style: 'currency',
    currency: 'RON',
  }).format(cents / 100)
}

function normalizeLocality(value: string) {
  return value
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/^municipiul\s+/, '')
    .replace(/\s+/g, ' ')
}

function isIasi(value: string) {
  return normalizeLocality(value) === 'iasi'
}

function isRomanianPhone(value: string) {
  return /^(?:\+40|0040|0)\d{9}$/.test(value.replace(/[\s().-]/g, ''))
}

function App() {
  const [products, setProducts] = useState<Product[]>([])
  const [collections, setCollections] = useState<Collection[]>([])
  const [settings, setSettings] = useState<Settings | null>(null)
  const [cart, setCart] = useState<CartLine[]>(loadCart)
  const [page, setPage] = useState<
    'home' | 'collection' | 'product' | 'cart' | 'checkout' | 'confirmation'
  >('home')
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null)
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [checkoutError, setCheckoutError] = useState('')
  const [confirmation, setConfirmation] = useState<OrderResponse | null>(null)
  const [form, setForm] = useState<CheckoutForm>({
    fullName: '',
    phone: '',
    county: '',
    locality: '',
    address: '',
    postalCode: '',
    notes: '',
  })

  useEffect(() => {
    async function loadData() {
      try {
        const [productsResponse, collectionsResponse, settingsResponse] = await Promise.all([
          fetch(`${apiUrl}/api/products`),
          fetch(`${apiUrl}/api/collections`),
          fetch(`${apiUrl}/api/settings/public`),
        ])

        if (!productsResponse.ok || !collectionsResponse.ok || !settingsResponse.ok) {
          throw new Error('Datele nu au putut fi incarcate.')
        }

        setProducts(await productsResponse.json())
        setCollections(await collectionsResponse.json())
        setSettings(await settingsResponse.json())
      } catch (err) {
        setError(err instanceof Error ? err.message : 'A aparut o eroare.')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  useEffect(() => {
    localStorage.setItem(cartStorageKey, JSON.stringify(cart))
  }, [cart])

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [page, selectedCollectionId, selectedProductId])

  const productById = useMemo(
    () => new Map(products.map((product) => [product.id, product])),
    [products],
  )
  const cartItems = useMemo(
    () =>
      cart
        .map((line) => {
          const product = productById.get(line.productId)
          const quantity = Math.max(1, line.quantity)
          const unitPriceCents = product ? parseMoneyToCents(product.price) : 0

          return product
            ? {
                product,
                quantity,
                unitPriceCents,
                subtotalCents: unitPriceCents * quantity,
              }
            : null
        })
        .filter((item): item is NonNullable<typeof item> => Boolean(item)),
    [cart, productById],
  )
  const quantityTotal = cartItems.reduce((total, item) => total + item.quantity, 0)
  const subtotalCents = cartItems.reduce((total, item) => total + item.subtotalCents, 0)
  const shippingCostPerItem = settings?.shippingCostPerItem ?? 10
  const shippingCents = isIasi(form.locality)
    ? 0
    : Math.round(shippingCostPerItem * 100) * quantityTotal
  const totalCents = subtotalCents + shippingCents
  const title = settings?.siteTitle || 'DesignRiflaje'
  const showSiteTitle = settings?.showSiteTitle !== false
  const heroTitle = settings?.heroTitle || title
  const heroDescription =
    settings?.heroDescription || 'Riflaje profesionale pentru amenajari moderne.'
  const seoTitle = settings?.seoTitle || title
  const seoDescription =
    settings?.seoDescription || heroDescription || 'Magazin online pentru riflaje decorative premium.'
  const seoImage = settings?.seoImage || settings?.heroImage || settings?.logo || fallbackHeroImage
  const siteUrl = settings?.siteUrl?.trim() || window.location.origin
  const heroImages = getImageSet(settings?.heroImage || fallbackHeroImage, settings?.heroImages)
  const contactHref = settings?.email ? `mailto:${settings.email}` : '#contact'
  const collectionById = useMemo(
    () => new Map(collections.map((collection) => [collection.id, collection])),
    [collections],
  )
  const selectedCollection = selectedCollectionId ? collectionById.get(selectedCollectionId) : null
  const selectedProduct = selectedProductId ? productById.get(selectedProductId) : null

  useEffect(() => {
    document.title = seoTitle
    upsertMetaTag('name', 'description', seoDescription)
    upsertMetaTag('property', 'og:title', seoTitle)
    upsertMetaTag('property', 'og:description', seoDescription)
    upsertMetaTag('property', 'og:type', 'website')
    upsertMetaTag('property', 'og:url', siteUrl)
    upsertMetaTag('property', 'og:image', seoImage)
    upsertMetaTag('name', 'twitter:card', 'summary_large_image')
    upsertMetaTag('name', 'twitter:title', seoTitle)
    upsertMetaTag('name', 'twitter:description', seoDescription)
    upsertMetaTag('name', 'twitter:image', seoImage)
    upsertLinkTag('canonical', siteUrl)
  }, [seoDescription, seoImage, seoTitle, siteUrl])

  function openCollection(collectionId: string) {
    setSelectedCollectionId(collectionId)
    setPage('collection')
  }

  function openProduct(productId: string) {
    setSelectedProductId(productId)
    setPage('product')
  }

  function addToCart(product: Product) {
    addQuantityToCart(product, 1)
  }

  function addQuantityToCart(product: Product, quantity: number) {
    if (!product.available) return
    const safeQuantity = Math.max(1, Math.floor(quantity))

    setCart((current) => {
      const existing = current.find((line) => line.productId === product.id)

      if (existing) {
        return current.map((line) =>
          line.productId === product.id
            ? { ...line, quantity: line.quantity + safeQuantity }
            : line,
        )
      }

      return [...current, { productId: product.id, quantity: safeQuantity }]
    })
    setPage('cart')
  }

  function updateQuantity(productId: string, quantity: number) {
    setCart((current) =>
      current.map((line) =>
        line.productId === productId ? { ...line, quantity: Math.max(1, quantity) } : line,
      ),
    )
  }

  function removeFromCart(productId: string) {
    setCart((current) => current.filter((line) => line.productId !== productId))
  }

  async function copyText(text: string) {
    await navigator.clipboard.writeText(text)
  }

  async function submitOrder(event: FormEvent) {
    event.preventDefault()
    setCheckoutError('')

    if (!form.fullName.trim() || !form.phone.trim() || !form.county.trim() || !form.locality.trim() || !form.address.trim()) {
      setCheckoutError('Completeaza toate campurile obligatorii.')
      return
    }

    if (!isRomanianPhone(form.phone)) {
      setCheckoutError('Numarul de telefon nu este valid pentru Romania.')
      return
    }

    if (!cartItems.length) {
      setCheckoutError('Cosul este gol.')
      return
    }

    try {
      const response = await fetch(`${apiUrl}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer: form,
          items: cartItems.map((item) => ({
            productId: item.product.id,
            quantity: item.quantity,
          })),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Comanda nu a putut fi salvata.')
      }

      setConfirmation(data)
      setCart([])
      setPage('confirmation')
    } catch (err) {
      setCheckoutError(err instanceof Error ? err.message : 'Comanda nu a putut fi salvata.')
    }
  }

  function renderLogo() {
    if (settings?.logo) {
      return (
        <img
          alt={`${title} logo`}
          className={
            showSiteTitle
              ? 'size-10 rounded-md object-cover'
              : 'h-12 w-44 rounded-md object-contain sm:w-56'
          }
          src={settings.logo}
        />
      )
    }

    return (
      <span className="grid size-10 place-items-center rounded-md bg-[#211c16] text-white">
        <ShoppingBag className="size-5" aria-hidden="true" />
      </span>
    )
  }

  return (
    <main className="min-h-screen bg-[#f6f4ef] text-[#211c16]">
      <header className="sticky top-0 z-20 border-b border-[#ded7cb] bg-[#f6f4ef]/90 backdrop-blur animate-drop-in">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
          <button className="flex min-w-0 items-center gap-3 transition duration-300 hover:scale-[1.02]" onClick={() => setPage('home')} type="button">
            {renderLogo()}
            {showSiteTitle && <span className="truncate text-lg font-semibold">{title}</span>}
          </button>
          <div className="hidden items-center gap-7 text-sm font-medium text-[#665d52] md:flex">
            <button className="transition hover:text-[#211c16]" onClick={() => setPage('home')} type="button">Produse</button>
            <a href="#colectii" onClick={() => setPage('home')}>Colectii</a>
            <a href="#contact">Contact</a>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="relative inline-flex items-center gap-2 rounded-md border border-[#cfc6b7] bg-white px-3 py-2 text-sm font-semibold transition duration-300 hover:-translate-y-0.5 hover:shadow-lg"
              onClick={() => setPage('cart')}
              type="button"
            >
              <ShoppingCart className="size-5" aria-hidden="true" />
              <span className="hidden sm:inline">Cos</span>
              <span className="grid min-w-5 place-items-center rounded-full bg-[#7a4d2b] px-1.5 text-xs text-white">
                {quantityTotal}
              </span>
            </button>
            <a
              className="hidden rounded-md bg-[#7a4d2b] px-4 py-2 text-sm font-semibold text-white transition duration-300 hover:-translate-y-0.5 hover:bg-[#633d21] hover:shadow-lg sm:inline-flex"
              href={contactHref}
            >
              Cere oferta
            </a>
            <Menu className="size-6 md:hidden" aria-label="Meniu" />
          </div>
        </nav>
      </header>

      {page === 'home' && (
        <>
          <section className="mx-auto grid max-w-7xl gap-10 px-5 py-14 sm:px-8 lg:grid-cols-[1fr_0.9fr] lg:items-center lg:py-20">
            <div className="animate-fade-up">
              <p className="mb-4 text-sm font-semibold uppercase tracking-wide text-[#7a4d2b]">
                Riflaje custom si standard
              </p>
              <h1 className="max-w-3xl text-5xl font-semibold leading-[1.05] tracking-normal sm:text-6xl">
                {heroTitle}
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-[#665d52]">
                {heroDescription}
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <a className="inline-flex items-center justify-center rounded-md bg-[#211c16] px-5 py-3 font-semibold text-white transition duration-300 hover:-translate-y-0.5 hover:bg-[#3a3128] hover:shadow-xl" href="#produse">
                  Vezi produse
                </a>
                <a className="inline-flex items-center justify-center gap-2 rounded-md border border-[#cfc6b7] bg-white px-5 py-3 font-semibold text-[#211c16] transition duration-300 hover:-translate-y-0.5 hover:border-[#a89076] hover:shadow-lg" href={contactHref}>
                  <Mail className="size-5" aria-hidden="true" />
                  Contact
                </a>
              </div>
            </div>
            <div className="animate-float-slow overflow-hidden rounded-lg border border-[#ded7cb] bg-white shadow-[0_22px_70px_rgba(58,49,40,0.12)]">
              <SlidingImages
                alt="Imagine principala site"
                className="h-[360px] w-full"
                images={heroImages}
                interval={4200}
                showDots
              />
            </div>
          </section>

          <section className="border-y border-[#ded7cb] bg-[#211c16] px-5 py-14 text-white sm:px-8" id="colectii">
            <div className="mx-auto max-w-7xl">
              <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wide text-[#d7b38d]">
                    Colectii
                  </p>
                  <h2 className="mt-2 text-3xl font-semibold">Produse grupate pe stiluri</h2>
                </div>
                <p className="max-w-xl text-white/70">
                  Alege o colectie si vezi modelele incluse, cu poze si detalii pentru fiecare produs.
                </p>
              </div>

              {loading && <p className="text-white/70">Se incarca colectiile...</p>}
              {error && <p className="rounded-md bg-red-50 p-4 text-red-700">{error}</p>}

              {!loading && !error && (
                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                  {collections.map((collection, index) => (
                    <button
                      className="group animate-card-in overflow-hidden rounded-lg border border-white/15 bg-white/8 text-left shadow-sm transition duration-500 hover:-translate-y-2 hover:border-[#d7b38d] hover:bg-white/12 hover:shadow-[0_24px_60px_rgba(0,0,0,0.28)]"
                      key={collection.id}
                      onClick={() => openCollection(collection.id)}
                      style={{ animationDelay: `${index * 80}ms` }}
                      type="button"
                    >
                      <div className="relative overflow-hidden">
                        <SlidingImages
                          alt={collection.title}
                          className="aspect-[16/10] w-full transition duration-700 group-hover:scale-105"
                          images={getImageSet(collection.image, collection.images)}
                          interval={3400 + index * 300}
                          showDots
                        />
                        <span className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/70 to-transparent" />
                        <span className="absolute bottom-4 right-4 grid size-10 place-items-center rounded-full bg-white text-[#211c16] shadow-lg transition duration-500 group-hover:translate-x-1">
                          <ArrowRight className="size-5" aria-hidden="true" />
                        </span>
                      </div>
                      <div className="p-5">
                        <div className="flex items-start justify-between gap-3">
                          <h3 className="text-xl font-semibold">{collection.title}</h3>
                          <span className="shrink-0 rounded-md bg-[#d7b38d] px-2.5 py-1 text-xs font-semibold text-[#211c16]">
                            {collection.products.length} produse
                          </span>
                        </div>
                        {collection.description && (
                          <p className="mt-3 line-clamp-2 text-sm leading-6 text-white/70">
                            {collection.description}
                          </p>
                        )}
                      </div>
                    </button>
                  ))}
                  {collections.length === 0 && <p className="text-white/70">Nu exista colectii active.</p>}
                </div>
              )}
            </div>
          </section>

          <section className="border-y border-[#ded7cb] bg-white px-5 py-14 sm:px-8" id="produse">
            <div className="mx-auto max-w-7xl">
              <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wide text-[#7a4d2b]">Catalog</p>
                  <h2 className="mt-2 text-3xl font-semibold">Produse disponibile</h2>
                </div>
                <p className="max-w-xl text-[#665d52]">
                  Adauga produsele in cos, completeaza adresa si plateste prin transfer bancar.
                </p>
              </div>

              {loading && <p className="text-[#665d52]">Se incarca produsele...</p>}
              {error && <p className="rounded-md bg-red-50 p-4 text-red-700">{error}</p>}

              {!loading && !error && (
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {products.map((product, index) => (
                    <button
                      className="product-tile group animate-card-in overflow-hidden rounded-lg border border-[#ded7cb] bg-[#fbfaf7] text-left shadow-sm transition duration-500 hover:-translate-y-2 hover:border-[#b99d7f] hover:shadow-[0_24px_60px_rgba(58,49,40,0.16)]"
                      key={product.id}
                      onClick={() => openProduct(product.id)}
                      style={{ animationDelay: `${index * 70}ms` }}
                      type="button"
                    >
                      <div className="relative overflow-hidden">
                        <SlidingImages
                          alt={product.title}
                          autoPlay={false}
                          className="aspect-[4/3] w-full transition duration-700 group-hover:scale-110"
                          imagePositions={product.imagePositions}
                          imageZooms={product.imageZooms}
                          images={getImageSet(product.image, product.images)}
                        />
                        <span className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/55 to-transparent opacity-70 transition duration-500 group-hover:opacity-90" />
                        <span className="absolute bottom-4 right-4 grid size-10 place-items-center rounded-full bg-white/90 text-[#211c16] shadow-lg transition duration-500 group-hover:translate-x-1">
                          <ArrowRight className="size-5" aria-hidden="true" />
                        </span>
                      </div>
                      <div className="p-5">
                        <h3 className="text-xl font-semibold transition duration-300 group-hover:text-[#7a4d2b]">
                          {product.title}
                        </h3>
                      </div>
                    </button>
                  ))}
                  {products.length === 0 && <p className="text-[#665d52]">Nu exista produse active.</p>}
                </div>
              )}
            </div>
          </section>
        </>
      )}

      {page === 'collection' && (
        <section className="animate-page-in mx-auto max-w-7xl px-5 py-10 sm:px-8">
          <button className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-[#665d52] transition hover:text-[#211c16]" onClick={() => setPage('home')} type="button">
            <ArrowLeft className="size-4" aria-hidden="true" />
            Inapoi la colectii
          </button>

          {selectedCollection ? (
            <div className="grid gap-8">
              <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
                <div className="animate-image-reveal overflow-hidden rounded-lg border border-[#ded7cb] bg-white shadow-[0_24px_70px_rgba(58,49,40,0.14)]">
                  <SlidingImages
                    alt={selectedCollection.title}
                    className="h-[340px] w-full lg:h-[520px]"
                    images={getImageSet(selectedCollection.image, selectedCollection.images)}
                    interval={3600}
                    showDots
                  />
                </div>
                <article className="animate-fade-up">
                  <p className="text-sm font-semibold uppercase tracking-wide text-[#7a4d2b]">
                    Colectie
                  </p>
                  <h1 className="mt-3 text-4xl font-semibold leading-tight tracking-normal sm:text-5xl">
                    {selectedCollection.title}
                  </h1>
                  {selectedCollection.description && (
                    <p className="mt-5 whitespace-pre-line text-lg leading-8 text-[#665d52]">
                      {selectedCollection.description}
                    </p>
                  )}
                  <p className="mt-5 rounded-md bg-white px-4 py-3 text-sm font-semibold text-[#665d52]">
                    {selectedCollection.products.length} produse in aceasta colectie
                  </p>
                </article>
              </div>

              <div>
                <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-wide text-[#7a4d2b]">
                      Produse incluse
                    </p>
                    <h2 className="mt-2 text-3xl font-semibold">Modele din colectie</h2>
                  </div>
                </div>
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {selectedCollection.products.map((product, index) => (
                    <button
                      className="product-tile group animate-card-in overflow-hidden rounded-lg border border-[#ded7cb] bg-[#fbfaf7] text-left shadow-sm transition duration-500 hover:-translate-y-2 hover:border-[#b99d7f] hover:shadow-[0_24px_60px_rgba(58,49,40,0.16)]"
                      key={product.id}
                      onClick={() => openProduct(product.id)}
                      style={{ animationDelay: `${index * 70}ms` }}
                      type="button"
                    >
                      <div className="relative overflow-hidden">
                        <SlidingImages
                          alt={product.title}
                          autoPlay={false}
                          className="aspect-[4/3] w-full transition duration-700 group-hover:scale-110"
                          imagePositions={product.imagePositions}
                          imageZooms={product.imageZooms}
                          images={getImageSet(product.image, product.images)}
                        />
                        <span className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/55 to-transparent opacity-70 transition duration-500 group-hover:opacity-90" />
                        <span className="absolute bottom-4 right-4 grid size-10 place-items-center rounded-full bg-white/90 text-[#211c16] shadow-lg transition duration-500 group-hover:translate-x-1">
                          <ArrowRight className="size-5" aria-hidden="true" />
                        </span>
                      </div>
                      <div className="p-5">
                        <h3 className="text-xl font-semibold transition duration-300 group-hover:text-[#7a4d2b]">
                          {product.title}
                        </h3>
                      </div>
                    </button>
                  ))}
                  {selectedCollection.products.length === 0 && (
                    <p className="rounded-md bg-white p-4 text-[#665d52]">
                      Nu exista produse active in aceasta colectie.
                    </p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-[#ded7cb] bg-white p-6">
              <h1 className="text-2xl font-semibold">Colectia nu a fost gasita.</h1>
              <button className="mt-4 rounded-md bg-[#211c16] px-4 py-3 font-semibold text-white" onClick={() => setPage('home')} type="button">
                Inapoi la colectii
              </button>
            </div>
          )}
        </section>
      )}

      {page === 'product' && (
        <section className="animate-page-in mx-auto max-w-7xl px-5 py-10 sm:px-8">
          <button className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-[#665d52] transition hover:text-[#211c16]" onClick={() => setPage('home')} type="button">
            <ArrowLeft className="size-4" aria-hidden="true" />
            Inapoi la produse
          </button>

          {selectedProduct ? (
            <>
              <div className="grid gap-8 lg:grid-cols-[1fr_0.9fr] lg:items-start">
                <div className="animate-image-reveal overflow-hidden rounded-lg border border-[#ded7cb] bg-white shadow-[0_24px_70px_rgba(58,49,40,0.14)]">
                  <SlidingImages
                    alt={selectedProduct.title}
                    autoPlay={false}
                    className="h-[520px] w-full bg-white sm:h-[620px] lg:h-[760px]"
                    fit="contain"
                    imagePositions={selectedProduct.imagePositions}
                    imageZooms={selectedProduct.imageZooms}
                    images={getImageSet(selectedProduct.image, selectedProduct.images)}
                    showControls
                    showDots
                  />
                </div>

                <article className="animate-fade-up rounded-lg border border-[#ded7cb] bg-white p-6 shadow-sm">
                  <div className="flex flex-col gap-4 border-b border-[#eee7dc] pb-5 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h1 className="text-4xl font-semibold leading-tight tracking-normal">
                        {selectedProduct.title}
                      </h1>
                      <p className="mt-3 text-2xl font-semibold text-[#7a4d2b]">
                        {selectedProduct.price}
                      </p>
                    </div>
                    <span className={`w-fit rounded-md px-3 py-2 text-sm font-semibold ${
                      selectedProduct.available
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-slate-200 text-slate-600'
                    }`}>
                      {selectedProduct.available ? 'Disponibil' : 'Indisponibil'}
                    </span>
                  </div>

                  <div className="mt-6">
                    <MobileExpandablePanel eyebrow="Detalii" title="Descriere produs">
                      <p className="whitespace-pre-line text-lg leading-8 text-[#665d52]">
                        {selectedProduct.description}
                      </p>
                    </MobileExpandablePanel>
                  </div>

                  {selectedProduct.available ? (
                    <button
                      className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-md bg-[#7a4d2b] px-5 py-4 font-semibold text-white shadow-lg transition duration-300 hover:-translate-y-1 hover:bg-[#633d21] hover:shadow-xl sm:w-auto"
                      onClick={() => addToCart(selectedProduct)}
                      type="button"
                    >
                      <Plus className="size-5" aria-hidden="true" />
                      Adauga in cos
                    </button>
                  ) : (
                    <p className="mt-8 rounded-md bg-slate-100 px-5 py-4 font-semibold text-slate-600">
                      Acest produs este indisponibil si nu poate fi adaugat in cos.
                    </p>
                  )}
                </article>
              </div>
              <ProductWallCalculator
                onAddQuantity={addQuantityToCart}
                product={selectedProduct}
              />
              <ProductRiflajeComparison product={selectedProduct} />
            </>
          ) : (
            <div className="rounded-lg border border-[#ded7cb] bg-white p-6">
              <h1 className="text-2xl font-semibold">Produsul nu a fost gasit.</h1>
              <button className="mt-4 rounded-md bg-[#211c16] px-4 py-3 font-semibold text-white" onClick={() => setPage('home')} type="button">
                Inapoi la produse
              </button>
            </div>
          )}
        </section>
      )}

      {page === 'cart' && (
        <section className="animate-page-in mx-auto max-w-5xl px-5 py-10 sm:px-8">
          <button className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-[#665d52]" onClick={() => setPage('home')} type="button">
            <ArrowLeft className="size-4" aria-hidden="true" />
            Inapoi la produse
          </button>
          <div className="rounded-lg border border-[#ded7cb] bg-white p-5">
            <h1 className="text-3xl font-semibold">Cosul tau</h1>
            {cartItems.length === 0 ? (
              <p className="mt-4 text-[#665d52]">Cosul este gol.</p>
            ) : (
              <div className="mt-6 grid gap-4">
                {cartItems.map((item) => (
                  <div className="grid gap-4 border-b border-[#eee7dc] pb-4 last:border-b-0 md:grid-cols-[96px_1fr_auto]" key={item.product.id}>
                    <img alt={item.product.title} className="size-24 rounded-md object-cover" src={item.product.image} />
                    <div>
                      <h2 className="font-semibold">{item.product.title}</h2>
                      <p className="mt-1 text-sm text-[#665d52]">{item.product.price}</p>
                      {!item.product.available && <p className="mt-2 text-sm font-semibold text-red-700">Indisponibil</p>}
                    </div>
                    <div className="flex items-center gap-3 md:justify-end">
                      <button className="grid size-9 place-items-center rounded-md border border-[#cfc6b7]" onClick={() => updateQuantity(item.product.id, item.quantity - 1)} type="button">
                        <Minus className="size-4" aria-hidden="true" />
                      </button>
                      <input className="h-9 w-16 rounded-md border border-[#cfc6b7] text-center" min={1} onChange={(event) => updateQuantity(item.product.id, Number(event.target.value))} type="number" value={item.quantity} />
                      <button className="grid size-9 place-items-center rounded-md border border-[#cfc6b7]" onClick={() => updateQuantity(item.product.id, item.quantity + 1)} type="button">
                        <Plus className="size-4" aria-hidden="true" />
                      </button>
                      <p className="w-28 text-right font-semibold">{formatLei(item.subtotalCents)}</p>
                      <button className="grid size-9 place-items-center rounded-md border border-red-200 text-red-700" onClick={() => removeFromCart(item.product.id)} type="button">
                        <Trash2 className="size-4" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                ))}
                <div className="ml-auto w-full max-w-sm rounded-md bg-[#f6f4ef] p-4">
                  <div className="flex justify-between">
                    <span>Subtotal produse</span>
                    <strong>{formatLei(subtotalCents)}</strong>
                  </div>
                  <button className="mt-4 w-full rounded-md bg-[#211c16] px-4 py-3 font-semibold text-white" onClick={() => setPage('checkout')} type="button">
                    Continua catre comanda
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {page === 'checkout' && (
        <section className="animate-page-in mx-auto grid max-w-7xl gap-6 px-5 py-10 sm:px-8 lg:grid-cols-[1fr_380px]">
          <form className="rounded-lg border border-[#ded7cb] bg-white p-5" onSubmit={submitOrder}>
            <button className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-[#665d52]" onClick={() => setPage('cart')} type="button">
              <ArrowLeft className="size-4" aria-hidden="true" />
              Inapoi la cos
            </button>
            <h1 className="text-3xl font-semibold">Finalizare comanda</h1>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {[
                ['fullName', 'Nume complet *'],
                ['phone', 'Telefon *'],
                ['county', 'Judet *'],
                ['locality', 'Localitate *'],
                ['address', 'Adresa completa *'],
                ['postalCode', 'Cod postal'],
              ].map(([field, label]) => (
                <label className={field === 'address' ? 'sm:col-span-2' : ''} key={field}>
                  <span className="text-sm font-medium text-[#665d52]">{label}</span>
                  <input className="mt-2 w-full rounded-md border border-[#cfc6b7] px-3 py-2 outline-none focus:border-[#7a4d2b]" onChange={(event) => setForm({ ...form, [field]: event.target.value })} value={form[field as keyof CheckoutForm]} />
                </label>
              ))}
              <label className="sm:col-span-2">
                <span className="text-sm font-medium text-[#665d52]">Observatii</span>
                <textarea className="mt-2 min-h-28 w-full rounded-md border border-[#cfc6b7] px-3 py-2 outline-none focus:border-[#7a4d2b]" onChange={(event) => setForm({ ...form, notes: event.target.value })} value={form.notes} />
              </label>
            </div>
            {checkoutError && <p className="mt-4 rounded-md bg-red-50 p-3 text-red-700">{checkoutError}</p>}
            <button className="mt-6 w-full rounded-md bg-[#7a4d2b] px-4 py-3 font-semibold text-white" type="submit">
              Plaseaza comanda
            </button>
          </form>

          <aside className="h-fit rounded-lg border border-[#ded7cb] bg-white p-5">
            <h2 className="text-xl font-semibold">Sumar comanda</h2>
            <div className="mt-4 grid gap-3">
              {cartItems.map((item) => (
                <div className="flex justify-between gap-3 text-sm" key={item.product.id}>
                  <span>{item.product.title} x {item.quantity}</span>
                  <strong>{formatLei(item.subtotalCents)}</strong>
                </div>
              ))}
            </div>
            <div className="mt-5 grid gap-2 border-t border-[#eee7dc] pt-4">
              <div className="flex justify-between"><span>Subtotal</span><strong>{formatLei(subtotalCents)}</strong></div>
              <div className="flex justify-between"><span>Livrare</span><strong>{formatLei(shippingCents)}</strong></div>
              <div className="flex justify-between text-lg"><span>Total de plata</span><strong>{formatLei(totalCents)}</strong></div>
            </div>
            <p className="mt-4 rounded-md bg-[#f6f4ef] p-3 text-sm text-[#665d52]">
              {isIasi(form.locality)
                ? settings?.freeShippingMessage || 'Livrare gratuita in Iasi.'
                : `Livrare ${shippingCostPerItem} lei pentru fiecare bucata comandata.`}
            </p>
          </aside>
        </section>
      )}

      {page === 'confirmation' && confirmation && (
        <section className="animate-page-in mx-auto max-w-5xl px-5 py-10 sm:px-8">
          <div className="rounded-lg border border-[#ded7cb] bg-white p-6">
            <CheckCircle2 className="size-10 text-emerald-600" aria-hidden="true" />
            <h1 className="mt-4 text-3xl font-semibold">Multumim pentru comanda.</h1>
            <p className="mt-2 text-[#665d52]">Comanda #{confirmation.order.orderNumber} este in asteptarea platii.</p>
            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              <div>
                <h2 className="font-semibold">Produse comandate</h2>
                <div className="mt-3 grid gap-2">
                  {confirmation.order.items.map((item) => (
                    <div className="flex justify-between gap-3 text-sm" key={item.productId}>
                      <span>{item.title} x {item.quantity}</span>
                      <strong>{item.subtotal}</strong>
                    </div>
                  ))}
                </div>
                <div className="mt-4 grid gap-1 border-t border-[#eee7dc] pt-4">
                  <div className="flex justify-between"><span>Subtotal</span><strong>{confirmation.order.subtotal}</strong></div>
                  <div className="flex justify-between"><span>Livrare</span><strong>{confirmation.order.shipping}</strong></div>
                  <div className="flex justify-between text-lg"><span>Total</span><strong>{confirmation.order.total}</strong></div>
                </div>
              </div>
              <div>
                <h2 className="font-semibold">Transfer bancar</h2>
                <div className="mt-3 grid gap-2 text-sm text-[#665d52]">
                  <p>Beneficiar: <strong className="text-[#211c16]">{confirmation.bank.bankBeneficiary}</strong></p>
                  <p>Banca: <strong className="text-[#211c16]">{confirmation.bank.bankName}</strong></p>
                  <p>IBAN: <strong className="text-[#211c16]">{confirmation.bank.bankIban}</strong></p>
                  <p>Suma: <strong className="text-[#211c16]">{confirmation.order.total}</strong></p>
                  <p>Explicatia platii: <strong className="text-[#211c16]">Comanda #{confirmation.order.orderNumber}</strong></p>
                  <p>{confirmation.bank.bankInstructions}</p>
                </div>
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  <button className="inline-flex items-center justify-center gap-2 rounded-md border border-[#cfc6b7] px-3 py-2 font-semibold" onClick={() => copyText(confirmation.bank.bankIban)} type="button">
                    <Clipboard className="size-4" aria-hidden="true" />
                    Copiaza IBAN-ul
                  </button>
                  <button className="inline-flex items-center justify-center gap-2 rounded-md border border-[#cfc6b7] px-3 py-2 font-semibold" onClick={() => copyText(confirmation.order.total)} type="button">
                    <Clipboard className="size-4" aria-hidden="true" />
                    Copiaza suma
                  </button>
                </div>
                <p className="mt-4 rounded-md bg-[#f6f4ef] p-3 text-sm font-semibold">
                  Comanda va fi procesata dupa confirmarea transferului bancar.
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="px-5 py-14 sm:px-8" id="contact">
        <div className="mx-auto grid max-w-7xl gap-6 rounded-lg bg-[#211c16] p-6 text-white sm:p-8 md:grid-cols-2 md:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-[#d7b38d]">Contact</p>
            <h2 className="mt-2 text-3xl font-semibold">Trimite o intrebare sau o comanda.</h2>
          </div>
          <div className="grid gap-3">
            <a className="flex items-center gap-3 text-white/85" href={`mailto:${settings?.email || ''}`}>
              <Mail className="size-5" aria-hidden="true" />
              {settings?.email || 'Email neconfigurat'}
            </a>
            <a className="flex items-center gap-3 text-white/85" href={`tel:${settings?.phone || ''}`}>
              <Phone className="size-5" aria-hidden="true" />
              {settings?.phone || 'Telefon neconfigurat'}
            </a>
          </div>
        </div>
      </section>
    </main>
  )
}

export default App
