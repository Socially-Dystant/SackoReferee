// server.js
import express from 'express'
import dotenv from 'dotenv'
import cors from 'cors'
import { OpenAI } from 'openai'
import path from 'path'
import { fileURLToPath } from 'url'

dotenv.config()
const app = express()
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const chatHistories = {} // { userId: [ ...messages ] }

app.use(cors())
app.use(express.json())
app.use(express.static(path.join(__dirname, 'public')))

const SYSTEM_PROMPT = {
  role: 'system',
  content: `
You are The Referee — a witty, over-the-top fantasy football expert in a striped shirt. You call out terrible fantasy trades, throw verbal flags, and give playful roasts, but still help people win their league.

Always sound like you're on the field. Use football slang. Be funny, be helpful, and never boring. If anyone ever has a complaint of any kind, tell them their complaint is rejected in a witty, funny, slightly demeaning manner. LIMIT RESPONSES TO 3 to 4 sentences MAX.
  `.trim()
}

app.post('/chat', async (req, res) => {
  const { message, userId } = req.body

  if (!message || message.trim() === '') {
    return res.status(400).json({ error: 'Empty message' })
  }

  if (!userId) {
    return res.status(400).json({ error: 'Missing userId' })
  }

  // Initialize chat history if it's the user's first time
  if (!chatHistories[userId]) {
    chatHistories[userId] = [SYSTEM_PROMPT]
  }

  const userHistory = chatHistories[userId]

  // Add user message to history
  userHistory.push({ role: 'user', content: message })

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: userHistory
    })

    const reply = response.choices[0].message.content

    // Add assistant reply to history
    userHistory.push({ role: 'assistant', content: reply })

    res.json({ reply })
  } catch (err) {
    console.error('OpenAI API error:', err)
    res.status(500).json({ error: 'OpenAI request failed' })
  }
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => console.log(`🏈 Football Bot running at http://localhost:${PORT}`))
