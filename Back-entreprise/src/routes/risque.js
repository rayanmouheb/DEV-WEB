import { Router } from 'express'
import db from '../database/db.js'

const router = Router()

function computeRisk(company_id) {
  const assets = db.prepare('SELECT * FROM assets WHERE company_id = ?').all(company_id)
  const vulns = db.prepare(`
    SELECT v.*, a.is_internet_exposed
    FROM vulnerabilities v
    JOIN assets a ON v.asset_id = a.id
    WHERE a.company_id = ?
  `).all(company_id)

  let score = 0
  for (const v of vulns) {
    let pts = v.criticality === 'eleve' ? 3 : v.criticality === 'moyen' ? 2 : 1
    if (v.is_internet_exposed) pts += 1
    score += pts
  }

  const exposedCount = assets.filter(a => a.is_internet_exposed).length
  score += exposedCount

  let level = 'none'
  if (score > 0 && score <= 8) level = 'faible'
  else if (score <= 20) level = 'moyen'
  else if (score > 20) level = 'eleve'

  const byType = {}
  for (const a of assets) {
    byType[a.type] = (byType[a.type] ?? 0) + 1
  }

  const criticalityCount = { faible: 0, moyen: 0, eleve: 0 }
  for (const v of vulns) criticalityCount[v.criticality]++

  return {
    score,
    level,
    assetCount: assets.length,
    vulnCount: vulns.length,
    exposedCount,
    byType,
    criticalityCount,
  }
}

router.post('/calculate', (req, res) => {
  const { company_id } = req.body
  if (!company_id) return res.status(400).json({ error: 'company_id requis' })
  const result = computeRisk(company_id)

  db.prepare(
    'INSERT INTO risk_history (company_id, score, level, details) VALUES (?,?,?,?)'
  ).run(company_id, result.score, result.level, JSON.stringify(result))

  res.json({ company_id, ...result })
})

router.get('/history/:company_id', (req, res) => {
  const rows = db.prepare(
    'SELECT * FROM risk_history WHERE company_id = ? ORDER BY created_at DESC LIMIT 20'
  ).all(req.params.company_id)
  res.json(rows.map(r => ({ ...r, details: JSON.parse(r.details) })))
})

router.delete('/history/:id', (req, res) => {
  db.prepare('DELETE FROM risk_history WHERE id = ?').run(req.params.id)
  res.json({ message: 'Entrée supprimée' })
})

export { computeRisk }
export default router
