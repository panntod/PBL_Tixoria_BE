import { Router } from 'express'
import userRoutes from './UserRoute.js'
import roleRoutes from './RoleRoute.js'
import eventRoutes from './EventRoute.js'
import ticketRoutes from './TicketRoute.js'
import ownerRoutes from './OwnerRoute.js'
import AdminRoute from './AdminRoute.js'

const router = Router()

router.use('/users', userRoutes)
router.use('/roles', roleRoutes)
router.use('/events', eventRoutes)
router.use('/tickets', ticketRoutes)
router.use('/owner', ownerRoutes)
router.use('/admin', AdminRoute)

export default router