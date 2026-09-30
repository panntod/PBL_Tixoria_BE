import { Router } from 'express'
import {
  createEvent,
  getApprovedEvents,
  verifyEvent,
  getEventDashboard,
} from '../controllers/EventController.js'
import { authenticate, authorizeRoles } from '../middlewares/AuthMiddleware.js'

const router = Router()

// Publik (Tanpa Login)
router.get('/', getApprovedEvents)

// Khusus Event Owner (Harus Login & Role EVENT_OWNER)
router.post('/', authenticate, authorizeRoles('EVENT_OWNER'), createEvent)

// Khusus Admin (Harus Login & Role ADMIN)
router.patch('/:id/verify', authenticate, authorizeRoles('ADMIN'), verifyEvent)

router.get('/:id/dashboard', authenticate, authorizeRoles('ADMIN', 'EVENT_OWNER'), getEventDashboard)

export default router