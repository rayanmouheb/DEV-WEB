import { Router } from 'express'
import pool from '../bdd.js'

const router = Router()

router.get('/', async (_req, res) => {
  const [rows] = await pool.query('SELECT * FROM Compagny')
  // On renomme les champs pour le frontend
  const companies = rows.map(c => ({
    id: c.id,
    name: c.nom,
    sector: c.Secteur,
    employee_count: c.NbEmploye,
    server_count: c.NbServeur,
    client_count: c.NbPosteClient,
    exposed_services: c.Services ? c.Services.split(',').map(s => s.trim()) : []
  }))
  res.json(companies)
})

router.get('/:id', async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM Compagny WHERE id = ?', [req.params.id])
  if (rows.length === 0) return res.status(404).json({ error: 'Entreprise non trouvée' })
  const c = rows[0]
  res.json({
    id: c.id,
    name: c.nom,
    sector: c.Secteur,
    employee_count: c.NbEmploye,
    server_count: c.NbServeur,
    client_count: c.NbPosteClient,
    exposed_services: c.Services ? c.Services.split(',').map(s => s.trim()) : []
  })
})

router.post('/', async (req, res) => {
  const { name, sector, employee_count, server_count, client_count, exposed_services } = req.body
  const services = Array.isArray(exposed_services) ? exposed_services.join(', ') : ''
  const [result] = await pool.query(
    'INSERT INTO Compagny (nom, Secteur, NbEmploye, NbServeur, NbPosteClient, Services) VALUES (?, ?, ?, ?, ?, ?)',
    [name, sector, employee_count, server_count, client_count, services]
  )
  res.status(201).json({
    id: result.insertId,
    name, sector, employee_count, server_count, client_count,
    exposed_services: exposed_services ?? []
  })
})

router.put('/:id', async (req, res) => {
  const { name, sector, employee_count, server_count, client_count, exposed_services } = req.body
  const services = Array.isArray(exposed_services) ? exposed_services.join(', ') : ''
  await pool.query(
    'UPDATE Compagny SET nom=?, Secteur=?, NbEmploye=?, NbServeur=?, NbPosteClient=?, Services=? WHERE id=?',
    [name, sector, employee_count, server_count, client_count, services, req.params.id]
  )
  res.json({
    id: Number(req.params.id),
    name, sector, employee_count, server_count, client_count,
    exposed_services: exposed_services ?? []
  })
})

router.delete('/:id', async (req, res) => {
  await pool.query('DELETE FROM Compagny WHERE id = ?', [req.params.id])
  res.json({ message: 'Entreprise supprimée' })
})

export default router