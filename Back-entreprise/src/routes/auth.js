import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import db from '../database/db.js'

const router = Router()
const SECRET = process.env.JWT_SECRET ?? 'cybertwin-secret-key-2024'

router.post('/login', (req, res) => {
  const { username, password } = req.body
  if (!username || !password) return res.status(400).json({ error: 'username et password requis' })
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username)
  if (!user) return res.status(401).json({ error: 'Identifiants invalides' })
  if (!bcrypt.compareSync(password, user.password)) return res.status(401).json({ error: 'Identifiants invalides' })
  const token = jwt.sign({ id: user.id, username: user.username }, SECRET, { expiresIn: '24h' })
  res.json({ token, username: user.username })
})

router.post('/register', (req, res) => {
  const { username, password } = req.body
  if (!username || !password) return res.status(400).json({ error: 'username et password requis' })
  if (password.length < 6) return res.status(400).json({ error: 'Mot de passe trop court (6 caractères min)' })
  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username)
  if (existing) return res.status(409).json({ error: 'Nom d\'utilisateur déjà pris' })
  const hash = bcrypt.hashSync(password, 10)
  const { lastInsertRowid } = db.prepare('INSERT INTO users (username, password) VALUES (?,?)').run(username, hash)
  const token = jwt.sign({ id: lastInsertRowid, username }, SECRET, { expiresIn: '24h' })
  res.status(201).json({ token, username })
})

router.get('/me', (req, res) => {
  const auth = req.headers.authorization
  if (!auth) return res.status(401).json({ error: 'Non authentifié' })
  try {
    const payload = jwt.verify(auth.replace('Bearer ', ''), SECRET)
    res.json({ id: payload.id, username: payload.username })
  } catch {
    res.status(401).json({ error: 'Token invalide' })
  }
})

export { SECRET }
export default router
