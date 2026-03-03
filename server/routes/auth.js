import express from 'express'
import jwt from 'jsonwebtoken'
import User from '../models/User.js'
import bcrypt from 'bcrypt'
import { OAuth2Client } from 'google-auth-library'

const router = express.Router()
const GOOGLE_CLIENT_ID = '152616246298-ri5h7nuciskm90933ptih312f595n7uv.apps.googleusercontent.com'
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID)

// Admin login (username/password)
router.post('/login', async (req, res) => {
  const { email, password } = req.body
  if (!email || !password) return res.status(400).json({ ok: false })
  const user = await User.findOne({ email })
  if (!user) return res.status(401).json({ ok: false, message: 'Invalid' })
  const ok = await bcrypt.compare(password, user.passwordHash)
  if (!ok) return res.status(401).json({ ok: false, message: 'Invalid' })
  const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET || 'secret', { expiresIn: '6h' })
  res.json({ ok: true, token })
})

// Google Sign-In verification
router.post('/google', async (req, res) => {
  const { credential } = req.body
  if (!credential) return res.status(400).json({ ok: false, message: 'Missing credential' })

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: GOOGLE_CLIENT_ID
    })
    const payload = ticket.getPayload()
    const { email, name, picture, sub } = payload

    res.json({
      ok: true,
      user: { email, name, picture, googleId: sub }
    })
  } catch (err) {
    console.error('Google auth error:', err.message)
    res.status(401).json({ ok: false, message: 'Invalid Google token' })
  }
})

export default router
