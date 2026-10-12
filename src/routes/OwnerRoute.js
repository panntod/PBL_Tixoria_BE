import { Router } from 'express'
import {
  getDashboardSummary,
  getOwnerEvents,
  createEventDraft,
  updateEventInfo,
  manageTicketCategory,
  manageRundown,
  managePanitia,
  manageRabItem,
  cancelParticipantTicket,
  submitEventForReview,
  withdrawEventSubmission,
  cancelEventByOwner,
  publishEvent,
  getEventParticipants,
  updateOwnerEvent,
} from '../controllers/OwnerController.js'
import { authenticate, authorizeRoles } from '../middlewares/AuthMiddleware.js'

const router = Router()

// Proteksi seluruh rute owner hanya untuk role EVENT_OWNER & ADMIN
router.use(authenticate, authorizeRoles('EVENT_OWNER', 'ADMIN'))

// Dasbor & Daftar Acara
router.get('/dashboard', getDashboardSummary)
router.get('/events', getOwnerEvents)
router.post('/events/draft', createEventDraft)

// Detail & Pengelolaan Acara (Wizard & Tab Operasional)
router.put('/events/:id', updateEventInfo)
router.post('/events/:eventId/tickets', manageTicketCategory)
router.post('/events/:eventId/rundowns', manageRundown)
router.post('/events/:eventId/panitias', managePanitia)
router.post('/events/:eventId/rab', manageRabItem)

// Aksi Peserta & Pengajuan
router.patch('/tickets/:ticketId/cancel', cancelParticipantTicket)
router.patch('/events/:id/submit', submitEventForReview)
router.patch('/events/:id/withdraw', withdrawEventSubmission)

// Publikasi & Zona Berbahaya (Pembatalan Acara)
router.patch('/events/:id/publish', publishEvent)
router.patch('/events/:id/cancel', cancelEventByOwner)

// Rute Pengelolaan Peserta Event
router.get('/events/:id/participants', getEventParticipants)

// Rute untuk Menyunting Draf Acara
router.put('/events/:id', updateOwnerEvent)

export default router