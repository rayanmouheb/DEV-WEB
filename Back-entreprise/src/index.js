import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import router from './routes/index.js'

const app = express()
const PORT = process.env.PORT ?? 3000

app.use(cors({ origin: process.env.FRONTEND_URL ?? 'http://localhost:5173' }))
app.use(express.json())
app.use('/api', router)

// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error(err)
  res.status(500).json({ error: err.message ?? 'Erreur interne du serveur' })
})

app.listen(PORT, () => {
  console.log(`CyberTwin backend running on http://localhost:${PORT}`)
})
