import { Router } from 'express'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'

const router = Router()
const SECRET = process.env.JWT_SECRET ?? 'cybertwin-secret-key-2024'

// Utilisateur unique sans base de données
const ADMIN = { id: 1, username: 'admin', password: bcrypt.hashSync('admin123', 10) }

router.post('/login', (req, res) => {
  const { username, password } = req.body
  if (!username || !password) return res.status(400).json({ error: 'username et password requis' })
  if (username !== ADMIN.username || !bcrypt.compareSync(password, ADMIN.password))
    return res.status(401).json({ error: 'Identifiants incorrects' })
  const token = jwt.sign({ id: ADMIN.id, username: ADMIN.username }, SECRET, { expiresIn: '24h' })
  res.json({ token, username: ADMIN.username })
})

router.post('/register', (_req, res) => {
  res.status(403).json({ error: 'Inscription désactivée' })
})

router.get('/me', (req, res) => {
  const auth = req.headers.authorization
  if (!auth?.startsWith('Bearer ')) return res.status(401).json({ error: 'Non authentifié' })
  try {
    const payload = jwt.verify(auth.slice(7), SECRET)
    res.json({ id: payload.id, username: payload.username })
  } catch {
    res.status(401).json({ error: 'Token invalide' })
  }
})

export default router
