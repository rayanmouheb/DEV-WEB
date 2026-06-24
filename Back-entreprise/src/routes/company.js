import { Router } from 'express'
import pool from '../database/db.js'

const router = Router()

router.get('/', async (_req, res) => {
  const [rows] = await pool.execute('SELECT * FROM company')
  res.json(rows.map(r => ({ ...r, exposed_services: JSON.parse(r.exposed_services) })))
})

router.get('/:id', async (req, res) => {
  const [[row]] = await pool.execute('SELECT * FROM company WHERE id = ?', [req.params.id])
  if (!row) return res.status(404).json({ error: 'Entreprise non trouvée' })
  res.json({ ...row, exposed_services: JSON.parse(row.exposed_services) })
})

router.post('/', async (req, res) => {
  const { name, sector, employee_count, server_count, client_count, exposed_services } = req.body
  if (!name || !sector) return res.status(400).json({ error: 'name et sector sont requis' })
  const services = JSON.stringify(Array.isArray(exposed_services) ? exposed_services : [])
  const [result] = await pool.execute(
    'INSERT INTO company (name, sector, employee_count, server_count, client_count, exposed_services) VALUES (?,?,?,?,?,?)',
    [name, sector, employee_count ?? 0, server_count ?? 0, client_count ?? 0, services]
  )
  const [[created]] = await pool.execute('SELECT * FROM company WHERE id = ?', [result.insertId])
  res.status(201).json({ ...created, exposed_services: JSON.parse(created.exposed_services) })
})

router.put('/:id', async (req, res) => {
  const { name, sector, employee_count, server_count, client_count, exposed_services } = req.body
  if (!name || !sector) return res.status(400).json({ error: 'name et sector sont requis' })
  const services = JSON.stringify(Array.isArray(exposed_services) ? exposed_services : [])
  const [result] = await pool.execute(
    'UPDATE company SET name=?, sector=?, employee_count=?, server_count=?, client_count=?, exposed_services=? WHERE id=?',
    [name, sector, employee_count ?? 0, server_count ?? 0, client_count ?? 0, services, req.params.id]
  )
  if (result.affectedRows === 0) return res.status(404).json({ error: 'Entreprise non trouvée' })
  const [[updated]] = await pool.execute('SELECT * FROM company WHERE id = ?', [req.params.id])
  res.json({ ...updated, exposed_services: JSON.parse(updated.exposed_services) })
})

router.delete('/:id', async (req, res) => {
  await pool.execute('DELETE FROM company WHERE id = ?', [req.params.id])
  res.json({ message: 'Entreprise supprimée' })
})

export default router
