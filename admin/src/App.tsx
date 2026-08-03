import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  CheckCircle2,
  Image,
  LogOut,
  Pencil,
  Plus,
  Save,
  Search,
  Trash2,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'

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

type ProductForm = Omit<Product, 'id'>

type Collection = {
  id: string
  title: string
  description: string
  image: string
  images: string[]
  productIds: string[]
  active: boolean
}

type CollectionForm = Omit<Collection, 'id'>

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

type Order = {
  id: string
  orderNumber: string
  createdAt: string
  customer: {
    fullName: string
    phone: string
    county: string
    locality: string
    address: string
    postalCode: string
    notes: string
  }
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
  totalCents: number
  paymentMethod: string
  paymentStatus: string
  orderStatus: string
  internalNotes: string
}

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000'
const emptyProduct: ProductForm = {
  title: '',
  price: '',
  description: '',
  image: '',
  images: [],
  imageZooms: [],
  imagePositions: [],
  riflajeImages: [],
  noRiflajeImages: [],
  panelWidthMm: 0,
  panelLengthMm: 0,
  available: true,
  active: true,
}
const emptyCollection: CollectionForm = {
  title: '',
  description: '',
  image: '',
  images: [],
  productIds: [],
  active: true,
}
const emptySettings: Settings = {
  siteTitle: '',
  siteUrl: '',
  logo: '',
  showSiteTitle: true,
  heroTitle: '',
  heroDescription: '',
  heroImage: '',
  heroImages: [],
  email: '',
  phone: '',
  whatsapp: '',
  bankBeneficiary: '',
  bankIban: '',
  bankName: '',
  bankInstructions: '',
  freeShippingMessage: '',
  shippingCostPerItem: 10,
  seoTitle: '',
  seoDescription: '',
  seoImage: '',
}
const paymentStatuses = ['In asteptarea platii', 'Platita', 'Anulata']
const orderStatuses = [
  'Comanda noua',
  'In procesare',
  'Pregatita',
  'Expediata',
  'Finalizata',
  'Anulata',
]

function formatLei(cents: number) {
  return new Intl.NumberFormat('ro-RO', {
    style: 'currency',
    currency: 'RON',
  }).format(cents / 100)
}

function normalizeImages(images: string[] | undefined, fallback = '') {
  return [
    ...new Set(
      [fallback, ...(images || [])]
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  ]
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

function normalizeSettings(settings: Partial<Settings>): Settings {
  return {
    ...emptySettings,
    ...settings,
    heroImages: normalizeImages(settings.heroImages, settings.heroImage),
    heroImage: normalizeImages(settings.heroImages, settings.heroImage)[0] || '',
  }
}

function splitPastedImages(value: string) {
  return value
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean)
}

function ImageListEditor({
  title,
  help,
  images,
  aspect = 'square',
  onChange,
  zooms,
  onZoomsChange,
  positions,
  onPositionsChange,
  onStatus,
}: {
  title: string
  help: string
  images: string[]
  aspect?: 'square' | 'video' | 'product'
  onChange: (images: string[]) => void
  zooms?: number[]
  onZoomsChange?: (zooms: number[]) => void
  positions?: ImagePosition[]
  onPositionsChange?: (positions: ImagePosition[]) => void
  onStatus?: (message: string) => void
}) {
  const [newImage, setNewImage] = useState('')
  const canEditFrame = Boolean(zooms && onZoomsChange && positions && onPositionsChange)

  function updateImages(nextImages: string[], nextZooms = zooms, nextPositions = positions) {
    const normalizedImages = normalizeImages(nextImages)
    onChange(normalizedImages)

    if (onZoomsChange) {
      onZoomsChange(normalizeZooms(nextZooms, normalizedImages.length))
    }

    if (onPositionsChange) {
      onPositionsChange(normalizePositions(nextPositions, normalizedImages.length))
    }
  }

  function addImage() {
    const nextImages = splitPastedImages(newImage)

    if (!nextImages.length) {
      return
    }

    updateImages(
      [...images, ...nextImages],
      [...(zooms || []), ...nextImages.map(() => 100)],
      [...(positions || []), ...nextImages.map(() => ({ x: 50, y: 50 }))],
    )
    setNewImage('')
    onStatus?.('Poza adaugata.')
  }

  function updateImage(index: number, value: string) {
    const nextImages = [...images]
    nextImages[index] = value
    updateImages(nextImages)
    onStatus?.('URL poza actualizat.')
  }

  function removeImage(index: number) {
    updateImages(
      images.filter((_, imageIndex) => imageIndex !== index),
      (zooms || []).filter((_, zoomIndex) => zoomIndex !== index),
      (positions || []).filter((_, positionIndex) => positionIndex !== index),
    )
    onStatus?.('Poza stearsa.')
  }

  function moveImage(index: number, direction: -1 | 1) {
    const nextIndex = index + direction

    if (nextIndex < 0 || nextIndex >= images.length) {
      return
    }

    const nextImages = [...images]
    const [image] = nextImages.splice(index, 1)
    nextImages.splice(nextIndex, 0, image)

    const nextZooms = normalizeZooms(zooms, images.length)
    const [zoom] = nextZooms.splice(index, 1)
    nextZooms.splice(nextIndex, 0, zoom)

    const nextPositions = normalizePositions(positions, images.length)
    const [position] = nextPositions.splice(index, 1)
    nextPositions.splice(nextIndex, 0, position)
    updateImages(nextImages, nextZooms, nextPositions)
    onStatus?.('Poza mutata.')
  }

  function updateZoom(index: number, zoom: number) {
    if (!onZoomsChange) return

    const nextZooms = normalizeZooms(zooms, images.length)
    nextZooms[index] = Math.min(220, Math.max(40, Math.round(zoom)))
    onZoomsChange(nextZooms)
    onStatus?.('Incadrare selectata. Apasa Salveaza produsul ca sa ramana salvata.')
  }

  function updatePosition(index: number, nextPosition: Partial<ImagePosition>) {
    if (!onPositionsChange) return

    const nextPositions = normalizePositions(positions, images.length)
    nextPositions[index] = normalizePositions(
      [{ ...nextPositions[index], ...nextPosition }],
      1,
    )[0]
    onPositionsChange(nextPositions)
    onStatus?.('Incadrare selectata. Apasa Salveaza produsul ca sa ramana salvata.')
  }

  function nudgePosition(index: number, axis: 'x' | 'y', amount: number) {
    const currentPosition = normalizePositions(positions, images.length)[index]
    updatePosition(index, { [axis]: currentPosition[axis] + amount })
  }

  function resetFrame(index: number) {
    if (!onZoomsChange || !onPositionsChange) return

    const nextZooms = normalizeZooms(zooms, images.length)
    nextZooms[index] = 100
    onZoomsChange(nextZooms)

    const nextPositions = normalizePositions(positions, images.length)
    nextPositions[index] = { x: 50, y: 50 }
    onPositionsChange(nextPositions)
    onStatus?.('Incadrare resetata. Apasa Salveaza produsul ca sa ramana salvata.')
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-md bg-white text-slate-700 shadow-sm">
          <Image className="size-5" aria-hidden="true" />
        </span>
        <div>
          <h3 className="font-semibold text-slate-950">{title}</h3>
          <p className="mt-1 text-sm leading-6 text-slate-500">{help}</p>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <input
          className="min-w-0 flex-1 rounded-md border border-slate-300 bg-white px-3 py-2 outline-none focus:border-slate-900"
          onChange={(event) => setNewImage(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              addImage()
            }
          }}
          placeholder="Lipeste URL poza. Poti lipi si mai multe, pe linii separate."
          value={newImage}
        />
        <button
          className="inline-flex items-center justify-center gap-2 rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white"
          onClick={addImage}
          type="button"
        >
          <Plus className="size-4" aria-hidden="true" />
          Adauga poza
        </button>
      </div>

      {images.length > 0 ? (
        <div className="mt-4 grid gap-3">
          {images.map((image, index) => (
            <div
              className="grid gap-3 rounded-md border border-slate-200 bg-white p-3 md:grid-cols-[112px_1fr_auto]"
              key={`${image}-${index}`}
            >
              <div
                className={`w-full overflow-hidden rounded-md bg-slate-100 md:w-28 ${
                  aspect === 'video'
                    ? 'aspect-video'
                    : aspect === 'product'
                      ? 'aspect-[4/3]'
                      : 'aspect-square'
                }`}
              >
                <img
                  alt=""
                  className="h-full w-full object-cover"
                  src={image}
                  style={{
                    objectPosition: canEditFrame
                      ? `${normalizePositions(positions, images.length)[index].x}% ${normalizePositions(positions, images.length)[index].y}%`
                      : undefined,
                    transform: canEditFrame ? `scale(${normalizeZooms(zooms, images.length)[index] / 100})` : undefined,
                    transformOrigin: canEditFrame
                      ? `${normalizePositions(positions, images.length)[index].x}% ${normalizePositions(positions, images.length)[index].y}%`
                      : undefined,
                  }}
                />
              </div>
              <div className="min-w-0">
                <div className="mb-2 flex flex-wrap gap-2">
                  {index === 0 && (
                    <span className="rounded-md bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">
                      Poza principala
                    </span>
                  )}
                  <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-500">
                    #{index + 1}
                  </span>
                </div>
                <input
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
                  onChange={(event) => updateImage(index, event.target.value)}
                  value={image}
                />
                {canEditFrame && (
                  <div className="mt-3 grid gap-3 rounded-md border border-slate-200 bg-slate-50 p-3">
                    <label className="block text-xs font-semibold text-slate-500">
                      Zoom poza: {normalizeZooms(zooms, images.length)[index]}%
                      <div className="mt-2 flex items-center gap-3">
                        <input
                          className="min-w-0 flex-1 accent-slate-950"
                          max={220}
                          min={40}
                          onChange={(event) => updateZoom(index, Number(event.target.value))}
                          step={5}
                          type="range"
                          value={normalizeZooms(zooms, images.length)[index]}
                        />
                        <input
                          className="w-20 rounded-md border border-slate-300 px-2 py-1 text-right text-xs"
                          max={220}
                          min={40}
                          onChange={(event) => updateZoom(index, Number(event.target.value))}
                          type="number"
                          value={normalizeZooms(zooms, images.length)[index]}
                        />
                      </div>
                    </label>

                    <div className="grid gap-3 md:grid-cols-[120px_1fr] md:items-center">
                      <div className="grid grid-cols-3 gap-1">
                        <span />
                        <button
                          aria-label="Muta poza in sus"
                          className="grid size-9 place-items-center rounded-md border border-slate-300 bg-white text-slate-700"
                          onClick={() => nudgePosition(index, 'y', -5)}
                          type="button"
                        >
                          <ArrowUp className="size-4" aria-hidden="true" />
                        </button>
                        <span />
                        <button
                          aria-label="Muta poza la stanga"
                          className="grid size-9 place-items-center rounded-md border border-slate-300 bg-white text-slate-700"
                          onClick={() => nudgePosition(index, 'x', -5)}
                          type="button"
                        >
                          <ArrowLeft className="size-4" aria-hidden="true" />
                        </button>
                        <button
                          className="rounded-md border border-slate-300 bg-white px-2 text-xs font-semibold text-slate-700"
                          onClick={() => resetFrame(index)}
                          type="button"
                        >
                          Reset
                        </button>
                        <button
                          aria-label="Muta poza la dreapta"
                          className="grid size-9 place-items-center rounded-md border border-slate-300 bg-white text-slate-700"
                          onClick={() => nudgePosition(index, 'x', 5)}
                          type="button"
                        >
                          <ArrowRight className="size-4" aria-hidden="true" />
                        </button>
                        <span />
                        <button
                          aria-label="Muta poza in jos"
                          className="grid size-9 place-items-center rounded-md border border-slate-300 bg-white text-slate-700"
                          onClick={() => nudgePosition(index, 'y', 5)}
                          type="button"
                        >
                          <ArrowDown className="size-4" aria-hidden="true" />
                        </button>
                      </div>
                      <div className="grid gap-2">
                        <label className="text-xs font-semibold text-slate-500">
                          Stanga / dreapta: {normalizePositions(positions, images.length)[index].x}%
                          <input
                            className="mt-1 w-full accent-slate-950"
                            max={100}
                            min={0}
                            onChange={(event) => updatePosition(index, { x: Number(event.target.value) })}
                            type="range"
                            value={normalizePositions(positions, images.length)[index].x}
                          />
                        </label>
                        <label className="text-xs font-semibold text-slate-500">
                          Sus / jos: {normalizePositions(positions, images.length)[index].y}%
                          <input
                            className="mt-1 w-full accent-slate-950"
                            max={100}
                            min={0}
                            onChange={(event) => updatePosition(index, { y: Number(event.target.value) })}
                            type="range"
                            value={normalizePositions(positions, images.length)[index].y}
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex gap-2 md:flex-col">
                <button
                  aria-label="Muta poza mai sus"
                  className="grid size-9 place-items-center rounded-md border border-slate-300 text-slate-700 disabled:opacity-35"
                  disabled={index === 0}
                  onClick={() => moveImage(index, -1)}
                  type="button"
                >
                  <ArrowUp className="size-4" aria-hidden="true" />
                </button>
                <button
                  aria-label="Muta poza mai jos"
                  className="grid size-9 place-items-center rounded-md border border-slate-300 text-slate-700 disabled:opacity-35"
                  disabled={index === images.length - 1}
                  onClick={() => moveImage(index, 1)}
                  type="button"
                >
                  <ArrowDown className="size-4" aria-hidden="true" />
                </button>
                <button
                  aria-label="Sterge poza"
                  className="grid size-9 place-items-center rounded-md border border-red-200 text-red-700"
                  onClick={() => removeImage(index)}
                  type="button"
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-4 rounded-md border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-500">
          Nu ai adaugat poze inca.
        </p>
      )}
    </section>
  )
}

function App() {
  const [authenticated, setAuthenticated] = useState(false)
  const [authChecked, setAuthChecked] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [tab, setTab] = useState<
    'dashboard' | 'orders' | 'products' | 'collections' | 'settings'
  >('dashboard')
  const [products, setProducts] = useState<Product[]>([])
  const [collections, setCollections] = useState<Collection[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [settings, setSettings] = useState<Settings>(emptySettings)
  const [productForm, setProductForm] = useState<ProductForm>(emptyProduct)
  const [collectionForm, setCollectionForm] = useState<CollectionForm>(emptyCollection)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingCollectionId, setEditingCollectionId] = useState<string | null>(null)
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [paymentFilter, setPaymentFilter] = useState('')
  const [orderFilter, setOrderFilter] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function apiRequest(path: string, options: RequestInit = {}) {
    const response = await fetch(`${apiUrl}${path}`, {
      ...options,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    if (!response.ok) {
      const data = await response.json().catch(() => ({}))
      throw new Error(data.message || 'Cererea a esuat.')
    }

    if (response.status === 204) {
      return null
    }

    return response.json()
  }

  async function loadData() {
    const [nextProducts, nextCollections, nextOrders, nextSettings] = await Promise.all([
      apiRequest('/api/admin/products'),
      apiRequest('/api/admin/collections'),
      apiRequest('/api/admin/orders'),
      apiRequest('/api/admin/settings'),
    ])

    setProducts(
      nextProducts.map((product: Product) => ({
        ...product,
        images: normalizeImages(product.images, product.image),
        image: normalizeImages(product.images, product.image)[0] || product.image,
        imageZooms: normalizeZooms(product.imageZooms, normalizeImages(product.images, product.image).length),
        imagePositions: normalizePositions(product.imagePositions, normalizeImages(product.images, product.image).length),
        riflajeImages: normalizeImages(product.riflajeImages),
        noRiflajeImages: normalizeImages(product.noRiflajeImages),
        panelWidthMm: Number(product.panelWidthMm || 0),
        panelLengthMm: Number(product.panelLengthMm || 0),
      })),
    )
    setCollections(
      nextCollections.map((collection: Collection) => ({
        ...collection,
        images: normalizeImages(collection.images, collection.image),
        image: normalizeImages(collection.images, collection.image)[0] || collection.image,
        productIds: Array.isArray(collection.productIds) ? collection.productIds : [],
      })),
    )
    setOrders(nextOrders)
    setSettings(normalizeSettings(nextSettings))
  }

  useEffect(() => {
    apiRequest('/api/admin/me')
      .then(() => {
        setAuthenticated(true)
        return loadData()
      })
      .catch(() => setAuthenticated(false))
      .finally(() => setAuthChecked(true))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const filteredOrders = useMemo(() => {
    const needle = search.toLowerCase().trim()

    return orders.filter((order) => {
      const matchesSearch =
        !needle ||
        `${order.orderNumber} ${order.customer.fullName} ${order.customer.phone}`
          .toLowerCase()
          .includes(needle)
      const matchesPayment = !paymentFilter || order.paymentStatus === paymentFilter
      const matchesOrder = !orderFilter || order.orderStatus === orderFilter

      return matchesSearch && matchesPayment && matchesOrder
    })
  }, [orders, orderFilter, paymentFilter, search])
  const selectedOrder = orders.find((order) => order.id === selectedOrderId) || filteredOrders[0]
  const dashboard = useMemo(
    () => ({
      newOrders: orders.filter((order) => order.orderStatus === 'Comanda noua').length,
      waitingPayment: orders.filter((order) => order.paymentStatus === 'In asteptarea platii').length,
      totalOrders: orders.length,
      paidValue: orders
        .filter((order) => order.paymentStatus === 'Platita')
        .reduce((sum, order) => sum + (order.totalCents || 0), 0),
    }),
    [orders],
  )

  async function handleLogin(event: FormEvent) {
    event.preventDefault()
    setError('')

    try {
      await apiRequest('/api/admin/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      })
      setAuthenticated(true)
      setPassword('')
      await loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login esuat.')
    }
  }

  async function logout() {
    await apiRequest('/api/admin/logout', { method: 'POST' }).catch(() => null)
    setAuthenticated(false)
  }

  async function handleSaveProduct(event: FormEvent) {
    event.preventDefault()
    setError('')
    setMessage('')

    try {
      if (editingId) {
        await apiRequest(`/api/admin/products/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify(productForm),
        })
        setMessage('Produs actualizat.')
      } else {
        await apiRequest('/api/admin/products', {
          method: 'POST',
          body: JSON.stringify(productForm),
        })
        setMessage('Produs adaugat.')
      }

      setProductForm(emptyProduct)
      setEditingId(null)
      await loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Produsul nu a fost salvat.')
    }
  }

  async function handleDeleteProduct(id: string) {
    setError('')
    setMessage('')

    try {
      await apiRequest(`/api/admin/products/${id}`, { method: 'DELETE' })
      setMessage('Produs sters.')
      await loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Produsul nu a fost sters.')
    }
  }

  async function handleSaveCollection(event: FormEvent) {
    event.preventDefault()
    setError('')
    setMessage('')

    try {
      if (editingCollectionId) {
        await apiRequest(`/api/admin/collections/${editingCollectionId}`, {
          method: 'PUT',
          body: JSON.stringify(collectionForm),
        })
        setMessage('Colectie actualizata.')
      } else {
        await apiRequest('/api/admin/collections', {
          method: 'POST',
          body: JSON.stringify(collectionForm),
        })
        setMessage('Colectie adaugata.')
      }

      setCollectionForm(emptyCollection)
      setEditingCollectionId(null)
      await loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Colectia nu a fost salvata.')
    }
  }

  async function handleDeleteCollection(id: string) {
    setError('')
    setMessage('')

    try {
      await apiRequest(`/api/admin/collections/${id}`, { method: 'DELETE' })
      setMessage('Colectie stearsa.')
      await loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Colectia nu a fost stearsa.')
    }
  }

  async function handleSaveSettings(event: FormEvent) {
    event.preventDefault()
    setError('')
    setMessage('')

    try {
      await apiRequest('/api/admin/settings', {
        method: 'PUT',
        body: JSON.stringify(settings),
      })
      setMessage('Setari salvate.')
      await loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Setarile nu au fost salvate.')
    }
  }

  async function updateOrder(order: Order, data: Partial<Order>) {
    setError('')
    setMessage('')

    try {
      if (data.orderStatus) {
        await apiRequest(`/api/admin/orders/${order.id}/status`, {
          method: 'PUT',
          body: JSON.stringify({
            orderStatus: data.orderStatus,
            internalNotes: data.internalNotes ?? order.internalNotes,
          }),
        })
      }

      if (data.paymentStatus) {
        await apiRequest(`/api/admin/orders/${order.id}/payment-status`, {
          method: 'PUT',
          body: JSON.stringify({
            paymentStatus: data.paymentStatus,
            internalNotes: data.internalNotes ?? order.internalNotes,
          }),
        })
      }

      if (data.internalNotes !== undefined && !data.orderStatus && !data.paymentStatus) {
        await apiRequest(`/api/admin/orders/${order.id}/status`, {
          method: 'PUT',
          body: JSON.stringify({
            orderStatus: order.orderStatus,
            internalNotes: data.internalNotes,
          }),
        })
      }

      setMessage('Comanda actualizata.')
      await loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Comanda nu a fost actualizata.')
    }
  }

  function editProduct(product: Product) {
    const images = normalizeImages(product.images, product.image)
    setError('')
    setMessage('Produs selectat pentru editare.')
    setEditingId(product.id)
    setProductForm({
      title: product.title,
      price: product.price,
      description: product.description,
      image: images[0] || '',
      images,
      imageZooms: normalizeZooms(product.imageZooms, images.length),
      imagePositions: normalizePositions(product.imagePositions, images.length),
      riflajeImages: normalizeImages(product.riflajeImages),
      noRiflajeImages: normalizeImages(product.noRiflajeImages),
      panelWidthMm: Number(product.panelWidthMm || 0),
      panelLengthMm: Number(product.panelLengthMm || 0),
      available: product.available,
      active: product.active,
    })
    setTab('products')
  }

  function editCollection(collection: Collection) {
    const images = normalizeImages(collection.images, collection.image)
    setError('')
    setMessage('Colectie selectata pentru editare.')
    setEditingCollectionId(collection.id)
    setCollectionForm({
      title: collection.title,
      description: collection.description,
      image: images[0] || '',
      images,
      productIds: collection.productIds,
      active: collection.active,
    })
    setTab('collections')
  }

  function toggleCollectionProduct(productId: string) {
    setCollectionForm((current) => {
      const exists = current.productIds.includes(productId)

      return {
        ...current,
        productIds: exists
          ? current.productIds.filter((id) => id !== productId)
          : [...current.productIds, productId],
      }
    })
  }

  if (!authChecked) {
    return <main className="grid min-h-screen place-items-center bg-[#f5f6f8]">Se incarca...</main>
  }

  if (!authenticated) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#f5f6f8] px-5">
        <form className="w-full max-w-sm rounded-lg border border-slate-200 bg-white p-6 shadow-sm" onSubmit={handleLogin}>
          <h1 className="text-2xl font-semibold text-slate-950">Admin riflaje</h1>
          <p className="mt-2 text-sm text-slate-500">Autentificare securizata cu sesiune httpOnly.</p>
          <label className="mt-6 block text-sm font-medium text-slate-700">
            User
            <input className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-slate-900" onChange={(event) => setUsername(event.target.value)} value={username} />
          </label>
          <label className="mt-4 block text-sm font-medium text-slate-700">
            Parola
            <input className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-slate-900" onChange={(event) => setPassword(event.target.value)} type="password" value={password} />
          </label>
          {error && <p className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          <button className="mt-6 w-full rounded-md bg-slate-950 px-4 py-3 font-semibold text-white">Intra in admin</button>
        </form>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#f5f6f8] text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-4 sm:px-8 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-xl font-semibold">Dashboard admin</h1>
            <p className="text-sm text-slate-500">Produse, comenzi, plati si setari</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              ['dashboard', 'Dashboard'],
              ['orders', 'Comenzi'],
              ['products', 'Produse'],
              ['collections', 'Colectii'],
              ['settings', 'Setari'],
            ].map(([key, label]) => (
              <button className={`rounded-md px-3 py-2 text-sm font-semibold ${tab === key ? 'bg-slate-950 text-white' : 'border border-slate-300 bg-white'}`} key={key} onClick={() => setTab(key as typeof tab)} type="button">
                {label}
              </button>
            ))}
            <button className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold" onClick={logout} type="button">
              <LogOut className="size-4" aria-hidden="true" />
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-6 sm:px-8">
        {message && <p className="mb-4 rounded-md bg-emerald-50 p-3 text-sm text-emerald-700">{message}</p>}
        {error && <p className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}

        {tab === 'dashboard' && (
          <section className="grid gap-4 md:grid-cols-4">
            {[
              ['Comenzi noi', dashboard.newOrders],
              ['Asteapta plata', dashboard.waitingPayment],
              ['Total comenzi', dashboard.totalOrders],
              ['Valoare platita', formatLei(dashboard.paidValue)],
            ].map(([label, value]) => (
              <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm" key={label}>
                <p className="text-sm text-slate-500">{label}</p>
                <p className="mt-2 text-3xl font-semibold">{value}</p>
              </div>
            ))}
          </section>
        )}

        {tab === 'orders' && (
          <section className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
            <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
              <div className="grid gap-3 border-b border-slate-200 p-4">
                <label className="relative">
                  <Search className="absolute left-3 top-3 size-4 text-slate-400" aria-hidden="true" />
                  <input className="w-full rounded-md border border-slate-300 py-2 pl-9 pr-3 outline-none focus:border-slate-900" onChange={(event) => setSearch(event.target.value)} placeholder="Cauta numar, nume sau telefon" value={search} />
                </label>
                <div className="grid gap-3 sm:grid-cols-2">
                  <select className="rounded-md border border-slate-300 px-3 py-2" onChange={(event) => setPaymentFilter(event.target.value)} value={paymentFilter}>
                    <option value="">Toate platile</option>
                    {paymentStatuses.map((status) => <option key={status}>{status}</option>)}
                  </select>
                  <select className="rounded-md border border-slate-300 px-3 py-2" onChange={(event) => setOrderFilter(event.target.value)} value={orderFilter}>
                    <option value="">Toate statusurile</option>
                    {orderStatuses.map((status) => <option key={status}>{status}</option>)}
                  </select>
                </div>
              </div>
              <div className="max-h-[720px] overflow-auto">
                {filteredOrders.map((order) => (
                  <button className={`block w-full border-b border-slate-200 p-4 text-left last:border-b-0 ${selectedOrder?.id === order.id ? 'bg-slate-50' : ''}`} key={order.id} onClick={() => setSelectedOrderId(order.id)} type="button">
                    <div className="flex items-center justify-between gap-3">
                      <strong>{order.orderNumber}</strong>
                      <span className="text-sm text-slate-500">{order.total}</span>
                    </div>
                    <p className="mt-1 text-sm text-slate-500">{order.customer.fullName} / {order.customer.phone}</p>
                    <p className="mt-1 text-xs text-slate-400">{order.paymentStatus} / {order.orderStatus}</p>
                  </button>
                ))}
                {filteredOrders.length === 0 && <p className="p-4 text-sm text-slate-500">Nu exista comenzi.</p>}
              </div>
            </div>

            {selectedOrder && (
              <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                  <div>
                    <h2 className="text-xl font-semibold">Comanda {selectedOrder.orderNumber}</h2>
                    <p className="text-sm text-slate-500">{new Date(selectedOrder.createdAt).toLocaleString('ro-RO')}</p>
                  </div>
                  <button className="inline-flex items-center justify-center gap-2 rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold text-white" onClick={() => updateOrder(selectedOrder, { paymentStatus: 'Platita' })} type="button">
                    <CheckCircle2 className="size-4" aria-hidden="true" />
                    Confirma plata
                  </button>
                </div>
                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <div className="rounded-md bg-slate-50 p-4">
                    <h3 className="font-semibold">Client</h3>
                    <p className="mt-2 text-sm text-slate-600">{selectedOrder.customer.fullName}</p>
                    <p className="text-sm text-slate-600">{selectedOrder.customer.phone}</p>
                    <p className="text-sm text-slate-600">{selectedOrder.customer.county}, {selectedOrder.customer.locality}</p>
                    <p className="text-sm text-slate-600">{selectedOrder.customer.address}</p>
                    {selectedOrder.customer.postalCode && <p className="text-sm text-slate-600">CP {selectedOrder.customer.postalCode}</p>}
                    {selectedOrder.customer.notes && <p className="mt-2 text-sm text-slate-600">Obs: {selectedOrder.customer.notes}</p>}
                  </div>
                  <div className="rounded-md bg-slate-50 p-4">
                    <h3 className="font-semibold">Status</h3>
                    <label className="mt-3 block text-sm">
                      Plata
                      <select className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" onChange={(event) => updateOrder(selectedOrder, { paymentStatus: event.target.value })} value={selectedOrder.paymentStatus}>
                        {paymentStatuses.map((status) => <option key={status}>{status}</option>)}
                      </select>
                    </label>
                    <label className="mt-3 block text-sm">
                      Comanda
                      <select className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" onChange={(event) => updateOrder(selectedOrder, { orderStatus: event.target.value })} value={selectedOrder.orderStatus}>
                        {orderStatuses.map((status) => <option key={status}>{status}</option>)}
                      </select>
                    </label>
                  </div>
                </div>
                <div className="mt-5">
                  <h3 className="font-semibold">Produse</h3>
                  <div className="mt-3 grid gap-2">
                    {selectedOrder.items.map((item) => (
                      <div className="flex justify-between gap-3 rounded-md border border-slate-200 p-3 text-sm" key={item.productId}>
                        <span>{item.title} x {item.quantity} / {item.unitPrice}</span>
                        <strong>{item.subtotal}</strong>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 ml-auto grid max-w-sm gap-1 rounded-md bg-slate-50 p-4">
                    <div className="flex justify-between"><span>Subtotal</span><strong>{selectedOrder.subtotal}</strong></div>
                    <div className="flex justify-between"><span>Transport</span><strong>{selectedOrder.shipping}</strong></div>
                    <div className="flex justify-between text-lg"><span>Total</span><strong>{selectedOrder.total}</strong></div>
                  </div>
                </div>
                <label className="mt-5 block text-sm font-medium text-slate-700">
                  Observatii interne
                  <textarea className="mt-2 min-h-24 w-full rounded-md border border-slate-300 px-3 py-2" defaultValue={selectedOrder.internalNotes} onBlur={(event) => updateOrder(selectedOrder, { internalNotes: event.target.value })} />
                </label>
                <button className="mt-4 rounded-md border border-red-200 px-3 py-2 text-sm font-semibold text-red-700" onClick={() => updateOrder(selectedOrder, { orderStatus: 'Anulata', paymentStatus: 'Anulata' })} type="button">
                  Anuleaza comanda
                </button>
              </div>
            )}
          </section>
        )}

        {tab === 'products' && (
          <section className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
            <form className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm" onSubmit={handleSaveProduct}>
              <h2 className="text-lg font-semibold">{editingId ? 'Editeaza produs' : 'Adauga produs'}</h2>
              <div className="mt-5 grid gap-4">
                <label className="text-sm font-medium text-slate-700">Titlu<input className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2" onChange={(event) => setProductForm({ ...productForm, title: event.target.value })} value={productForm.title} /></label>
                <label className="text-sm font-medium text-slate-700">Pret<input className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2" onChange={(event) => setProductForm({ ...productForm, price: event.target.value })} value={productForm.price} /></label>
                <div className="grid gap-4 rounded-md border border-slate-200 bg-slate-50 p-4 sm:grid-cols-2">
                  <label className="text-sm font-medium text-slate-700">
                    Latime utila panou (mm)
                    <input
                      className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2"
                      min={0}
                      onChange={(event) =>
                        setProductForm({ ...productForm, panelWidthMm: Number(event.target.value) })
                      }
                      type="number"
                      value={productForm.panelWidthMm}
                    />
                  </label>
                  <label className="text-sm font-medium text-slate-700">
                    Lungime / inaltime panou (mm)
                    <input
                      className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2"
                      min={0}
                      onChange={(event) =>
                        setProductForm({ ...productForm, panelLengthMm: Number(event.target.value) })
                      }
                      type="number"
                      value={productForm.panelLengthMm}
                    />
                  </label>
                  <p className="text-xs leading-5 text-slate-500 sm:col-span-2">
                    Calculatorul foloseste aceste dimensiuni pentru a estima cate bucati acopera peretele clientului.
                  </p>
                </div>
                <label className="text-sm font-medium text-slate-700">Descriere<textarea className="mt-2 min-h-28 w-full rounded-md border border-slate-300 px-3 py-2" onChange={(event) => setProductForm({ ...productForm, description: event.target.value })} value={productForm.description} /></label>
                <ImageListEditor
                  aspect="product"
                  help="Adauga URL-urile pozelor pe rand. Preview-ul are aceeasi rama 4:3 ca in catalog si colectii. Foloseste zoom-ul si pozitia pentru a alege exact zona vizibila."
                  images={productForm.images}
                  onChange={(images) =>
                    setProductForm((current) => ({
                      ...current,
                      images,
                      image: images[0] || '',
                      imageZooms: normalizeZooms(current.imageZooms, images.length),
                      imagePositions: normalizePositions(current.imagePositions, images.length),
                    }))
                  }
                  onPositionsChange={(imagePositions) =>
                    setProductForm((current) => ({
                      ...current,
                      imagePositions,
                    }))
                  }
                  onStatus={setMessage}
                  onZoomsChange={(imageZooms) =>
                    setProductForm((current) => ({
                      ...current,
                      imageZooms,
                    }))
                  }
                  title="Poze produs"
                  positions={productForm.imagePositions}
                  zooms={productForm.imageZooms}
                />
                <div className="grid gap-4 rounded-md border border-slate-200 bg-slate-50 p-4">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">
                      Comparatie cu / fara riflaje
                    </h3>
                    <p className="mt-1 text-xs text-slate-500">
                      Aceste poze apar pe pagina produsului intr-o sectiune cu switch.
                    </p>
                  </div>
                  <ImageListEditor
                    aspect="video"
                    help="Pozele care arata produsul sau camera cu riflaje montate."
                    images={productForm.riflajeImages}
                    onChange={(riflajeImages) =>
                      setProductForm({
                        ...productForm,
                        riflajeImages,
                      })
                    }
                    title="Poze cu riflaje"
                  />
                  <ImageListEditor
                    aspect="video"
                    help="Pozele care arata aceeasi zona fara riflaje."
                    images={productForm.noRiflajeImages}
                    onChange={(noRiflajeImages) =>
                      setProductForm({
                        ...productForm,
                        noRiflajeImages,
                      })
                    }
                    title="Poze fara riflaje"
                  />
                </div>
                <label className="flex items-center gap-3 text-sm"><input checked={productForm.available} onChange={(event) => setProductForm({ ...productForm, available: event.target.checked })} type="checkbox" /> Disponibil pentru comanda</label>
                <label className="flex items-center gap-3 text-sm"><input checked={productForm.active} onChange={(event) => setProductForm({ ...productForm, active: event.target.checked })} type="checkbox" /> Activ pe site</label>
                <button className="inline-flex items-center justify-center gap-2 rounded-md bg-slate-950 px-4 py-3 font-semibold text-white">
                  <Plus className="size-4" aria-hidden="true" />
                  {editingId ? 'Salveaza produsul' : 'Adauga produs'}
                </button>
              </div>
            </form>
            <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
              {products.map((product) => (
                <article className="grid gap-4 border-b border-slate-200 p-5 last:border-b-0 md:grid-cols-[96px_1fr_auto]" key={product.id}>
                  <img alt={product.title} className="size-24 rounded-md object-cover" src={product.image} />
                  <div>
                    <h3 className="font-semibold">{product.title}</h3>
                    <p className="mt-1 text-sm font-semibold text-slate-700">{product.price}</p>
                    <p className="mt-2 text-sm text-slate-500">{product.active ? 'Activ' : 'Inactiv'} / {product.available ? 'Disponibil' : 'Indisponibil'}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      Dimensiuni calculator: {product.panelWidthMm || 0} x {product.panelLengthMm || 0} mm
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      Comparatie: {product.riflajeImages.length} cu riflaje / {product.noRiflajeImages.length} fara riflaje
                    </p>
                  </div>
                  <div className="flex gap-2 md:flex-col">
                    <button className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold" onClick={() => editProduct(product)} type="button">
                      <Pencil className="size-4" aria-hidden="true" />
                      Edit
                    </button>
                    <button className="inline-flex items-center justify-center gap-2 rounded-md border border-red-200 px-3 py-2 text-sm font-semibold text-red-700" onClick={() => handleDeleteProduct(product.id)} type="button">
                      <Trash2 className="size-4" aria-hidden="true" />
                      Sterge
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {tab === 'collections' && (
          <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <form className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm" onSubmit={handleSaveCollection}>
              <h2 className="text-lg font-semibold">
                {editingCollectionId ? 'Editeaza colectie' : 'Adauga colectie'}
              </h2>
              <div className="mt-5 grid gap-4">
                <label className="text-sm font-medium text-slate-700">
                  Titlu colectie
                  <input
                    className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2"
                    onChange={(event) => setCollectionForm({ ...collectionForm, title: event.target.value })}
                    value={collectionForm.title}
                  />
                </label>
                <label className="text-sm font-medium text-slate-700">
                  Descriere colectie
                  <textarea
                    className="mt-2 min-h-24 w-full rounded-md border border-slate-300 px-3 py-2"
                    onChange={(event) =>
                      setCollectionForm({ ...collectionForm, description: event.target.value })
                    }
                    value={collectionForm.description}
                  />
                </label>
                <ImageListEditor
                  aspect="video"
                  help="Adauga pozele colectiei. Prima poza este imaginea principala afisata pe site."
                  images={collectionForm.images}
                  onChange={(images) =>
                    setCollectionForm({
                      ...collectionForm,
                      images,
                      image: images[0] || '',
                    })
                  }
                  title="Poze colectie"
                />
                <div>
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-sm font-semibold text-slate-700">Produse in colectie</h3>
                    <span className="text-xs font-semibold text-slate-500">
                      {collectionForm.productIds.length} selectate
                    </span>
                  </div>
                  <div className="mt-3 max-h-72 overflow-auto rounded-md border border-slate-200">
                    {products.map((product) => (
                      <label
                        className="grid cursor-pointer grid-cols-[auto_52px_1fr] items-center gap-3 border-b border-slate-200 p-3 last:border-b-0 hover:bg-slate-50"
                        key={product.id}
                      >
                        <input
                          checked={collectionForm.productIds.includes(product.id)}
                          onChange={() => toggleCollectionProduct(product.id)}
                          type="checkbox"
                        />
                        <img alt={product.title} className="size-12 rounded-md object-cover" src={product.image} />
                        <span>
                          <span className="block text-sm font-semibold text-slate-900">{product.title}</span>
                          <span className="block text-xs text-slate-500">{product.price}</span>
                        </span>
                      </label>
                    ))}
                    {products.length === 0 && (
                      <p className="p-4 text-sm text-slate-500">
                        Adauga mai intai produse, apoi le poti bifa aici.
                      </p>
                    )}
                  </div>
                </div>
                <label className="flex items-center gap-3 text-sm">
                  <input
                    checked={collectionForm.active}
                    onChange={(event) =>
                      setCollectionForm({ ...collectionForm, active: event.target.checked })
                    }
                    type="checkbox"
                  />
                  Colectie activa pe site
                </label>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <button className="inline-flex items-center justify-center gap-2 rounded-md bg-slate-950 px-4 py-3 font-semibold text-white">
                    <Plus className="size-4" aria-hidden="true" />
                    {editingCollectionId ? 'Salveaza colectia' : 'Adauga colectie'}
                  </button>
                  {editingCollectionId && (
                    <button
                      className="inline-flex items-center justify-center rounded-md border border-slate-300 px-4 py-3 font-semibold"
                      onClick={() => {
                        setEditingCollectionId(null)
                        setCollectionForm(emptyCollection)
                        setMessage('Editarea colectiei a fost anulata.')
                      }}
                      type="button"
                    >
                      Anuleaza editarea
                    </button>
                  )}
                </div>
              </div>
            </form>

            <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
              {collections.map((collection) => {
                const includedProducts = collection.productIds
                  .map((productId) => products.find((product) => product.id === productId))
                  .filter(Boolean)

                return (
                  <article
                    className="grid gap-4 border-b border-slate-200 p-5 last:border-b-0 md:grid-cols-[132px_1fr_auto]"
                    key={collection.id}
                  >
                    <img alt={collection.title} className="h-24 w-full rounded-md object-cover md:w-32" src={collection.image} />
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold">{collection.title}</h3>
                        <span className={`rounded-md px-2 py-1 text-xs font-semibold ${
                          collection.active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {collection.active ? 'Activa' : 'Inactiva'}
                        </span>
                      </div>
                      {collection.description && (
                        <p className="mt-2 line-clamp-2 text-sm text-slate-500">{collection.description}</p>
                      )}
                      <p className="mt-2 text-sm font-semibold text-slate-700">
                        {includedProducts.length} produse
                      </p>
                      {includedProducts.length > 0 && (
                        <p className="mt-1 text-xs text-slate-500">
                          {includedProducts.map((product) => product?.title).join(', ')}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2 md:flex-col">
                      <button className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold" onClick={() => editCollection(collection)} type="button">
                        <Pencil className="size-4" aria-hidden="true" />
                        Edit
                      </button>
                      <button className="inline-flex items-center justify-center gap-2 rounded-md border border-red-200 px-3 py-2 text-sm font-semibold text-red-700" onClick={() => handleDeleteCollection(collection.id)} type="button">
                        <Trash2 className="size-4" aria-hidden="true" />
                        Sterge
                      </button>
                    </div>
                  </article>
                )
              })}
              {collections.length === 0 && (
                <p className="p-5 text-sm text-slate-500">Nu exista colectii salvate.</p>
              )}
            </div>
          </section>
        )}

        {tab === 'settings' && (
          <form className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm" onSubmit={handleSaveSettings}>
            <h2 className="text-lg font-semibold">Setari site si plata</h2>
            <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              Pe Render Free, modificarile salvate in fisierul JSON nu sunt persistente dupa redeploy sau restart.
              Pentru setari, produse si comenzi care raman salvate, muta datele intr-o baza de date sau foloseste storage persistent.
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <label className="text-sm font-medium text-slate-700">Nume site<input className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2" onChange={(event) => setSettings({ ...settings, siteTitle: event.target.value })} value={settings.siteTitle} /></label>
              <label className="text-sm font-medium text-slate-700">URL site public<input className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2" onChange={(event) => setSettings({ ...settings, siteUrl: event.target.value })} placeholder="https://www.designriflaje.com" value={settings.siteUrl} /></label>
              <label className="text-sm font-medium text-slate-700">Titlu principal<input className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2" onChange={(event) => setSettings({ ...settings, heroTitle: event.target.value })} value={settings.heroTitle} /></label>
              <label className="text-sm font-medium text-slate-700">Logo URL<input className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2" onChange={(event) => setSettings({ ...settings, logo: event.target.value })} value={settings.logo} /></label>
              <label className="flex items-center gap-3 text-sm"><input checked={settings.showSiteTitle !== false} onChange={(event) => setSettings({ ...settings, showSiteTitle: event.target.checked })} type="checkbox" /> Afiseaza titlul langa logo</label>
              <label className="md:col-span-2 text-sm font-medium text-slate-700">Descriere principala<textarea className="mt-2 min-h-24 w-full rounded-md border border-slate-300 px-3 py-2" onChange={(event) => setSettings({ ...settings, heroDescription: event.target.value })} value={settings.heroDescription} /></label>
              <div className="md:col-span-2">
                <ImageListEditor
                  aspect="video"
                  help="Aceste poze apar in slideshow-ul mare de pe prima pagina. Prima poza este imaginea principala."
                  images={settings.heroImages}
                  onChange={(heroImages) =>
                    setSettings({
                      ...settings,
                      heroImages,
                      heroImage: heroImages[0] || '',
                    })
                  }
                  title="Poze meniu principal"
                />
              </div>
              <label className="text-sm font-medium text-slate-700">Email<input className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2" onChange={(event) => setSettings({ ...settings, email: event.target.value })} value={settings.email} /></label>
              <label className="text-sm font-medium text-slate-700">Telefon<input className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2" onChange={(event) => setSettings({ ...settings, phone: event.target.value })} value={settings.phone} /></label>
              <label className="text-sm font-medium text-slate-700">WhatsApp optional<input className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2" onChange={(event) => setSettings({ ...settings, whatsapp: event.target.value })} value={settings.whatsapp} /></label>
              <label className="text-sm font-medium text-slate-700">Nume beneficiar<input className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2" onChange={(event) => setSettings({ ...settings, bankBeneficiary: event.target.value })} value={settings.bankBeneficiary} /></label>
              <label className="text-sm font-medium text-slate-700">IBAN<input className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2" onChange={(event) => setSettings({ ...settings, bankIban: event.target.value })} value={settings.bankIban} /></label>
              <label className="text-sm font-medium text-slate-700">Banca<input className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2" onChange={(event) => setSettings({ ...settings, bankName: event.target.value })} value={settings.bankName} /></label>
              <label className="text-sm font-medium text-slate-700">Cost livrare per bucata in afara Iasi<input className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2" min={0} onChange={(event) => setSettings({ ...settings, shippingCostPerItem: Number(event.target.value) })} type="number" value={settings.shippingCostPerItem} /></label>
              <label className="md:col-span-2 text-sm font-medium text-slate-700">Mesaj livrare gratuita<textarea className="mt-2 min-h-20 w-full rounded-md border border-slate-300 px-3 py-2" onChange={(event) => setSettings({ ...settings, freeShippingMessage: event.target.value })} value={settings.freeShippingMessage} /></label>
              <label className="md:col-span-2 text-sm font-medium text-slate-700">Instructiuni transfer bancar<textarea className="mt-2 min-h-24 w-full rounded-md border border-slate-300 px-3 py-2" onChange={(event) => setSettings({ ...settings, bankInstructions: event.target.value })} value={settings.bankInstructions} /></label>
              <label className="text-sm font-medium text-slate-700">SEO title<input className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2" onChange={(event) => setSettings({ ...settings, seoTitle: event.target.value })} placeholder="Titlul care apare in Google" value={settings.seoTitle} /></label>
              <label className="text-sm font-medium text-slate-700">SEO image URL<input className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2" onChange={(event) => setSettings({ ...settings, seoImage: event.target.value })} placeholder="Poza pentru share / preview" value={settings.seoImage} /></label>
              <label className="md:col-span-2 text-sm font-medium text-slate-700">SEO description<textarea className="mt-2 min-h-24 w-full rounded-md border border-slate-300 px-3 py-2" onChange={(event) => setSettings({ ...settings, seoDescription: event.target.value })} placeholder="Descriere pentru Google si preview-uri" value={settings.seoDescription} /></label>
            </div>
            <button className="mt-6 inline-flex items-center justify-center gap-2 rounded-md bg-slate-950 px-4 py-3 font-semibold text-white">
              <Save className="size-4" aria-hidden="true" />
              Salveaza setarile
            </button>
          </form>
        )}
      </div>
    </main>
  )
}

export default App
