import { Router } from 'express'
import userRoutes from './UserRoute.js'
import roleRoutes from './RoleRoute.js'
import eventRoutes from './EventRoute.js'
import ticketRoutes from './TicketRoute.js'

const router = Router()

router.use('/users', userRoutes)
router.use('/roles', roleRoutes)
router.use('/events', eventRoutes)
router.use('/tickets', ticketRoutes)

export default router