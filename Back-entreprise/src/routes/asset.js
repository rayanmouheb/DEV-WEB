import { Router } from 'express'
import pool from '../database/db.js'

const router = Router()

router.get('/', async (req, res) => {
  const { company_id } = req.query
  const [rows] = company_id
    ? await pool.execute('SELECT * FROM assets WHERE company_id = ?', [company_id])
    : await pool.execute('SELECT * FROM assets')
  res.json(rows)
})

router.get('/:id', async (req, res) => {
  const [[row]] = await pool.execute('SELECT * FROM assets WHERE id = ?', [req.params.id])
  if (!row) return res.status(404).json({ error: 'Actif non trouvé' })
  res.json(row)
})

router.post('/', async (req, res) => {
  const { company_id, name, type, is_internet_exposed } = req.body
  if (!company_id || !name || !type) return res.status(400).json({ error: 'company_id, name et type sont requis' })
  const [result] = await pool.execute(
    'INSERT INTO assets (company_id, name, type, is_internet_exposed) VALUES (?,?,?,?)',
    [company_id, name, type, is_internet_exposed ? 1 : 0]
  )
  const [[created]] = await pool.execute('SELECT * FROM assets WHERE id = ?', [result.insertId])
  res.status(201).json(created)
})

router.put('/:id', async (req, res) => {
  const { name, type, is_internet_exposed } = req.body
  if (!name || !type) return res.status(400).json({ error: 'name et type sont requis' })
  const [result] = await pool.execute(
    'UPDATE assets SET name=?, type=?, is_internet_exposed=? WHERE id=?',
    [name, type, is_internet_exposed ? 1 : 0, req.params.id]
  )
  if (result.affectedRows === 0) return res.status(404).json({ error: 'Actif non trouvé' })
  const [[updated]] = await pool.execute('SELECT * FROM assets WHERE id = ?', [req.params.id])
  res.json(updated)
})

router.delete('/:id', async (req, res) => {
  await pool.execute('DELETE FROM assets WHERE id = ?', [req.params.id])
  res.json({ message: 'Actif supprimé' })
})

export default router
