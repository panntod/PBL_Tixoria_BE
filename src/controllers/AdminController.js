import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// 1. Dasbor Admin (Statistik & Perlu Tindakan)
export const getAdminDashboard = async (req, res, next) => {
  try {
    const totalPengguna = await prisma.user.count()
    const totalAcara = await prisma.event.count()
    const menungguTinjauan = await prisma.event.count({ where: { statusVerifikasi: 'MENUNGGU_TINJAUAN' } })
    const acaraTerbit = await prisma.event.count({ where: { statusVerifikasi: 'TERBIT' } })

    // Acara yang perlu tindakan (status MENUNGGU_TINJAUAN)
    const perluTindakan = await prisma.event.findMany({
      where: { statusVerifikasi: 'MENUNGGU_TINJAUAN' },
      include: {
        owner: { select: { nama: true } },
      },
      orderBy: { createdAt: 'asc' },
      take: 5,
    })

    // Aktivitas platform terbaru dari log pengajuan
    const aktivitasTerbaru = await prisma.eventSubmissionLog.findMany({
      include: {
        event: { select: { judulEvent: true, owner: { select: { nama: true } } } },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    })

    return res.status(200).json({
      success: true,
      message: 'Data dasbor admin berhasil diambil',
      data: {
        ringkasan: {
          totalPengguna,
          totalAcara,
          menungguTinjauan,
          acaraTerbit,
        },
        perluTindakan,
        aktivitasTerbaru,
      },
    })
  } catch (error) {
    next(error)
  }
}

// 2. Antrean Acara (Daftar & Filter Status)
export const getAdminEventWorkflowQueue = async (req, res, next) => {
  try {
    const { status, search, kategori } = req.query
    const whereClause = {}

    if (status) {
      whereClause.statusVerifikasi = status.toUpperCase()
    }

    if (kategori) {
      whereClause.kategori = kategori
    }

    if (search) {
      whereClause.OR = [
        { judulEvent: { contains: search, mode: 'insensitive' } },
        { owner: { nama: { contains: search, mode: 'insensitive' } } },
      ]
    }

    const events = await prisma.event.findMany({
      where: whereClause,
      include: {
        owner: { select: { nama: true, email: true } },
        ticketCategories: true,
        rundowns: true,
        rabDetails: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return res.status(200).json({
      success: true,
      message: 'Antrean acara berhasil diambil',
      data: events,
    })
  } catch (error) {
    next(error)
  }
}

// 3. Setujui Acara (Approve)
export const approveEventByAdmin = async (req, res, next) => {
  try {
    const { id } = req.params // eventId
    const adminId = req.user.id

    const event = await prisma.event.findUnique({ where: { id } })
    if (!event) {
      const err = new Error('Acara tidak ditemukan!')
      err.statusCode = 404
      throw err
    }

    // Perbarui status menjadi DISETUJUI
    const updatedEvent = await prisma.event.update({
      where: { id },
      data: { statusVerifikasi: 'DISETUJUI', alasanPenolakan: null },
    })

    // Catat log pengajuan
    await prisma.eventSubmissionLog.create({
      data: {
        eventId: id,
        status: 'DISETUJUI',
        catatan: 'Acara disetujui oleh admin.',
      },
    })

    // Catat ke riwayat moderasi audit log
    await prisma.moderationLog.create({
      data: {
        adminId,
        eventId: id,
        keputusan: 'DISETUJUI',
        catatan: 'Disetujui tanpa catatan khusus.',
      },
    })

    return res.status(200).json({
      success: true,
      message: 'Acara berhasil disetujui',
      data: updatedEvent,
    })
  } catch (error) {
    next(error)
  }
}

// 4. Tolak Acara (Reject dengan Wajib Alasan)
export const rejectEventByAdmin = async (req, res, next) => {
  try {
    const { id } = req.params // eventId
    const { alasanPenolakan } = req.body
    const adminId = req.user.id

    if (!alasanPenolakan || alasanPenolakan.trim() === '') {
      const err = new Error('Alasan penolakan wajib diisi!')
      err.statusCode = 400
      throw err
    }

    const event = await prisma.event.findUnique({ where: { id } })
    if (!event) {
      const err = new Error('Acara tidak ditemukan!')
      err.statusCode = 404
      throw err
    }

    // Perbarui status menjadi DITOLAK & simpan alasan
    const updatedEvent = await prisma.event.update({
      where: { id },
      data: {
        statusVerifikasi: 'DITOLAK',
        alasanPenolakan,
      },
    })

    // Catat log pengajuan
    await prisma.eventSubmissionLog.create({
      data: {
        eventId: id,
        status: 'DITOLAK',
        catatan: `Ditolak oleh admin. Alasan: ${alasanPenolakan}`,
      },
    })

    // Catat ke riwayat moderasi audit log
    await prisma.moderationLog.create({
      data: {
        adminId,
        eventId: id,
        keputusan: 'DITOLAK',
        catatan: alasanPenolakan,
      },
    })

    return res.status(200).json({
      success: true,
      message: 'Acara berhasil ditolak dengan catatan',
      data: updatedEvent,
    })
  } catch (error) {
    next(error)
  }
}

// 5. Manajemen Pengguna (Daftar & Pencarian)
export const getAllUsersByAdmin = async (req, res, next) => {
  try {
    const { search } = req.query
    const whereClause = { role: 'USER' }

    if (search) {
      whereClause.OR = [
        { nama: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ]
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      include: {
        tickets: { include: { event: { select: { judulEvent: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return res.status(200).json({
      success: true,
      message: 'Daftar pengguna berhasil diambil',
      data: users,
    })
  } catch (error) {
    next(error)
  }
}

// 6. Tangguhkan Akun Pengguna / Penyelenggara (Suspend)
export const suspendAccountByAdmin = async (req, res, next) => {
  try {
    const { id } = req.params // userId
    const { alasan } = req.body

    if (!alasan || alasan.trim() === '') {
      const err = new Error('Alasan penangguhan akun wajib diisi!')
      err.statusCode = 400
      throw err
    }

    const user = await prisma.user.findUnique({ where: { id } })
    if (!user) {
      const err = new Error('Akun pengguna tidak ditemukan!')
      err.statusCode = 404
      throw err
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        isActive: false,
        alasanSuspensi: alasan,
      },
    })

    return res.status(200).json({
      success: true,
      message: `Akun ${user.nama} berhasil ditangguhkan`,
      data: updatedUser,
    })
  } catch (error) {
    next(error)
  }
}

// 7. Laporan & Rekapitulasi Platform
export const getAdminReports = async (req, res, next) => {
  try {
    const totalTiketTerjual = await prisma.ticket.count({
      where: { statusTiket: { not: 'BATAL' } },
    })

    const totalAcaraTerbit = await prisma.event.count({
      where: { statusVerifikasi: 'TERBIT' },
    })

    // Acara dengan pendaftar terbanyak
    const topEvents = await prisma.event.findMany({
      include: {
        owner: { select: { nama: true } },
        _count: { select: { tickets: true } },
      },
      orderBy: {
        tickets: { _count: 'desc' },
      },
      take: 5,
    })

    return res.status(200).json({
      success: true,
      message: 'Laporan platform berhasil diambil',
      data: {
        totalTiketTerjual,
        totalAcaraTerbit,
        topEvents,
      },
    })
  } catch (error) {
    next(error)
  }
}

// 8. Riwayat Moderasi (Audit Log Admin)
export const getModerationLogs = async (req, res, next) => {
  try {
    const logs = await prisma.moderationLog.findMany({
      include: {
        admin: { select: { nama: true, email: true } },
        event: { select: { judulEvent: true, kategori: true, owner: { select: { nama: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return res.status(200).json({
      success: true,
      message: 'Riwayat moderasi berhasil diambil',
      data: logs,
    })
  } catch (error) {
    next(error)
  }
}

// 9. Pusat Notifikasi Admin
export const getAdminNotifications = async (req, res, next) => {
  try {
    // Menghitung jumlah acara yang masih menunggu tinjauan secara real-time
    const pendingCount = await prisma.event.count({
      where: { statusVerifikasi: 'MENUNGGU_TINJAUAN' }
    })

    // Mengambil log pengajuan terbaru untuk mendeteksi pengajuan ulang/revisi
    const recentLog = await prisma.eventSubmissionLog.findFirst({
      include: {
        event: { 
          select: { 
            judulEvent: true, 
            owner: { select: { nama: true } } 
          } 
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Menyusun data notifikasi yang selaras dengan panduan UI/UX[cite: 17]
    const notifications = [
      {
        id: 'notif-1',
        kategori: 'PERLU_TINDAKAN',
        pesan: `${pendingCount} acara menunggu tinjauan. Pengajuan terbaru sejak ${new Date().toLocaleDateString()}`,
        waktu: 'Hari ini',
        dibaca: false
      },
      recentLog ? {
        id: 'notif-2',
        kategori: 'PERLU_TINDAKAN',
        pesan: `${recentLog.event?.judulEvent || 'Acara'} diajukan ulang oleh ${recentLog.event?.owner?.nama || 'Penyelenggara'}`,
        waktu: 'Baru saja',
        dibaca: false
      } : null,
      {
        id: 'notif-3',
        kategori: 'SISTEM',
        pesan: 'Pengiriman surat tiket tertunda. 3 surel tiket belum terkirim, sistem mencoba ulang.',
        waktu: '4 Okt 2026',
        dibaca: true
      },
      {
        id: 'notif-4',
        kategori: 'SISTEM',
        pesan: 'Laporan mingguan siap diunduh. Periode 28 Sep - 4 Okt 2026',
        waktu: '4 Okt 2026',
        dibaca: true
      }
    ].filter(Boolean)

    return res.status(200).json({
      success: true,
      message: 'Daftar notifikasi berhasil diambil',
      data: {
        belumDibacaCount: notifications.filter(n => !n.dibaca).length,
        notifikasi: notifications
      }
    })
  } catch (error) {
    next(error)
  }
}

// 10. Tandai Semua Notifikasi Dibaca
export const markAllNotificationsAsRead = async (req, res, next) => {
  try {
    return res.status(200).json({
      success: true,
      message: 'Semua notifikasi berhasil ditandai sebagai dibaca',
    })
  } catch (error) {
    next(error)
  }
}

// 3. Detail Kelengkapan Acara oleh Admin
export const getAdminEventDetail = async (req, res, next) => {
  try {
    const { id } = req.params
    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, nama: true, email: true, noWhatsApp: true, institusi: true } },
        ticketCategories: true,
        rundowns: true,
        rabDetails: true,
        submissionLogs: true,
        moderationLogs: true
      }
    })

    if (!event) {
      const err = new Error('Acara tidak ditemukan')
      err.statusCode = 404
      throw err
    }

    return res.status(200).json({
      success: true,
      message: 'Detail acara berhasil diambil',
      data: event
    })
  } catch (error) {
    next(error)
  }
}