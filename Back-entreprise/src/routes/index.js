import { Router } from 'express'
import companyRouter from './company.js'
import assetsRouter from './asset.js'
import vulnerabilitiesRouter from './vulnerabilities.js'
import riskRouter from './risque.js'
import authRouter from './auth.js'
import reportRouter from './report.js'

const router = Router()

router.get('/health', (_req, res) => res.json({ status: 'ok' }))

router.use('/auth', authRouter)
router.use('/company', companyRouter)
router.use('/assets', assetsRouter)
router.use('/vulnerabilities', vulnerabilitiesRouter)
router.use('/risk', riskRouter)
router.use('/report', reportRouter)

export default router
