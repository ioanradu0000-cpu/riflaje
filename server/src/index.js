import 'dotenv/config'
import bcrypt from 'bcryptjs'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import express from 'express'
import rateLimit from 'express-rate-limit'
import jwt from 'jsonwebtoken'
import nodemailer from 'nodemailer'
import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const dataFile = path.join(__dirname, '..', 'data', 'db.json')

const app = express()
const port = process.env.PORT || 4000
const adminUser = process.env.ADMIN_USER || 'admin'
const adminPasswordHash =
  process.env.ADMIN_PASSWORD_HASH || bcrypt.hashSync(process.env.ADMIN_PASSWORD || 'admin123', 10)
const jwtSecret = process.env.JWT_SECRET || 'change-this-secret-in-env'
const authCookieName = 'pcforge_admin'
const paymentStatuses = ['In asteptarea platii', 'Platita', 'Anulata']
const orderStatuses = [
  'Comanda noua',
  'In procesare',
  'Pregatita',
  'Expediata',
  'Finalizata',
  'Anulata',
]
const defaultOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
]
const configuredOrigins = String(process.env.CORS_ORIGINS || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)
const allowedOrigins = [...new Set([...defaultOrigins, ...configuredOrigins])]
const smtpHost = String(process.env.SMTP_HOST || '').trim()
const smtpPort = Number(process.env.SMTP_PORT || 587)
const smtpSecure = process.env.SMTP_SECURE === 'true'
const smtpUser = String(process.env.SMTP_USER || '').trim()
const smtpPass = String(process.env.SMTP_PASS || '').trim()
const smtpFrom = String(process.env.SMTP_FROM || '').trim()
const notificationEmailEnv = String(process.env.NOTIFICATION_EMAIL || '').trim()
const cookieSameSite =
  process.env.COOKIE_SAME_SITE || (process.env.NODE_ENV === 'production' ? 'none' : 'lax')
const cookieSecure =
  process.env.COOKIE_SECURE === 'true' || process.env.NODE_ENV === 'production'
let mailTransporter = null

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || isAllowedOrigin(origin)) {
        return callback(null, true)
      }

      return callback(null, false)
    },
    credentials: true,
  }),
)
app.use(express.json({ limit: '1mb' }))
app.use(cookieParser())

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
})

async function readDb() {
  const raw = await readFile(dataFile, 'utf8')
  return withDefaults(JSON.parse(raw))
}

async function writeDb(data) {
  await writeFile(dataFile, `${JSON.stringify(withDefaults(data), null, 2)}\n`)
}

function withDefaults(db) {
  const settings = db.settings || {}

  return {
    settings: {
      siteTitle: settings.siteTitle || 'DesignRiflaje',
      logo: settings.logo || '',
      showSiteTitle: settings.showSiteTitle !== false,
      heroTitle: settings.heroTitle || settings.siteTitle || 'DesignRiflaje',
      heroDescription:
        settings.heroDescription || 'Riflaje profesionale pentru amenajari moderne.',
      heroImage: settings.heroImage || '',
      heroImages: parseImageList(settings.heroImages, settings.heroImage),
      email: settings.email || '',
      phone: settings.phone || '',
      whatsapp: settings.whatsapp || settings.phone || '',
      bankBeneficiary: settings.bankBeneficiary || '',
      bankIban: settings.bankIban || '',
      bankName: settings.bankName || '',
      bankInstructions: settings.bankInstructions || '',
      freeShippingMessage: settings.freeShippingMessage || 'Livrare gratuita in Iasi.',
      shippingCostPerItem: Number(settings.shippingCostPerItem ?? 10),
    },
    products: (db.products || []).map(normalizeProduct),
    collections: (db.collections || []).map(normalizeCollection),
    orders: db.orders || [],
  }
}

function normalizeProduct(product) {
  const images = parseImageList(product.images, product.image)
  const riflajeImages = parseImageList(product.riflajeImages)
  const noRiflajeImages = parseImageList(product.noRiflajeImages)
  const inferredDimensions = inferProductDimensions(product)
  const imageZooms = normalizeImageZooms(product.imageZooms, images.length)
  const imagePositions = normalizeImagePositions(product.imagePositions, images.length)

  return {
    id: String(product.id),
    title: sanitize(product.title),
    price: sanitize(product.price),
    description: sanitize(product.description),
    image: images[0] || sanitize(product.image),
    images,
    imageZooms,
    imagePositions,
    riflajeImages,
    noRiflajeImages,
    panelWidthMm: positiveNumber(product.panelWidthMm) || inferredDimensions.panelWidthMm,
    panelLengthMm: positiveNumber(product.panelLengthMm) || inferredDimensions.panelLengthMm,
    available: product.available !== false,
    active: product.active !== false,
  }
}

function normalizeImageZooms(zooms, count) {
  const source = Array.isArray(zooms) ? zooms : []

  return Array.from({ length: count }, (_, index) => {
    const zoom = Number(source[index] ?? 100)
    return Number.isFinite(zoom) ? Math.min(220, Math.max(40, Math.round(zoom))) : 100
  })
}

function isAllowedOrigin(origin) {
  return allowedOrigins.some((pattern) => matchesOriginPattern(origin, pattern))
}

function matchesOriginPattern(origin, pattern) {
  if (origin === pattern) {
    return true
  }

  if (!pattern.includes('*')) {
    return false
  }

  const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*')
  return new RegExp(`^${escaped}$`).test(origin)
}

function normalizeImagePositions(positions, count) {
  const source = Array.isArray(positions) ? positions : []

  return Array.from({ length: count }, (_, index) => {
    const position = source[index] || {}
    const x = Number(position.x ?? 50)
    const y = Number(position.y ?? 50)

    return {
      x: Number.isFinite(x) ? Math.min(100, Math.max(0, Math.round(x))) : 50,
      y: Number.isFinite(y) ? Math.min(100, Math.max(0, Math.round(y))) : 50,
    }
  })
}

function inferProductDimensions(product) {
  const text = `${product.title || ''} ${product.description || ''}`
  const match = text.match(/(\d{1,4})\s*[/x×]\s*(\d{1,4})\s*[/x×]\s*(\d{3,5})\s*(?:mm)?/i)

  if (!match) {
    return { panelWidthMm: 0, panelLengthMm: 0 }
  }

  return {
    panelWidthMm: Number(match[2]) || 0,
    panelLengthMm: Number(match[3]) || 0,
  }
}

function positiveNumber(value) {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0
}

function normalizeCollection(collection) {
  const images = parseImageList(collection.images, collection.image)

  return {
    id: String(collection.id),
    title: sanitize(collection.title),
    description: sanitize(collection.description),
    image: images[0] || sanitize(collection.image),
    images,
    productIds: [...new Set((collection.productIds || []).map((id) => sanitize(id)).filter(Boolean))],
    active: collection.active !== false,
  }
}

function sanitize(value) {
  return String(value ?? '')
    .replace(/[<>]/g, '')
    .trim()
}

function parseImageList(images, fallback = '') {
  const source = Array.isArray(images)
    ? images
    : String(images || '')
        .split(/\r?\n|,/)
        .map((item) => item.trim())

  const parsed = source.map(sanitize).filter(Boolean)
  const fallbackImage = sanitize(fallback)

  if (fallbackImage && !parsed.includes(fallbackImage)) {
    parsed.unshift(fallbackImage)
  }

  return [...new Set(parsed)]
}

function parseMoneyToCents(value) {
  if (typeof value === 'number') {
    return Math.max(0, Math.round(value * 100))
  }

  const raw = String(value ?? '').replace(/\s/g, '')
  const match = raw.match(/\d[\d.,]*/)

  if (!match) {
    return 0
  }

  let amount = match[0]

  if (amount.includes(',')) {
    amount = amount.replace(/\./g, '').replace(',', '.')
  } else if (/\.\d{3}$/.test(amount)) {
    amount = amount.replace(/\./g, '')
  }

  return Math.max(0, Math.round(Number.parseFloat(amount) * 100 || 0))
}

function formatLei(cents) {
  return new Intl.NumberFormat('ro-RO', {
    style: 'currency',
    currency: 'RON',
  }).format(cents / 100)
}

function normalizeLocality(value) {
  return sanitize(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/^municipiul\s+/, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function isIasi(locality) {
  return normalizeLocality(locality) === 'iasi'
}

function validateRomanianPhone(phone) {
  const compact = sanitize(phone).replace(/[\s().-]/g, '')
  return /^(?:\+40|0040|0)\d{9}$/.test(compact)
}

function createToken() {
  return jwt.sign({ user: adminUser }, jwtSecret, { expiresIn: '8h' })
}

function setAuthCookie(res, token) {
  res.cookie(authCookieName, token, {
    httpOnly: true,
    sameSite: cookieSameSite,
    secure: cookieSecure,
    maxAge: 8 * 60 * 60 * 1000,
  })
}

function requireAdmin(req, res, next) {
  const token = req.cookies?.[authCookieName]

  if (!token) {
    return res.status(401).json({ message: 'Autentificare necesara.' })
  }

  try {
    req.admin = jwt.verify(token, jwtSecret)
    next()
  } catch {
    return res.status(401).json({ message: 'Sesiune expirata.' })
  }
}

function validateProduct(product) {
  const images = parseImageList(product.images, product.image)

  return Boolean(
    sanitize(product.title) &&
      sanitize(product.price) &&
      sanitize(product.description) &&
      images.length > 0 &&
      parseMoneyToCents(product.price) > 0,
  )
}

function validateCollection(collection) {
  const images = parseImageList(collection.images, collection.image)
  const productIds = Array.isArray(collection.productIds) ? collection.productIds : []

  return Boolean(sanitize(collection.title) && images.length > 0 && productIds.every((id) => sanitize(id)))
}

function publicCollection(collection, products) {
  const productsById = new Map(products.filter((product) => product.active).map((product) => [product.id, product]))
  const collectionProducts = collection.productIds
    .map((productId) => productsById.get(productId))
    .filter(Boolean)

  return {
    ...collection,
    products: collectionProducts,
  }
}

function publicSettings(settings) {
  return settings
}

function validateCustomer(customer) {
  const errors = []

  if (!sanitize(customer.fullName)) errors.push('Numele este obligatoriu.')
  if (!validateRomanianPhone(customer.phone)) errors.push('Telefonul nu este valid.')
  if (!sanitize(customer.county)) errors.push('Judetul este obligatoriu.')
  if (!sanitize(customer.locality)) errors.push('Localitatea este obligatorie.')
  if (!sanitize(customer.address)) errors.push('Adresa este obligatorie.')

  return errors
}

function buildOrderTotals(db, items, locality) {
  const productById = new Map(db.products.map((product) => [product.id, product]))
  const orderItems = []
  let quantityTotal = 0
  let subtotalCents = 0

  for (const item of items || []) {
    const productId = sanitize(item.productId)
    const quantity = Number(item.quantity)
    const product = productById.get(productId)

    if (!Number.isInteger(quantity) || quantity < 1) {
      throw new Error('Cantitatea trebuie sa fie cel putin 1.')
    }

    if (!product || !product.active) {
      throw new Error('Un produs din cos nu mai este activ.')
    }

    if (!product.available) {
      throw new Error(`Produsul "${product.title}" este indisponibil.`)
    }

    const unitPriceCents = parseMoneyToCents(product.price)
    const itemSubtotalCents = unitPriceCents * quantity
    quantityTotal += quantity
    subtotalCents += itemSubtotalCents

    orderItems.push({
      productId: product.id,
      title: product.title,
      quantity,
      unitPrice: product.price,
      unitPriceCents,
      subtotalCents: itemSubtotalCents,
      subtotal: formatLei(itemSubtotalCents),
    })
  }

  if (!orderItems.length) {
    throw new Error('Cosul este gol.')
  }

  const shippingCostPerItemCents = Math.round(Number(db.settings.shippingCostPerItem || 0) * 100)
  const shippingCents = isIasi(locality) ? 0 : shippingCostPerItemCents * quantityTotal
  const totalCents = subtotalCents + shippingCents

  return {
    items: orderItems,
    quantityTotal,
    subtotalCents,
    shippingCents,
    totalCents,
    subtotal: formatLei(subtotalCents),
    shipping: formatLei(shippingCents),
    total: formatLei(totalCents),
  }
}

function createOrderNumber() {
  const now = new Date()
  const date = now.toISOString().slice(0, 10).replace(/-/g, '')
  return `DR-${date}-${now.getTime().toString().slice(-6)}`
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function getMailTransporter() {
  if (!smtpHost || !smtpPort || !smtpFrom) {
    return null
  }

  if (!mailTransporter) {
    mailTransporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure,
      auth: smtpUser && smtpPass ? { user: smtpUser, pass: smtpPass } : undefined,
    })
  }

  return mailTransporter
}

function getNotificationRecipient(settings) {
  return notificationEmailEnv || sanitize(settings?.email)
}

function formatOrderItemsText(order) {
  return order.items
    .map((item) => `- ${item.title} x ${item.quantity} | ${item.unitPrice} | ${item.subtotal}`)
    .join('\n')
}

function formatOrderItemsHtml(order) {
  return order.items
    .map(
      (item) =>
        `<li><strong>${escapeHtml(item.title)}</strong> x ${item.quantity} | ${escapeHtml(item.unitPrice)} | ${escapeHtml(item.subtotal)}</li>`,
    )
    .join('')
}

function orderSummaryText(order) {
  return [
    `Comanda: ${order.orderNumber}`,
    `Data: ${new Date(order.createdAt).toLocaleString('ro-RO')}`,
    '',
    'Client:',
    `- Nume: ${order.customer.fullName}`,
    `- Telefon: ${order.customer.phone}`,
    `- Judet: ${order.customer.county}`,
    `- Localitate: ${order.customer.locality}`,
    `- Adresa: ${order.customer.address}`,
    order.customer.postalCode ? `- Cod postal: ${order.customer.postalCode}` : '',
    order.customer.notes ? `- Observatii: ${order.customer.notes}` : '',
    '',
    'Produse:',
    formatOrderItemsText(order),
    '',
    `Subtotal: ${order.subtotal}`,
    `Livrare: ${order.shipping}`,
    `Total: ${order.total}`,
    `Status comanda: ${order.orderStatus}`,
    `Status plata: ${order.paymentStatus}`,
  ]
    .filter(Boolean)
    .join('\n')
}

function orderSummaryHtml(order) {
  return `
    <h2>Comanda ${escapeHtml(order.orderNumber)}</h2>
    <p><strong>Data:</strong> ${escapeHtml(new Date(order.createdAt).toLocaleString('ro-RO'))}</p>
    <h3>Client</h3>
    <ul>
      <li><strong>Nume:</strong> ${escapeHtml(order.customer.fullName)}</li>
      <li><strong>Telefon:</strong> ${escapeHtml(order.customer.phone)}</li>
      <li><strong>Judet:</strong> ${escapeHtml(order.customer.county)}</li>
      <li><strong>Localitate:</strong> ${escapeHtml(order.customer.locality)}</li>
      <li><strong>Adresa:</strong> ${escapeHtml(order.customer.address)}</li>
      ${order.customer.postalCode ? `<li><strong>Cod postal:</strong> ${escapeHtml(order.customer.postalCode)}</li>` : ''}
      ${order.customer.notes ? `<li><strong>Observatii:</strong> ${escapeHtml(order.customer.notes)}</li>` : ''}
    </ul>
    <h3>Produse</h3>
    <ul>${formatOrderItemsHtml(order)}</ul>
    <p><strong>Subtotal:</strong> ${escapeHtml(order.subtotal)}</p>
    <p><strong>Livrare:</strong> ${escapeHtml(order.shipping)}</p>
    <p><strong>Total:</strong> ${escapeHtml(order.total)}</p>
    <p><strong>Status comanda:</strong> ${escapeHtml(order.orderStatus)}</p>
    <p><strong>Status plata:</strong> ${escapeHtml(order.paymentStatus)}</p>
  `
}

async function sendAdminNotification(settings, subject, text, html) {
  const transporter = getMailTransporter()
  const recipient = getNotificationRecipient(settings)

  if (!transporter || !recipient) {
    return
  }

  try {
    await transporter.sendMail({
      from: smtpFrom,
      to: recipient,
      subject,
      text,
      html,
    })
  } catch (error) {
    console.error('Email notification failed:', error)
  }
}

function notifyOrderCreated(order, settings) {
  return sendAdminNotification(
    settings,
    `[DesignRiflaje] Comanda noua ${order.orderNumber}`,
    `Ai primit o comanda noua.\n\n${orderSummaryText(order)}`,
    `<p>Ai primit o comanda noua.</p>${orderSummaryHtml(order)}`,
  )
}

function notifyOrderStatusChanged(order, previousStatus, settings) {
  return sendAdminNotification(
    settings,
    `[DesignRiflaje] Status comanda actualizat ${order.orderNumber}`,
    `Statusul comenzii s-a schimbat din "${previousStatus}" in "${order.orderStatus}".\n\n${orderSummaryText(order)}`,
    `<p>Statusul comenzii s-a schimbat din <strong>${escapeHtml(previousStatus)}</strong> in <strong>${escapeHtml(order.orderStatus)}</strong>.</p>${orderSummaryHtml(order)}`,
  )
}

function notifyPaymentStatusChanged(order, previousStatus, settings) {
  return sendAdminNotification(
    settings,
    `[DesignRiflaje] Status plata actualizat ${order.orderNumber}`,
    `Statusul platii s-a schimbat din "${previousStatus}" in "${order.paymentStatus}".\n\n${orderSummaryText(order)}`,
    `<p>Statusul platii s-a schimbat din <strong>${escapeHtml(previousStatus)}</strong> in <strong>${escapeHtml(order.paymentStatus)}</strong>.</p>${orderSummaryHtml(order)}`,
  )
}

app.get('/health', (_req, res) => {
  res.json({ ok: true })
})

app.post('/api/admin/login', loginLimiter, async (req, res) => {
  const username = sanitize(req.body.username)
  const password = String(req.body.password || '')

  if (username !== adminUser || !(await bcrypt.compare(password, adminPasswordHash))) {
    return res.status(401).json({ message: 'User sau parola gresita.' })
  }

  setAuthCookie(res, createToken())
  return res.json({ user: adminUser })
})

app.post('/api/admin/logout', (_req, res) => {
  res.clearCookie(authCookieName)
  res.json({ ok: true })
})

app.get('/api/admin/me', requireAdmin, (_req, res) => {
  res.json({ user: adminUser })
})

app.get('/api/products', async (_req, res) => {
  const db = await readDb()
  res.json(db.products.filter((product) => product.active))
})

app.get('/api/products/:id', async (req, res) => {
  const db = await readDb()
  const product = db.products.find((item) => item.id === req.params.id && item.active)

  if (!product) {
    return res.status(404).json({ message: 'Produsul nu exista.' })
  }

  res.json(product)
})

app.get('/api/collections', async (_req, res) => {
  const db = await readDb()
  res.json(
    db.collections
      .filter((collection) => collection.active)
      .map((collection) => publicCollection(collection, db.products)),
  )
})

app.get('/api/collections/:id', async (req, res) => {
  const db = await readDb()
  const collection = db.collections.find((item) => item.id === req.params.id && item.active)

  if (!collection) {
    return res.status(404).json({ message: 'Colectia nu exista.' })
  }

  res.json(publicCollection(collection, db.products))
})

app.get('/api/admin/products', requireAdmin, async (_req, res) => {
  const db = await readDb()
  res.json(db.products)
})

app.post('/api/admin/products', requireAdmin, async (req, res) => {
  if (!validateProduct(req.body)) {
    return res.status(400).json({ message: 'Completeaza corect toate campurile produsului.' })
  }

  const db = await readDb()
  const product = normalizeProduct({
    id: `prod-${Date.now()}`,
    title: req.body.title,
    price: req.body.price,
    description: req.body.description,
    image: req.body.image,
    images: req.body.images,
    imageZooms: req.body.imageZooms,
    imagePositions: req.body.imagePositions,
    riflajeImages: req.body.riflajeImages,
    noRiflajeImages: req.body.noRiflajeImages,
    panelWidthMm: req.body.panelWidthMm,
    panelLengthMm: req.body.panelLengthMm,
    available: req.body.available !== false,
    active: req.body.active !== false,
  })

  db.products.push(product)
  await writeDb(db)
  res.status(201).json(product)
})

app.put('/api/admin/products/:id', requireAdmin, async (req, res) => {
  if (!validateProduct(req.body)) {
    return res.status(400).json({ message: 'Completeaza corect toate campurile produsului.' })
  }

  const db = await readDb()
  const index = db.products.findIndex((product) => product.id === req.params.id)

  if (index === -1) {
    return res.status(404).json({ message: 'Produsul nu exista.' })
  }

  db.products[index] = normalizeProduct({
    ...db.products[index],
    title: req.body.title,
    price: req.body.price,
    description: req.body.description,
    image: req.body.image,
    images: req.body.images,
    imageZooms: req.body.imageZooms,
    imagePositions: req.body.imagePositions,
    riflajeImages: req.body.riflajeImages,
    noRiflajeImages: req.body.noRiflajeImages,
    panelWidthMm: req.body.panelWidthMm,
    panelLengthMm: req.body.panelLengthMm,
    available: req.body.available !== false,
    active: req.body.active !== false,
  })
  await writeDb(db)
  res.json(db.products[index])
})

app.delete('/api/admin/products/:id', requireAdmin, async (req, res) => {
  const db = await readDb()
  const nextProducts = db.products.filter((product) => product.id !== req.params.id)

  if (nextProducts.length === db.products.length) {
    return res.status(404).json({ message: 'Produsul nu exista.' })
  }

  db.products = nextProducts
  db.collections = db.collections.map((collection) => ({
    ...collection,
    productIds: collection.productIds.filter((productId) => productId !== req.params.id),
  }))
  await writeDb(db)
  res.status(204).send()
})

app.get('/api/admin/collections', requireAdmin, async (_req, res) => {
  const db = await readDb()
  res.json(db.collections)
})

app.post('/api/admin/collections', requireAdmin, async (req, res) => {
  if (!validateCollection(req.body)) {
    return res.status(400).json({ message: 'Completeaza titlul si cel putin o poza pentru colectie.' })
  }

  const db = await readDb()
  const validProductIds = new Set(db.products.map((product) => product.id))
  const collection = normalizeCollection({
    id: `col-${Date.now()}`,
    title: req.body.title,
    description: req.body.description,
    image: req.body.image,
    images: req.body.images,
    productIds: (req.body.productIds || []).filter((productId) => validProductIds.has(productId)),
    active: req.body.active !== false,
  })

  db.collections.push(collection)
  await writeDb(db)
  res.status(201).json(collection)
})

app.put('/api/admin/collections/:id', requireAdmin, async (req, res) => {
  if (!validateCollection(req.body)) {
    return res.status(400).json({ message: 'Completeaza titlul si cel putin o poza pentru colectie.' })
  }

  const db = await readDb()
  const index = db.collections.findIndex((collection) => collection.id === req.params.id)

  if (index === -1) {
    return res.status(404).json({ message: 'Colectia nu exista.' })
  }

  const validProductIds = new Set(db.products.map((product) => product.id))
  db.collections[index] = normalizeCollection({
    ...db.collections[index],
    title: req.body.title,
    description: req.body.description,
    image: req.body.image,
    images: req.body.images,
    productIds: (req.body.productIds || []).filter((productId) => validProductIds.has(productId)),
    active: req.body.active !== false,
  })
  await writeDb(db)
  res.json(db.collections[index])
})

app.delete('/api/admin/collections/:id', requireAdmin, async (req, res) => {
  const db = await readDb()
  const nextCollections = db.collections.filter((collection) => collection.id !== req.params.id)

  if (nextCollections.length === db.collections.length) {
    return res.status(404).json({ message: 'Colectia nu exista.' })
  }

  db.collections = nextCollections
  await writeDb(db)
  res.status(204).send()
})

app.post('/api/orders', async (req, res) => {
  const customer = {
    fullName: sanitize(req.body.customer?.fullName),
    phone: sanitize(req.body.customer?.phone),
    county: sanitize(req.body.customer?.county),
    locality: sanitize(req.body.customer?.locality),
    address: sanitize(req.body.customer?.address),
    postalCode: sanitize(req.body.customer?.postalCode),
    notes: sanitize(req.body.customer?.notes),
  }
  const errors = validateCustomer(customer)

  if (errors.length) {
    return res.status(400).json({ message: errors[0], errors })
  }

  try {
    const db = await readDb()
    const totals = buildOrderTotals(db, req.body.items, customer.locality)
    const order = {
      id: `order-${Date.now()}`,
      orderNumber: createOrderNumber(),
      createdAt: new Date().toISOString(),
      customer,
      items: totals.items,
      quantityTotal: totals.quantityTotal,
      subtotalCents: totals.subtotalCents,
      shippingCents: totals.shippingCents,
      totalCents: totals.totalCents,
      subtotal: totals.subtotal,
      shipping: totals.shipping,
      total: totals.total,
      paymentMethod: 'Transfer bancar',
      paymentStatus: 'In asteptarea platii',
      orderStatus: 'Comanda noua',
      internalNotes: '',
    }

    db.orders.unshift(order)
    await writeDb(db)
    await notifyOrderCreated(order, db.settings)
    res.status(201).json({ order, bank: publicSettings(db.settings) })
  } catch (error) {
    res.status(400).json({ message: error.message || 'Comanda nu a putut fi salvata.' })
  }
})

app.get('/api/admin/orders', requireAdmin, async (req, res) => {
  const db = await readDb()
  const search = sanitize(req.query.search).toLowerCase()
  const paymentStatus = sanitize(req.query.paymentStatus)
  const orderStatus = sanitize(req.query.orderStatus)

  let orders = db.orders

  if (search) {
    orders = orders.filter((order) => {
      const haystack = `${order.orderNumber} ${order.customer?.fullName} ${order.customer?.phone}`.toLowerCase()
      return haystack.includes(search)
    })
  }

  if (paymentStatus) {
    orders = orders.filter((order) => order.paymentStatus === paymentStatus)
  }

  if (orderStatus) {
    orders = orders.filter((order) => order.orderStatus === orderStatus)
  }

  res.json(orders)
})

app.get('/api/admin/orders/:id', requireAdmin, async (req, res) => {
  const db = await readDb()
  const order = db.orders.find((item) => item.id === req.params.id)

  if (!order) {
    return res.status(404).json({ message: 'Comanda nu exista.' })
  }

  res.json(order)
})

app.put('/api/admin/orders/:id/status', requireAdmin, async (req, res) => {
  const status = sanitize(req.body.orderStatus)

  if (!orderStatuses.includes(status)) {
    return res.status(400).json({ message: 'Status comanda invalid.' })
  }

  const db = await readDb()
  const order = db.orders.find((item) => item.id === req.params.id)

  if (!order) {
    return res.status(404).json({ message: 'Comanda nu exista.' })
  }

  const previousStatus = order.orderStatus
  order.orderStatus = status
  order.internalNotes = sanitize(req.body.internalNotes ?? order.internalNotes)
  await writeDb(db)
  if (previousStatus !== status) {
    await notifyOrderStatusChanged(order, previousStatus, db.settings)
  }
  res.json(order)
})

app.put('/api/admin/orders/:id/payment-status', requireAdmin, async (req, res) => {
  const status = sanitize(req.body.paymentStatus)

  if (!paymentStatuses.includes(status)) {
    return res.status(400).json({ message: 'Status plata invalid.' })
  }

  const db = await readDb()
  const order = db.orders.find((item) => item.id === req.params.id)

  if (!order) {
    return res.status(404).json({ message: 'Comanda nu exista.' })
  }

  const previousStatus = order.paymentStatus
  order.paymentStatus = status
  order.internalNotes = sanitize(req.body.internalNotes ?? order.internalNotes)
  await writeDb(db)
  if (previousStatus !== status) {
    await notifyPaymentStatusChanged(order, previousStatus, db.settings)
  }
  res.json(order)
})

app.get('/api/settings/public', async (_req, res) => {
  const db = await readDb()
  res.json(publicSettings(db.settings))
})

app.get('/api/admin/settings', requireAdmin, async (_req, res) => {
  const db = await readDb()
  res.json(db.settings)
})

app.put('/api/admin/settings', requireAdmin, async (req, res) => {
  const siteTitle = sanitize(req.body.siteTitle)
  const email = sanitize(req.body.email)
  const phone = sanitize(req.body.phone)
  const shippingCostPerItem = Number(req.body.shippingCostPerItem)

  if (!siteTitle || !email || !phone || Number.isNaN(shippingCostPerItem) || shippingCostPerItem < 0) {
    return res.status(400).json({ message: 'Completeaza corect setarile obligatorii.' })
  }

  const db = await readDb()
  db.settings = {
    siteTitle,
    logo: sanitize(req.body.logo),
    showSiteTitle: req.body.showSiteTitle !== false,
    heroTitle: sanitize(req.body.heroTitle) || siteTitle,
    heroDescription: sanitize(req.body.heroDescription),
    heroImage: sanitize(req.body.heroImage),
    heroImages: parseImageList(req.body.heroImages, req.body.heroImage),
    email,
    phone,
    whatsapp: sanitize(req.body.whatsapp),
    bankBeneficiary: sanitize(req.body.bankBeneficiary),
    bankIban: sanitize(req.body.bankIban),
    bankName: sanitize(req.body.bankName),
    bankInstructions: sanitize(req.body.bankInstructions),
    freeShippingMessage: sanitize(req.body.freeShippingMessage),
    shippingCostPerItem,
  }
  await writeDb(db)
  res.json(db.settings)
})

// Backward-compatible aliases for the first version of the project.
app.post('/login', loginLimiter, async (req, res) => {
  const username = sanitize(req.body.username)
  const password = String(req.body.password || '')

  if (username !== adminUser || !(await bcrypt.compare(password, adminPasswordHash))) {
    return res.status(401).json({ message: 'User sau parola gresita.' })
  }

  setAuthCookie(res, createToken())
  return res.json({ user: adminUser })
})
app.get('/products', async (_req, res) => {
  const db = await readDb()
  res.json(db.products.filter((product) => product.active))
})
app.get('/settings', async (_req, res) => {
  const db = await readDb()
  res.json(publicSettings(db.settings))
})

app.use((err, _req, res, _next) => {
  console.error(err)
  res.status(500).json({ message: 'Eroare server.' })
})

app.listen(port, () => {
  console.log(`PCforge API ruleaza pe http://localhost:${port}`)
})
