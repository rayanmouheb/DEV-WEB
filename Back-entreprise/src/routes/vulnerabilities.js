import { Router } from 'express'
import pool from '../bdd.js'

const router = Router()

// Récupère toutes les vulnérabilités (ou filtrées par asset_id)
router.get('/', async (req, res) => {
  const { asset_id } = req.query
  if (asset_id) {
    const [rows] = await pool.query('SELECT * FROM vulnerabilities WHERE asset_id = ?', [asset_id])
    return res.json(rows)
  }
  const [rows] = await pool.query('SELECT * FROM vulnerabilities')
  res.json(rows)
})

// Crée une vulnérabilité
router.post('/', async (req, res) => {
  const { asset_id, name, criticality } = req.body
  const [result] = await pool.query(
    'INSERT INTO vulnerabilities (asset_id, name, criticality) VALUES (?, ?, ?)',
    [asset_id, name, criticality]
  )
  res.status(201).json({ id: result.insertId, ...req.body })
})

// Modifie une vulnérabilité
router.put('/:id', async (req, res) => {
  const { name, criticality } = req.body
  await pool.query(
    'UPDATE vulnerabilities SET name=?, criticality=? WHERE id=?',
    [name, criticality, req.params.id]
  )
  res.json({ id: req.params.id, ...req.body })
})

// Supprime une vulnérabilité
router.delete('/:id', async (req, res) => {
  await pool.query('DELETE FROM vulnerabilities WHERE id = ?', [req.params.id])
  res.json({ message: 'Vulnérabilité supprimée' })
})

export default router