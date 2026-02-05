const express = require('express')
const jwt = require('jsonwebtoken')
const User = require('../models/User')
const { JWT_SECRET, REFRESH_TOKEN_SECRET, NODE_ENV } = require('../config')

const router = express.Router()

const ACCESS_EXPIRES = '15m' // short lived
const REFRESH_EXPIRES = '7d' // refresh lifetime

function signAccessToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_EXPIRES })
}
function signRefreshToken(payload) {
  return jwt.sign(payload, REFRESH_TOKEN_SECRET, { expiresIn: REFRESH_EXPIRES })
}

function setAuthCookies(res, accessToken, refreshToken) {
  const secure = NODE_ENV === 'production'
  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    maxAge: 15 * 60 * 1000 // 15 minutes
  })
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  })
}

// Register
router.post('/register', async (req, res, next) => {
  try {
    const { email, password, name } = req.body
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required' })

    const existing = await User.findByEmail(email)
    if (existing) return res.status(409).json({ error: 'User already exists' })

    const user = new User({ email, name: name || '' })
    await user.setPassword(password)
    // create tokens
    const accessToken = signAccessToken({ id: user._id, email: user.email })
    const refreshToken = signRefreshToken({ id: user._id, email: user.email })
    user.refreshToken = refreshToken
    await user.save()

    setAuthCookies(res, accessToken, refreshToken)
    res.status(201).json({ user: { id: user._id, email: user.email } })
  } catch (err) {
    if (err && err.code === 11000) {
      return res.status(409).json({ error: 'User already exists' })
    }
    next(err)
  }
})

// Login
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required' })

    const user = await User.findByEmail(email)
    if (!user) return res.status(401).json({ error: 'Invalid credentials' })

    const valid = await user.validatePassword(password)
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' })

    const accessToken = signAccessToken({ id: user._id, email: user.email })
    const refreshToken = signRefreshToken({ id: user._id, email: user.email })
    user.refreshToken = refreshToken
    await user.save()

    setAuthCookies(res, accessToken, refreshToken)
    res.json({ user: { id: user._id, email: user.email } })
  } catch (err) {
    next(err)
  }
})

// Refresh access token (uses httpOnly refresh cookie)
router.post('/refresh', async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken
    if (!token) return res.status(401).json({ error: 'No refresh token' })

    let payload
    try {
      payload = jwt.verify(token, REFRESH_TOKEN_SECRET)
    } catch (err) {
      return res.status(401).json({ error: 'Invalid refresh token' })
    }

    const user = await User.findById(payload.id)
    if (!user || !user.refreshToken) return res.status(401).json({ error: 'User not found' })
    if (user.refreshToken !== token) return res.status(401).json({ error: 'Refresh token mismatch' })

    const accessToken = signAccessToken({ id: user._id, email: user.email })
    // Optionally issue new refresh token (rotation)
    const refreshToken = signRefreshToken({ id: user._id, email: user.email })
    user.refreshToken = refreshToken
    await user.save()

    setAuthCookies(res, accessToken, refreshToken)
    res.json({ user: { id: user._id, email: user.email } })
  } catch (err) {
    next(err)
  }
})

// Logout — clear cookies and revoke refresh token
router.post('/logout', async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken
    if (token) {
      try {
        const payload = jwt.verify(token, REFRESH_TOKEN_SECRET)
        await User.findByIdAndUpdate(payload.id, { $set: { refreshToken: '' } })
      } catch {
        // ignore
      }
    }
    res.clearCookie('accessToken')
    res.clearCookie('refreshToken')
    res.json({ ok: true })
  } catch (err) {
    next(err)
  }
})

module.exports = router