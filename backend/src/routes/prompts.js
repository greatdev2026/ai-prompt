const express = require('express')
const auth = require('../middleware/auth')
const Prompt = require('../models/Prompt')
const { callAIChat } = require('../utils/ai')

const router = express.Router()

router.use(auth)

router.get('/', async (req, res, next) => {
  try {
    const items = await Prompt.find({ user: req.user.id }).sort({ createdAt: -1 }).lean()
    res.json(items.map((it) => ({ id: it._id, prompt: it.prompt, response: it.response, createdAt: it.createdAt })))
  } catch (err) {
    next(err)
  }
})

router.post('/', async (req, res, next) => {
  try {
    const { prompt } = req.body
    if (!prompt || !String(prompt).trim()) return res.status(400).json({ error: 'Prompt is required' })

    const aiResponse = await callAIChat(String(prompt))

    const doc = await Prompt.create({
      user: req.user.id,
      prompt: String(prompt),
      response: aiResponse
    })

    console.log(`[prompts] saved prompt id=${doc._id} user=${req.user.id}`)
    res.status(201).json({ id: doc._id, prompt: doc.prompt, response: doc.response, createdAt: doc.createdAt })
  } catch (err) {
    console.error('Error in /api/prompts:', err?.response?.data || err.message || err)
    next(err)
  }
})

router.delete('/', async (req, res, next) => {
  try {
    await Prompt.deleteMany({ user: req.user.id })
    console.log(`[prompts] cleared history user=${req.user.id}`)
    res.json({ ok: true })
  } catch (err) {
    next(err)
  }
})

module.exports = router