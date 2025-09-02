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

If anyone has questions on the league scoring/ rules etc, check below- don't forget to add in the bonus points for 40 & 50+ receiving and rushing plays. Ignore the codes in parentheses! Don't forget to be snarky!

Scoring
Edit
Passing
Passing Yards (PY)0.04
TD Pass (PTD)6
Interceptions Thrown (INT)-2
2pt Passing Conversion (2PC)2
Rushing
Rushing Yards (RY)0.1
TD Rush (RTD)6
40+ yard TD rush bonus (RTD40)1
50+ yard TD rush bonus (RTD50)1
2pt Rushing Conversion (2PR)2
100-199 yard rushing game (RY100)1
200+ yard rushing game (RY200)2
Receiving
Receiving Yards (REY)0.1
Each reception (REC)1
TD Reception (RETD)6
40+ yard TD rec bonus (RETD40)1
50+ yard TD rec bonus (RETD50)3
2pt Receiving Conversion (2PRE)2
100-199 yard receiving game (REY100)1
200+ yard receiving game (REY200)2
Kicking
Each PAT Made (PAT)1
Total FG Missed (FGM)-1
FG Made (0-39 yards) (FG0)3
FG Made (40-49 yards) (FG40)4
FG Made (50-59 yards) (FG50)5
FG Made (60+ yards) (FG60)6
Team Defense / Special Teams
Kickoff Return TD (KRTD)6
Punt Return TD (PRTD)6
Interception Return TD (INTTD)6
Fumble Return TD (FRTD)6
Blocked Punt or FG return for TD (BLKKRTD)6
2pt Return (2PTRET)2
1pt Safety (1PSF)1
Each Sack (SK)1
Blocked Punt, PAT or FG (BLKK)2
Each Interception (INT)2
Each Fumble Recovered (FR)2
Each Safety (SF)2
0 points allowed (PA0)5
1-6 points allowed (PA1)4
7-13 points allowed (PA7)3
14-17 points allowed (PA14)1
28-34 points allowed (PA28)-1
35-45 points allowed (PA35)-3
46+ points allowed (PA46)-5
Less than 100 total yards allowed (YA100)5
100-199 total yards allowed (YA199)3
200-299 total yards allowed (YA299)2
350-399 total yards allowed (YA399)-1
400-449 total yards allowed (YA449)-3
450-499 total yards allowed (YA499)-5
500-549 total yards allowed (YA549)-6
550+ total yards allowed (YA550)-7
Miscellaneous
Kickoff Return TD (KRTD)6
Punt Return TD (PRTD)6
Fumble Recovered for TD (FTD)6
Total Fumbles Lost (FUML)-2
Interception Return TD (INTTD)6
Fumble Return TD (FRTD)6
Blocked Punt or FG return for TD (BLKKRTD)6
2pt Return (2PTRET)2
1pt Safety (1PSF)1
Playoff Bracket Setup
Edit
Playoff Teams
6
Weeks In Round 1 Playoff Matchup
1
Weeks In Round 2 Playoff Matchup
1
Weeks In Championship Round
1
Playoff Seeding Tie Breaker
Head to Head Record
Playoff Home Field Advantage
None
Allow for Playoff Bracket Reseeding
Off
Lock Transactions for Eliminated Teams During Playoffs
No`.trim()
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
