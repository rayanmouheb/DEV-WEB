import { Router } from 'express'
import db from '../database/db.js'

const router = Router()

router.get('/', (_req, res) => {
  const rows = db.prepare('SELECT * FROM company').all()
  res.json(rows.map(r => ({ ...r, exposed_services: JSON.parse(r.exposed_services) })))
})

router.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM company WHERE id = ?').get(req.params.id)
  if (!row) return res.status(404).json({ error: 'Entreprise non trouvée' })
  res.json({ ...row, exposed_services: JSON.parse(row.exposed_services) })
})

router.post('/', (req, res) => {
  const { name, sector, employee_count, server_count, client_count, exposed_services } = req.body
  if (!name || !sector) return res.status(400).json({ error: 'name et sector sont requis' })
  const services = JSON.stringify(Array.isArray(exposed_services) ? exposed_services : [])
  const { lastInsertRowid } = db.prepare(
    'INSERT INTO company (name, sector, employee_count, server_count, client_count, exposed_services) VALUES (?,?,?,?,?,?)'
  ).run(name, sector, employee_count ?? 0, server_count ?? 0, client_count ?? 0, services)
  const created = db.prepare('SELECT * FROM company WHERE id = ?').get(lastInsertRowid)
  res.status(201).json({ ...created, exposed_services: JSON.parse(created.exposed_services) })
})

router.put('/:id', (req, res) => {
  const { name, sector, employee_count, server_count, client_count, exposed_services } = req.body
  if (!name || !sector) return res.status(400).json({ error: 'name et sector sont requis' })
  const services = JSON.stringify(Array.isArray(exposed_services) ? exposed_services : [])
  const info = db.prepare(
    'UPDATE company SET name=?, sector=?, employee_count=?, server_count=?, client_count=?, exposed_services=? WHERE id=?'
  ).run(name, sector, employee_count ?? 0, server_count ?? 0, client_count ?? 0, services, req.params.id)
  if (info.changes === 0) return res.status(404).json({ error: 'Entreprise non trouvée' })
  const updated = db.prepare('SELECT * FROM company WHERE id = ?').get(req.params.id)
  res.json({ ...updated, exposed_services: JSON.parse(updated.exposed_services) })
})

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM company WHERE id = ?').run(req.params.id)
  res.json({ message: 'Entreprise supprimée' })
})

export default router
