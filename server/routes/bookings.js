import express from 'express'
import Booking from '../models/Booking.js'
import { v4 as uuidv4 } from 'uuid'
import { verifyAdmin } from '../middleware/auth.js'
import { OAuth2Client } from 'google-auth-library'
import rateLimit from 'express-rate-limit'

const router = express.Router()
const GOOGLE_CLIENT_ID = '152616246298-ri5h7nuciskm90933ptih312f595n7uv.apps.googleusercontent.com'
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID)

// Rate limiter for booking (stricter)
const bookingLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: { ok: false, message: 'Troppe prenotazioni. Riprova più tardi.' }
})

// Helper: verify Google token and extract email
async function verifyGoogleToken(credential) {
  const ticket = await googleClient.verifyIdToken({
    idToken: credential,
    audience: GOOGLE_CLIENT_ID
  })
  return ticket.getPayload()
}

// Helper: validate Italian phone number
function isItalianPhone(phone) {
  const clean = phone.replace(/[\s\-().]/g, '')
  // Italian: +39 or 39 followed by 3xx (mobile) or 0x (landline), total 10 digits after 39
  // Or without country code: starts with 3 (mobile) — 10 digits
  const italianRegex = /^(\+?39)?[03]\d{8,10}$/
  return italianRegex.test(clean)
}

// Helper: sanitize string input
function sanitize(str, maxLen = 100) {
  if (typeof str !== 'string') return ''
  return str.trim().slice(0, maxLen)
}

// Public: get booked slots for a date
router.get('/slots', async (req, res) => {
  const { date } = req.query
  if (!date) return res.status(400).json({ ok: false, message: 'Missing date' })
  const b = await Booking.find({ date })
  res.json(b.map(x => x.slot))
})

// Public: create a booking (requires Google auth)
router.post('/book', bookingLimiter, async (req, res) => {
  const { name, contact, date, slot, service, googleCredential } = req.body

  // Input sanitization
  const cleanName = sanitize(name, 60)
  const cleanContact = sanitize(contact, 20)
  const cleanDate = sanitize(date, 10)
  const cleanSlot = sanitize(slot, 5)
  const cleanService = sanitize(service, 80)

  if (!cleanName || !cleanContact || !cleanDate || !cleanSlot) {
    return res.status(400).json({ ok: false, message: 'Compila tutti i campi' })
  }

  // Google auth verification
  if (!googleCredential) {
    return res.status(401).json({ ok: false, message: 'Accedi con Google per prenotare' })
  }

  let googleEmail = ''
  try {
    const payload = await verifyGoogleToken(googleCredential)
    googleEmail = payload.email
  } catch (err) {
    return res.status(401).json({ ok: false, message: 'Autenticazione Google non valida' })
  }

  // Reject past dates
  const today = new Date().toISOString().split('T')[0]
  if (cleanDate < today) {
    return res.status(400).json({ ok: false, message: 'Non puoi prenotare una data passata' })
  }

  // Italian phone validation
  if (!isItalianPhone(cleanContact)) {
    return res.status(400).json({ ok: false, message: 'Inserisci un numero di telefono italiano valido (+39...)' })
  }

  // Check if slot is already taken
  const slotTaken = await Booking.findOne({ date: cleanDate, slot: cleanSlot })
  if (slotTaken) {
    return res.json({ ok: false, message: 'Questo orario è già prenotato' })
  }

  // One booking per Google account per day
  const alreadyBooked = await Booking.findOne({ date: cleanDate, googleEmail })
  if (alreadyBooked) {
    return res.status(403).json({ ok: false, message: 'Hai già una prenotazione per questo giorno' })
  }

  // Clean phone for storage
  const phoneClean = cleanContact.replace(/[\s\-().]/g, '')

  const newB = await Booking.create({
    id: uuidv4().slice(0, 8),
    name: cleanName,
    contact: phoneClean,
    date: cleanDate,
    slot: cleanSlot,
    service: cleanService,
    googleEmail
  })
  res.json({ ok: true, bookingId: newB.id })
})

// Admin: list all bookings (protected)
router.get('/admin/bookings', verifyAdmin, async (req, res) => {
  const all = await Booking.find({}).sort({ date: 1, slot: 1 })
  res.json({ ok: true, bookings: all })
})

// Admin: cancel a booking (protected)
router.post('/admin/cancel', verifyAdmin, async (req, res) => {
  const { bookingId } = req.body
  if (!bookingId) return res.status(400).json({ ok: false, message: 'Missing booking ID' })
  const result = await Booking.deleteOne({ id: bookingId })
  if (result.deletedCount === 0) return res.json({ ok: false, message: 'Booking not found' })
  res.json({ ok: true })
})

export default router
