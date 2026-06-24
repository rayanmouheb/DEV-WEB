import { Router } from 'express'
import db from '../database/db.js'
import { computeRisk } from './risque.js'

const router = Router()

const RECOMMENDATIONS = {
  eleve: [
    'Mettre en place un plan de réponse aux incidents immédiatement.',
    'Auditer et corriger toutes les vulnérabilités critiques en priorité.',
    'Restreindre les accès Internet aux services essentiels uniquement.',
    'Activer la double authentification sur tous les comptes administrateurs.',
    'Effectuer une sauvegarde complète et tester la restauration.',
  ],
  moyen: [
    'Établir un calendrier de mises à jour régulières des systèmes.',
    'Mettre en place une surveillance des journaux d\'événements.',
    'Former les employés aux bonnes pratiques de cybersécurité.',
    'Réviser les règles du pare-feu et fermer les ports inutiles.',
    'Documenter et tester le plan de continuité d\'activité.',
  ],
  faible: [
    'Maintenir une veille régulière sur les nouvelles vulnérabilités.',
    'Planifier des audits de sécurité annuels.',
    'Vérifier périodiquement les droits d\'accès des utilisateurs.',
    'Mettre à jour les politiques de mot de passe.',
  ],
  none: [
    'Commencer par inventorier vos actifs numériques.',
    'Identifier et documenter les services exposés sur Internet.',
  ],
}

router.get('/:company_id', (req, res) => {
  const company = db.prepare('SELECT * FROM company WHERE id = ?').get(req.params.company_id)
  if (!company) return res.status(404).json({ error: 'Entreprise non trouvée' })

  const assets = db.prepare('SELECT * FROM assets WHERE company_id = ?').all(req.params.company_id)
  const assetsWithVulns = assets.map(a => ({
    ...a,
    vulnerabilities: db.prepare('SELECT * FROM vulnerabilities WHERE asset_id = ?').all(a.id),
  }))

  const risk = computeRisk(req.params.company_id)
  const recommendations = RECOMMENDATIONS[risk.level] ?? RECOMMENDATIONS.none

  res.json({
    company: { ...company, exposed_services: JSON.parse(company.exposed_services) },
    assets: assetsWithVulns,
    risk,
    recommendations,
    generated_at: new Date().toISOString(),
  })
})

export default router
