import { Router } from 'express'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import pool from '../database/db.js'

const router = Router()
const SECRET = process.env.JWT_SECRET ?? 'cybertwin-secret-key-2024'

function makeToken(user) {
  return jwt.sign({ id: user.id, username: user.username }, SECRET, { expiresIn: '24h' })
}

router.post('/login', async (req, res) => {
  const { username, password } = req.body
  if (!username || !password) return res.status(400).json({ error: 'username et password requis' })
  const [[user]] = await pool.execute('SELECT * FROM users WHERE username = ?', [username])
  if (!user || !bcrypt.compareSync(password, user.password))
    return res.status(401).json({ error: 'Identifiants incorrects' })
  res.json({ token: makeToken(user), username: user.username })
})

router.post('/register', async (req, res) => {
  const { username, password } = req.body
  if (!username || !password) return res.status(400).json({ error: 'username et password requis' })
  const [[existing]] = await pool.execute('SELECT id FROM users WHERE username = ?', [username])
  if (existing) return res.status(409).json({ error: "Nom d'utilisateur déjà pris" })
  const hash = bcrypt.hashSync(password, 10)
  const [result] = await pool.execute('INSERT INTO users (username, password) VALUES (?,?)', [username, hash])
  const [[user]] = await pool.execute('SELECT * FROM users WHERE id = ?', [result.insertId])
  res.status(201).json({ token: makeToken(user), username: user.username })
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
