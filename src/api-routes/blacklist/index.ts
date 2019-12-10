import { Router } from 'express'
import * as blacklistHandlers from './handlers'

const router: Router = Router()

router.get('/', blacklistHandlers.get)
router.post('/update', blacklistHandlers.updateFromSource)
router.use(blacklistHandlers.errorHandler)

export { router as blacklistHandlers }
