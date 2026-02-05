const jwt = require('jsonwebtoken')
const { JWT_SECRET } = require('../config')

async function authMiddleware(req, res, next) {
  let token = null

  // Authorization header preferred
  const authHeader = req.headers.authorization
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1]
  }

  // fallback to cookie
  if (!token && req.cookies && req.cookies.accessToken) {
    token = req.cookies.accessToken
  }

  if (!token) {
    return res.status(401).json({ error: 'Missing token' })
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET)
    req.user = { id: payload.id, email: payload.email }
    return next()
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' })
  }
}

module.exports = authMiddleware