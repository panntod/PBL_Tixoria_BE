import prisma from '../config/prisma.js'
import crypto from 'crypto'

// 1. Peserta Mendaftar Event (Mendapatkan Tiket)
export const registerTicket = async (req, res, next) => {
  try {
    const userId = req.user.id
    const { eventId } = req.body

    // Cek apakah event ada dan sudah disetujui (APPROVED)
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    })

    if (!event || event.statusVerifikasi !== 'APPROVED') {
      return res.status(400).json({
        success: false,
        message: 'Event tidak ditemukan atau belum disetujui oleh Admin!',
      })
    }

    // Cek apakah user sudah pernah mendaftar ke event ini
    const existingTicket = await prisma.ticket.findFirst({
      where: {
        eventId,
        userId,
      },
    })

    if (existingTicket) {
      return res.status(400).json({
        success: false,
        message: 'Anda sudah terdaftar dalam event ini!',
      })
    }

    // Generate Kode Tiket Unik (Format: TIX-8KarakterRandom)
    const randomCode = crypto.randomBytes(4).toString('hex').toUpperCase()
    const kodeTiket = `TIX-${randomCode}`

    // Simpan Tiket ke Database
    const newTicket = await prisma.ticket.create({
      data: {
        eventId,
        userId,
        kodeTiket,
        statusKehadiran: false,
        waktuDaftar: new Date(),
      },
      include: {
        event: {
          select: {
            judulEvent: true,
            tanggalMulai: true,
            lokasi: true,
          },
        },
      },
    })

    res.status(201).json({
      success: true,
      message: 'Pendaftaran event berhasil!',
      data: newTicket,
    })
  } catch (error) {
    next(error)
  }
}

// 2. Melihat Daftar Tiket Milik Peserta yang Sedang Login
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

    res.status(200).json({
      success: true,
      data: tickets,
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

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Tiket tidak valid atau tidak ditemukan!',
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

    res.status(200).json({
      success: true,
      message: `Presensi Berhasil! Selamat datang ${ticket.user.nama} di event ${ticket.event.judulEvent}.`,
      data: updatedTicket,
    })
  } catch (error) {
    next(error)
  }
}