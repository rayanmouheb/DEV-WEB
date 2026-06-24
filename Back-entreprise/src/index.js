import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import router from './routes/index.js'
import { initDB } from './database/db.js'

const app = express()
const PORT = process.env.PORT ?? 3000

app.use(cors({ origin: process.env.FRONTEND_URL ?? 'http://localhost:5173' }))
app.use(express.json())
app.use('/api', router)

initDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`CyberTwin backend running on http://localhost:${PORT}`)
    })
  })
  .catch(err => {
    console.error('Erreur de connexion à la base de données :', err.message)
    process.exit(1)
  })
