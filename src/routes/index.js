import { Router } from 'express'
import userRoutes from './UserRoute.js'
import roleRoutes from './RoleRoute.js'

const router = Router()

router.use('/users', userRoutes)
router.use('/roles', roleRoutes)

export default router