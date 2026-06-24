import { Router } from 'express'
import pool from '../database/db.js'

const router = Router()

router.get('/', async (req, res) => {
  const { asset_id, company_id } = req.query
  let rows
  if (asset_id) {
    ;[rows] = await pool.execute('SELECT * FROM vulnerabilities WHERE asset_id = ?', [asset_id])
  } else if (company_id) {
    ;[rows] = await pool.execute(
      'SELECT v.* FROM vulnerabilities v JOIN assets a ON v.asset_id = a.id WHERE a.company_id = ?',
      [company_id]
    )
  } else {
    ;[rows] = await pool.execute('SELECT * FROM vulnerabilities')
  }
  res.json(rows)
})

router.get('/:id', async (req, res) => {
  const [[row]] = await pool.execute('SELECT * FROM vulnerabilities WHERE id = ?', [req.params.id])
  if (!row) return res.status(404).json({ error: 'Vulnérabilité non trouvée' })
  res.json(row)
})

router.post('/', async (req, res) => {
  const { asset_id, name, criticality } = req.body
  if (!asset_id || !name || !criticality) return res.status(400).json({ error: 'asset_id, name et criticality sont requis' })
  const [result] = await pool.execute(
    'INSERT INTO vulnerabilities (asset_id, name, criticality) VALUES (?,?,?)',
    [asset_id, name, criticality]
  )
  const [[created]] = await pool.execute('SELECT * FROM vulnerabilities WHERE id = ?', [result.insertId])
  res.status(201).json(created)
})

router.put('/:id', async (req, res) => {
  const { asset_id, name, criticality } = req.body
  if (!name || !criticality) return res.status(400).json({ error: 'name et criticality sont requis' })
  const sql = asset_id
    ? ['UPDATE vulnerabilities SET asset_id=?, name=?, criticality=? WHERE id=?', [asset_id, name, criticality, req.params.id]]
    : ['UPDATE vulnerabilities SET name=?, criticality=? WHERE id=?', [name, criticality, req.params.id]]
  const [result] = await pool.execute(...sql)
  if (result.affectedRows === 0) return res.status(404).json({ error: 'Vulnérabilité non trouvée' })
  const [[updated]] = await pool.execute('SELECT * FROM vulnerabilities WHERE id = ?', [req.params.id])
  res.json(updated)
})

router.delete('/:id', async (req, res) => {
  await pool.execute('DELETE FROM vulnerabilities WHERE id = ?', [req.params.id])
  res.json({ message: 'Vulnérabilité supprimée' })
})

export default router
