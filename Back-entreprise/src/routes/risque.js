import { Router } from 'express'
import pool from '../database/db.js'

const router = Router()

export async function computeRisk(company_id) {
  const [assets] = await pool.execute('SELECT * FROM assets WHERE company_id = ?', [company_id])
  const [vulns] = await pool.execute(
    `SELECT v.*, a.is_internet_exposed
     FROM vulnerabilities v
     JOIN assets a ON v.asset_id = a.id
     WHERE a.company_id = ?`,
    [company_id]
  )

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
  for (const a of assets) byType[a.type] = (byType[a.type] ?? 0) + 1

  const criticalityCount = { faible: 0, moyen: 0, eleve: 0 }
  for (const v of vulns) criticalityCount[v.criticality]++

  return { score, level, assetCount: assets.length, vulnCount: vulns.length, exposedCount, byType, criticalityCount }
}

router.post('/calculate', async (req, res) => {
  const { company_id } = req.body
  if (!company_id) return res.status(400).json({ error: 'company_id requis' })
  const result = await computeRisk(company_id)
  res.json({ company_id, ...result })
})

export default router
