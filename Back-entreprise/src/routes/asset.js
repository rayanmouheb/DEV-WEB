import { Router } from 'express'
import db from '../database/db.js'

const router = Router()

router.get('/', (req, res) => {
  const { company_id } = req.query
  const rows = company_id
    ? db.prepare('SELECT * FROM assets WHERE company_id = ?').all(company_id)
    : db.prepare('SELECT * FROM assets').all()
  res.json(rows)
})

router.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM assets WHERE id = ?').get(req.params.id)
  if (!row) return res.status(404).json({ error: 'Actif non trouvé' })
  res.json(row)
})

router.post('/', (req, res) => {
  const { company_id, name, type, is_internet_exposed } = req.body
  if (!company_id || !name || !type) return res.status(400).json({ error: 'company_id, name et type sont requis' })
  const validTypes = ['serveur_web', 'base_de_donnees', 'poste_utilisateur', 'routeur', 'pare_feu', 'application_metier']
  if (!validTypes.includes(type)) return res.status(400).json({ error: 'Type invalide' })
  const { lastInsertRowid } = db.prepare(
    'INSERT INTO assets (company_id, name, type, is_internet_exposed) VALUES (?,?,?,?)'
  ).run(company_id, name, type, is_internet_exposed ? 1 : 0)
  res.status(201).json(db.prepare('SELECT * FROM assets WHERE id = ?').get(lastInsertRowid))
})

router.put('/:id', (req, res) => {
  const { name, type, is_internet_exposed } = req.body
  if (!name || !type) return res.status(400).json({ error: 'name et type sont requis' })
  const info = db.prepare(
    'UPDATE assets SET name=?, type=?, is_internet_exposed=? WHERE id=?'
  ).run(name, type, is_internet_exposed ? 1 : 0, req.params.id)
  if (info.changes === 0) return res.status(404).json({ error: 'Actif non trouvé' })
  res.json(db.prepare('SELECT * FROM assets WHERE id = ?').get(req.params.id))
})

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM assets WHERE id = ?').run(req.params.id)
  res.json({ message: 'Actif supprimé' })
})

export default router
