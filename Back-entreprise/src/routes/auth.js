import { Router } from 'express'

const router = Router()

const ADMIN = { id: 1, username: 'admin', password: 'admin123' }
const TOKEN = 'cybertwin-admin-token'

router.post('/login', (req, res) => {
  const { username, password } = req.body
  if (!username || !password) return res.status(400).json({ error: 'username et password requis' })
  if (username !== ADMIN.username || password !== ADMIN.password)
    return res.status(401).json({ error: 'Identifiants incorrects' })
  res.json({ token: TOKEN, username: ADMIN.username })
})

router.post('/register', (_req, res) => {
  res.status(403).json({ error: 'Inscription désactivée' })
})

router.get('/me', (req, res) => {
  const auth = req.headers.authorization
  if (auth !== `Bearer ${TOKEN}`) return res.status(401).json({ error: 'Non authentifié' })
  res.json({ id: ADMIN.id, username: ADMIN.username })
})

export default router
