import express from 'express'
import {
  getAdminDashboard,
  getAdminEventWorkflowQueue,
  approveEventByAdmin,
  rejectEventByAdmin,
  getAllUsersByAdmin,
  suspendAccountByAdmin,
  getAdminReports,
  getModerationLogs,
  getAdminNotifications,
  markAllNotificationsAsRead,
  getAdminEventDetail,
} from '../controllers/AdminController.js'
import { authenticate, isAdmin } from '../middlewares/AuthMiddleware.js'

const router = express.Router()

// Terapkan middleware autentikasi dan otorisasi khusus ADMIN untuk semua rute di bawah ini
router.use(authenticate, isAdmin)

// Dasbor & Statistik
router.get('/dashboard', getAdminDashboard)

// Antrean & Moderasi Acara
router.get('/events/queue', getAdminEventWorkflowQueue)
router.patch('/events/:id/approve', approveEventByAdmin)
router.patch('/events/:id/reject', rejectEventByAdmin)

// Manajemen Pengguna & Akun
router.get('/users', getAllUsersByAdmin)
router.patch('/users/:id/suspend', suspendAccountByAdmin)

router.get('/notifications', getAdminNotifications)
router.patch('/notifications/mark-all-read', markAllNotificationsAsRead)

router.get('/events/queue', getAdminEventWorkflowQueue)
router.get('/events/:id', getAdminEventDetail)
router.patch('/events/:id/approve', approveEventByAdmin)
router.patch('/events/:id/reject', rejectEventByAdmin)

// Laporan & Riwayat Audit Moderasi
router.get('/reports', getAdminReports)
router.get('/moderation-logs', getModerationLogs)

export default router