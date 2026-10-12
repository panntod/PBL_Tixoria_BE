import prisma from '../config/prisma.js'
import crypto from 'crypto'

// 1. Peserta Mendaftar Event (Mendapatkan Tiket Gratis + Validasi Kuota)
export const registerTicket = async (req, res, next) => {
  try {
    const userId = req.user.id
    const { eventId, jenisTiket, noWhatsApp, institusi } = req.body

    // Cek apakah event ada dan sudah disetujui (APPROVED)
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        _count: {
          select: { tickets: { where: { statusTiket: 'AKTIF' } } },
        },
      },
    })

    if (!event || event.statusVerifikasi !== 'APPROVED') {
      return res.status(400).json({
        success: false,
        message: 'Event tidak ditemukan atau belum disetujui oleh Admin!',
      })
    }

    // Cek Kuota Tersisa
    if (event._count.tickets >= event.kuota) {
      return res.status(400).json({
        success: false,
        message: 'Mohon maaf, kuota pendaftaran untuk event ini sudah penuh!',
      })
    }

    // Cek apakah user sudah pernah mendaftar ke event ini dengan status AKTIF
    const existingTicket = await prisma.ticket.findFirst({
      where: {
        eventId,
        userId,
        statusTiket: 'AKTIF',
      },
    })

    if (existingTicket) {
      return res.status(400).json({
        success: false,
        message: 'Anda sudah terdaftar dalam event ini!',
      })
    }

    // Update data profil user (noWhatsApp & institusi) jika dikirimkan dari form pendaftaran
    if (noWhatsApp || institusi) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          ...(noWhatsApp && { noWhatsApp }),
          ...(institusi && { institusi }),
        },
      })
    }

    // Generate Kode Tiket Unik (Format: TXR-YYYYMMDD-Random)
    const randomCode = crypto.randomBytes(2).toString('hex').toUpperCase()
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '')
    const kodeTiket = `TXR-${dateStr}-${randomCode}`

    // Simpan Tiket ke Database
    const newTicket = await prisma.ticket.create({
      data: {
        eventId,
        userId,
        kodeTiket,
        jenisTiket,
        statusTiket: 'AKTIF',
        statusKehadiran: false,
        waktuDaftar: new Date(),
      },
      include: {
        event: {
          select: {
            judulEvent: true,
            tanggalMulai: true,
            tanggalSelesai: true,
            lokasi: true,
            bannerUrl: true,
          },
        },
        user: {
          select: {
            nama: true,
            email: true,
            noWhatsApp: true,
            institusi: true,
          },
        },
      },
    })

    return res.status(201).json({
      success: true,
      message: 'Pendaftaran event berhasil!',
      data: newTicket,
    })
  } catch (error) {
    next(error)
  }
}

// 2. Melihat Daftar Tiket Milik Peserta (Dengan Pengelompokan Kategori Tab UI: Akan Datang, Selesai, Dibatalkan)
export const getMyTickets = async (req, res, next) => {
  try {
    const userId = req.user.id
    const tickets = await prisma.ticket.findMany({
      where: { userId },
      include: {
        event: true,
      },
      orderBy: { waktuDaftar: 'desc' },
    })

    const now = new Date()

    const formattedTickets = tickets.map((t) => {
      let statusKategori = 'AKAN_DATANG' // Default Tab 1

      if (t.statusTiket === 'BATAL') {
        statusKategori = 'DIBATALKAN' // Tab 3
      } else if (new Date(t.event.tanggalSelesai) < now) {
        statusKategori = 'SELESAI' // Tab 2
      }

      return {
        ...t,
        kategoriStatus: statusKategori,
      }
    })

    return res.status(200).json({
      success: true,
      data: formattedTickets,
    })
  } catch (error) {
    next(error)
  }
}

// 3. Scan QR Code Tiket (Oleh Panitia / Admin pada Hari-H)
export const scanTicket = async (req, res, next) => {
  try {
    const { kodeTiket } = req.body

    const ticket = await prisma.ticket.findUnique({
      where: { kodeTiket },
      include: {
        user: { select: { nama: true, email: true } },
        event: { select: { judulEvent: true } },
      },
    })

    if (!ticket || ticket.statusTiket !== 'AKTIF') {
      return res.status(404).json({
        success: false,
        message: 'Tiket tidak valid, sudah dibatalkan, atau tidak ditemukan!',
      })
    }

    if (ticket.statusKehadiran) {
      return res.status(400).json({
        success: false,
        message: `Tiket ini SUDAH DIGUNAKAN oleh ${ticket.user.nama}!`,
      })
    }

    // Ubah status kehadiran menjadi true (Hadir)
    const updatedTicket = await prisma.ticket.update({
      where: { kodeTiket },
      data: { statusKehadiran: true },
    })

    return res.status(200).json({
      success: true,
      message: `Presensi Berhasil! Selamat datang ${ticket.user.nama} di event ${ticket.event.judulEvent}.`,
      data: updatedTicket,
    })
  } catch (error) {
    next(error)
  }
}

// 4. Melihat Detail Tiket Digital Spesifik Berdasarkan ID Tiket
export const getTicketById = async (req, res, next) => {
  try {
    const { id } = req.params
    const userId = req.user.id

    const ticket = await prisma.ticket.findUnique({
      where: { id },
      include: {
        event: true,
        user: {
          select: {
            nama: true,
            email: true,
            noWhatsApp: true,
            institusi: true,
          },
        },
      },
    })

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Tiket tidak ditemukan!',
      })
    }

    // Keamanan: Cek apakah user adalah pemilik tiket atau memiliki role ADMIN / EVENT_OWNER
    if (ticket.userId !== userId && req.user.role !== 'ADMIN' && req.user.role !== 'EVENT_OWNER') {
      return res.status(403).json({
        success: false,
        message: 'Akses ditolak! Anda tidak berhak melihat tiket ini.',
      })
    }

    return res.status(200).json({
      success: true,
      message: 'Detail tiket digital berhasil diambil',
      data: ticket,
    })
  } catch (error) {
    if (error.code === 'P2023' || error.message.includes('UUID')) {
      return res.status(400).json({
        success: false,
        message: 'Format ID tiket tidak valid!',
      })
    }
    next(error)
  }
}