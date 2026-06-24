import { Router } from 'express'
import pool from '../bdd.js'

const router = Router()

// Récupère tous les actifs 
router.get('/', async (req, res) => {
  const { company_id } = req.query
  if (company_id) {
    const [rows] = await pool.query('SELECT * FROM assets WHERE company_id = ?', [company_id])
    return res.json(rows)
  }
  const [rows] = await pool.query('SELECT * FROM assets')
  res.json(rows)
})

// Crée un actif
router.post('/', async (req, res) => {
  const { company_id, name, type, is_internet_exposed } = req.body
  const [result] = await pool.query(
    'INSERT INTO assets (company_id, name, type, is_internet_exposed) VALUES (?, ?, ?, ?)',
    [company_id, name, type, is_internet_exposed ?? 0]
  )
  res.status(201).json({ id: result.insertId, ...req.body })
})

// Modifie un actif
router.put('/:id', async (req, res) => {
  const { name, type, is_internet_exposed } = req.body
  await pool.query(
    'UPDATE assets SET name=?, type=?, is_internet_exposed=? WHERE id=?',
    [name, type, is_internet_exposed, req.params.id]
  )
  res.json({ id: req.params.id, ...req.body })
})

// Supprime un actif
router.delete('/:id', async (req, res) => {
  await pool.query('DELETE FROM assets WHERE id = ?', [req.params.id])
  res.json({ message: 'Actif supprimé' })
})

export default router