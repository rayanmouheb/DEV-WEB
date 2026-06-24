import { Router } from 'express'
import pool from '../database/db.js'

const router = Router()

// Convertit une ligne Compagny vers le format attendu par le frontend
function fmt(row) {
  return {
    id: row.id,
    name: row.nom,
    sector: row.Secteur,
    employee_count: row.NbEmploye,
    server_count: row.NbServeur,
    client_count: row.NbPosteClient,
    exposed_services: row.Services ? row.Services.split(', ').filter(Boolean) : [],
    created_at: row.created_at,
  }
}

router.get('/', async (_req, res) => {
  const [rows] = await pool.execute('SELECT * FROM Compagny')
  res.json(rows.map(fmt))
})

router.get('/:id', async (req, res) => {
  const [[row]] = await pool.execute('SELECT * FROM Compagny WHERE id = ?', [req.params.id])
  if (!row) return res.status(404).json({ error: 'Entreprise non trouvée' })
  res.json(fmt(row))
})

router.post('/', async (req, res) => {
  const { name, sector, employee_count, server_count, client_count, exposed_services } = req.body
  if (!name || !sector) return res.status(400).json({ error: 'name et sector sont requis' })
  const services = Array.isArray(exposed_services) ? exposed_services.join(', ') : (exposed_services ?? '')
  const [result] = await pool.execute(
    'INSERT INTO Compagny (nom, Secteur, NbEmploye, NbServeur, NbPosteClient, Services) VALUES (?,?,?,?,?,?)',
    [name, sector, employee_count ?? 0, server_count ?? 0, client_count ?? 0, services]
  )
  const [[created]] = await pool.execute('SELECT * FROM Compagny WHERE id = ?', [result.insertId])
  res.status(201).json(fmt(created))
})

router.put('/:id', async (req, res) => {
  const { name, sector, employee_count, server_count, client_count, exposed_services } = req.body
  if (!name || !sector) return res.status(400).json({ error: 'name et sector sont requis' })
  const services = Array.isArray(exposed_services) ? exposed_services.join(', ') : (exposed_services ?? '')
  const [result] = await pool.execute(
    'UPDATE Compagny SET nom=?, Secteur=?, NbEmploye=?, NbServeur=?, NbPosteClient=?, Services=? WHERE id=?',
    [name, sector, employee_count ?? 0, server_count ?? 0, client_count ?? 0, services, req.params.id]
  )
  if (result.affectedRows === 0) return res.status(404).json({ error: 'Entreprise non trouvée' })
  const [[updated]] = await pool.execute('SELECT * FROM Compagny WHERE id = ?', [req.params.id])
  res.json(fmt(updated))
})

router.delete('/:id', async (req, res) => {
  await pool.execute('DELETE FROM Compagny WHERE id = ?', [req.params.id])
  res.json({ message: 'Entreprise supprimée' })
})

export default router
