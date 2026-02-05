const express = require('express')
const cors = require('cors')
const morgan = require('morgan')
const mongoose = require('mongoose')
const dotenv = require('dotenv')
const { MONGO_URI, PORT, CORS_ORIGIN } = require('./config')
const cookieParser = require('cookie-parser')

dotenv.config()

mongoose
  .connect(MONGO_URI, { autoIndex: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => {
    console.error('MongoDB connection error:', err)
    process.exit(1)
  })

const app = express()

app.use(
  cors({
    origin: CORS_ORIGIN,
    credentials: true // allow cookies
  })
)
app.use(express.json())
app.use(cookieParser())
app.use(morgan('tiny'))

app.use('/api/auth', require('./routes/auth'))
app.use('/api/prompts', require('./routes/prompts'))

app.get('/', (req, res) => res.json({ ok: true, version: '0.1.0' }))

app.use((err, req, res, next) => {
  console.error(err)
  res.status(err.status || 500).json({ error: err.message || 'Server error' })
})

const port = PORT || 4000
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`)
})