import { Router } from 'express'
import { blacklistHandlers } from './blacklist'
import { platformRoutes } from './platform'

const router: Router = Router()

router.use('/', platformRoutes)
router.use('/api/v1/blacklist', blacklistHandlers)

export { router }
