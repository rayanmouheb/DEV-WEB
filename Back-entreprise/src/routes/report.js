import { Router } from 'express'
import pool from '../database/db.js'
import { computeRisk } from './risque.js'

const router = Router()

const RECOMMENDATIONS = {
  eleve: [
    'Mettre en place une politique de mots de passe forts et un gestionnaire de mots de passe',
    "Activer l'authentification multi-facteurs (MFA) sur tous les accès critiques",
    'Segmenter le réseau et limiter les accès Internet aux seuls services nécessaires',
    "Déployer un système de détection d'intrusion (IDS/IPS) sur le périmètre",
    'Effectuer un audit de sécurité complet et un test de pénétration externe',
  ],
  moyen: [
    "Mettre à jour tous les logiciels et systèmes d'exploitation sans délai",
    'Réviser les règles de pare-feu et fermer les ports non nécessaires',
    'Mettre en place des sauvegardes automatiques chiffrées hors site',
    'Former le personnel aux bonnes pratiques de cybersécurité',
  ],
  faible: [
    'Maintenir une veille régulière sur les nouvelles vulnérabilités',
    'Continuer à appliquer les mises à jour de sécurité dès leur disponibilité',
    "Documenter et tester le plan de reprise d'activité (PRA)",
  ],
  none: ["Ajouter des actifs et des vulnérabilités pour obtenir une analyse de risque"],
}

router.get('/:company_id', async (req, res) => {
  const { company_id } = req.params
  const [[row]] = await pool.execute('SELECT * FROM Compagny WHERE id = ?', [company_id])
  if (!row) return res.status(404).json({ error: 'Entreprise non trouvée' })

  const company = {
    id: row.id,
    name: row.nom,
    sector: row.Secteur,
    employee_count: row.NbEmploye,
    server_count: row.NbServeur,
    client_count: row.NbPosteClient,
    exposed_services: row.Services ? row.Services.split(', ').filter(Boolean) : [],
  }

  const [assetRows] = await pool.execute('SELECT * FROM assets WHERE company_id = ?', [company_id])
  const assets = await Promise.all(
    assetRows.map(async a => {
      const [vulns] = await pool.execute('SELECT * FROM vulnerabilities WHERE asset_id = ?', [a.id])
      return { ...a, is_internet_exposed: Boolean(a.is_internet_exposed), vulnerabilities: vulns }
    })
  )

  const risk = await computeRisk(company_id)

  res.json({
    company,
    assets,
    risk,
    recommendations: RECOMMENDATIONS[risk.level] ?? RECOMMENDATIONS.none,
    generated_at: new Date().toISOString(),
  })
})

export default router
