import { Router } from 'express'
import pool from '../bdd.js'

const router = Router()

// POST /api/risk/calculate avec { company_id } dans le body
router.post('/calculate', async (req, res) => {
  const { company_id } = req.body

  // Récupère toutes les vulnérabilités des actifs de cette entreprise
  const [vulns] = await pool.query(`
    SELECT v.criticality
    FROM vulnerabilities v
    JOIN assets a ON v.asset_id = a.id
    WHERE a.company_id = ?
  `, [company_id])

  // Calcule le score faible vulnerabilité = 1, moyenne vulnerabilité = 2,  vulnerabilité elevée= 3
  const total = vulns.reduce((acc, v) => {
    if (v.criticality === 'eleve') return acc + 3
    if (v.criticality === 'moyen') return acc + 2
    return acc + 1
  }, 0)

  let level = 'none'
  if (total > 0 && total <= 5) level = 'faible'
  else if (total <= 15) level = 'moyen'
  else if (total > 15) level = 'eleve'

  res.json({ company_id, score: total, level })
})

export default router