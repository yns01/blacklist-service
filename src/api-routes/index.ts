import { Router } from 'express'
import { blacklistHandlers } from './blacklist'

const router: Router = Router()

router.use('/api/v1/blacklist', blacklistHandlers)

export { router }
