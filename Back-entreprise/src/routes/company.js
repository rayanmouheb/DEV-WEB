import { Router } from 'express'
import pool from '../bdd.js'

const router = Router()

// Récupère toutes les entreprises
router.get('/', async (_req, res) => {
  const [rows] = await pool.query('SELECT * FROM Compagny')
  res.json(rows)
})

// Récupère une entreprise par son id
router.get('/:id', async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM Compagny WHERE id = ?', [req.params.id])
  if (rows.length === 0) return res.status(404).json({ error: 'Entreprise non trouvée' })
  res.json(rows[0])
})

// Crée une entreprise
router.post('/', async (req, res) => {
  const { nom, Secteur, NbEmploye, NbServeur, NbPosteClient, Services } = req.body
  const [result] = await pool.query(
    'INSERT INTO Compagny (nom, Secteur, NbEmploye, NbServeur, NbPosteClient, Services) VALUES (?, ?, ?, ?, ?, ?)',
    [nom, Secteur, NbEmploye, NbServeur, NbPosteClient, Services]
  )
  res.status(201).json({ id: result.insertId, ...req.body })
})

// Modifie une entreprise
router.put('/:id', async (req, res) => {
  const { nom, Secteur, NbEmploye, NbServeur, NbPosteClient, Services } = req.body
  await pool.query(
    'UPDATE Compagny SET nom=?, Secteur=?, NbEmploye=?, NbServeur=?, NbPosteClient=?, Services=? WHERE id=?',
    [nom, Secteur, NbEmploye, NbServeur, NbPosteClient, Services, req.params.id]
  )
  res.json({ id: req.params.id, ...req.body })
})

// Supprime une entreprise
router.delete('/:id', async (req, res) => {
  await pool.query('DELETE FROM Compagny WHERE id = ?', [req.params.id])
  res.json({ message: 'Entreprise supprimée' })
})

export default router