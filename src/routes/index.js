import { Router } from 'express'
import eventRoutes from './EventRoute.js'

const router = Router()

router.use('/events', eventRoutes)

export default router