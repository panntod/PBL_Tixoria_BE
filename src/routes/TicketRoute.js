import { Router } from 'express'
import {
  registerTicket,
  getMyTickets,
  scanTicket,
} from '../controllers/TicketController.js'
import { authenticate, authorizeRoles } from '../middlewares/AuthMiddleware.js'

const router = Router()

// Semua endpoint tiket memerlukan login (authenticate)
router.post('/register', authenticate, registerTicket)
router.get('/my-tickets', authenticate, getMyTickets)

// Scan QR hanya boleh dilakukan oleh Admin atau Event Owner
router.patch('/scan', authenticate, authorizeRoles('ADMIN', 'EVENT_OWNER'), scanTicket)

export default router