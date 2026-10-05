import { Router } from 'express'
import {
  createEvent,
  getApprovedEvents,
  verifyEvent,
  getAllEvents,
  getEventById,
  getEventDashboard,
} from '../controllers/EventController.js'
import { authenticate, authorizeRoles } from '../middlewares/AuthMiddleware.js'

const router = Router()

// Publik (Tanpa Login) - Mengambil event yang disetujui
router.get('/approved', getApprovedEvents)

// Rute untuk mengambil semua event (getAll dengan pagination)
router.get('/', getAllEvents)

// Khusus Event Owner (Harus Login & Role EVENT_OWNER)
router.post('/', authenticate, authorizeRoles('EVENT_OWNER'), createEvent)

// Khusus Admin (Harus Login & Role ADMIN)
router.patch('/:id/verify', authenticate, authorizeRoles('ADMIN'), verifyEvent)

// Dashboard event berdasarkan ID
router.get('/:id/dashboard', authenticate, authorizeRoles('ADMIN', 'EVENT_OWNER'), getEventDashboard)

// Rute untuk mengambil detail event berdasarkan ID
router.get('/:id', getEventById)

export default router