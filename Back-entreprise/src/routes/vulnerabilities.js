import { Router } from 'express'
import db from '../database/db.js'

const router = Router()

router.get('/', (req, res) => {
  const { asset_id, company_id } = req.query
  let rows
  if (asset_id) {
    rows = db.prepare('SELECT * FROM vulnerabilities WHERE asset_id = ?').all(asset_id)
  } else if (company_id) {
    rows = db.prepare(
      'SELECT v.* FROM vulnerabilities v JOIN assets a ON v.asset_id = a.id WHERE a.company_id = ?'
    ).all(company_id)
  } else {
    rows = db.prepare('SELECT * FROM vulnerabilities').all()
  }
  res.json(rows)
})

router.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM vulnerabilities WHERE id = ?').get(req.params.id)
  if (!row) return res.status(404).json({ error: 'Vulnérabilité non trouvée' })
  res.json(row)
})

router.post('/', (req, res) => {
  const { asset_id, name, description, criticality } = req.body
  if (!asset_id || !name || !criticality) return res.status(400).json({ error: 'asset_id, name et criticality sont requis' })
  const validLevels = ['faible', 'moyen', 'eleve']
  if (!validLevels.includes(criticality)) return res.status(400).json({ error: 'Criticité invalide (faible, moyen, eleve)' })
  const { lastInsertRowid } = db.prepare(
    'INSERT INTO vulnerabilities (asset_id, name, description, criticality) VALUES (?,?,?,?)'
  ).run(asset_id, name, description ?? '', criticality)
  res.status(201).json(db.prepare('SELECT * FROM vulnerabilities WHERE id = ?').get(lastInsertRowid))
})

router.put('/:id', (req, res) => {
  const { name, description, criticality } = req.body
  if (!name || !criticality) return res.status(400).json({ error: 'name et criticality sont requis' })
  const info = db.prepare(
    'UPDATE vulnerabilities SET name=?, description=?, criticality=? WHERE id=?'
  ).run(name, description ?? '', criticality, req.params.id)
  if (info.changes === 0) return res.status(404).json({ error: 'Vulnérabilité non trouvée' })
  res.json(db.prepare('SELECT * FROM vulnerabilities WHERE id = ?').get(req.params.id))
})

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM vulnerabilities WHERE id = ?').run(req.params.id)
  res.json({ message: 'Vulnérabilité supprimée' })
})

export default router
