import prisma from '../config/prisma.js'
import { sendSuccess } from '../utils/responseFormatter.js'

// 1. Pengajuan Event Baru oleh Event Owner
export const createEvent = async (req, res, next) => {
  try {
    const ownerId = req.user.id
    const {
      judulEvent,
      deskripsi,
      kategori = 'Seminar',
      kuota = 100,
      tanggalMulai,
      tanggalSelesai,
      lokasi,
      bannerUrl,
      rabDetails,
      committees,
      rundowns,
    } = req.body

    const newEvent = await prisma.event.create({
      data: {
        ownerId,
        judulEvent,
        deskripsi,
        kategori,
        kuota: Number(kuota),
        tanggalMulai: new Date(tanggalMulai),
        tanggalSelesai: new Date(tanggalSelesai),
        lokasi,
        bannerUrl,
        statusVerifikasi: 'PENDING',
        rabDetails: {
          create: rabDetails || [],
        },
        committees: {
          create: committees || [],
        },
        rundowns: {
          create: (rundowns || []).map((item) => ({
            waktuMulai: new Date(item.waktuMulai),
            waktuSelesai: new Date(item.waktuSelesai),
            judulSesi: item.judulSesi,
            pembicara: item.pembicara,
            keterangan: item.keterangan,
          })),
        },
      },
      include: {
        rabDetails: true,
        committees: true,
        rundowns: true,
      },
    })

    return sendSuccess(res, 201, 'Pengajuan event berhasil dikirim!', newEvent)
  } catch (error) {
    next(error)
  }
}

// 2. Mengambil Semua Event yang Sudah Disetujui (Publik + Search + Filter Kategori + Sort)
export const getApprovedEvents = async (req, res, next) => {
  try {
    const { search, kategori, sortBy } = req.query

    const whereCondition = {
      statusVerifikasi: 'APPROVED',
      ...(kategori && kategori !== 'Semua' && { kategori }),
      ...(search && {
        OR: [
          { judulEvent: { contains: search, mode: 'insensitive' } },
          { deskripsi: { contains: search, mode: 'insensitive' } },
          { lokasi: { contains: search, mode: 'insensitive' } },
        ],
      }),
    }

    const events = await prisma.event.findMany({
      where: whereCondition,
      include: {
        owner: {
          select: { nama: true, email: true },
        },
        _count: {
          select: { tickets: { where: { statusTiket: 'AKTIF' } } },
        },
      },
      orderBy: sortBy === 'terdekat' ? { tanggalMulai: 'asc' } : { createdAt: 'desc' },
    })

    const formattedEvents = events.map((event) => ({
      ...event,
      totalPendaftar: event._count.tickets,
      sisaKuota: Math.max(0, event.kuota - event._count.tickets),
    }))

    return sendSuccess(res, 200, 'Daftar event yang disetujui berhasil diambil', formattedEvents)
  } catch (error) {
    next(error)
  }
}

// 3. Verifikasi Event oleh Admin (Approve / Reject)
export const verifyEvent = async (req, res, next) => {
  try {
    const { id } = req.params
    const { status } = req.body

    if (!['APPROVED', 'REJECTED'].includes(status)) {
      const error = new Error('Status verifikasi hanya boleh APPROVED atau REJECTED')
      error.statusCode = 400
      throw error
    }

    const updatedEvent = await prisma.event.update({
      where: { id },
      data: { statusVerifikasi: status },
    })

    return sendSuccess(res, 200, `Status event berhasil diubah menjadi ${status}`, updatedEvent)
  } catch (error) {
    next(error)
  }
}

// 4. Menampilkan Statistik & Ringkasan Event
export const getEventDashboard = async (req, res, next) => {
  try {
    const { id: eventId } = req.params

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        rabDetails: true,
        committees: true,
      },
    })

    if (!event) {
      const error = new Error('Event tidak ditemukan!')
      error.statusCode = 404
      throw error
    }

    const totalPendaftar = await prisma.ticket.count({
      where: { eventId, statusTiket: 'AKTIF' },
    })

    const totalHadir = await prisma.ticket.count({
      where: { eventId, statusKehadiran: true, statusTiket: 'AKTIF' },
    })

    const totalEstimasiRAB = event.rabDetails.reduce(
      (acc, item) => acc + Number(item.estimasiBiaya),
      0
    )

    const dashboardData = {
      event,
      statistik: {
        totalPendaftar,
        totalHadir,
        persentaseKehadiran: totalPendaftar > 0 ? `${((totalHadir / totalPendaftar) * 100).toFixed(1)}%` : '0%',
        totalEstimasiRAB,
        sisaKuota: Math.max(0, event.kuota - totalPendaftar),
      },
    }

    return sendSuccess(res, 200, 'Dashboard event berhasil diambil', dashboardData)
  } catch (error) {
    next(error)
  }
}

// 5. Mengambil Detail Event Berdasarkan ID
export const getEventById = async (req, res, next) => {
  try {
    const { id } = req.params

    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        owner: { select: { nama: true, email: true } },
        rabDetails: true,
        committees: true,
        rundowns: {
          orderBy: { waktuMulai: 'asc' },
        },
        _count: {
          select: { tickets: { where: { statusTiket: 'AKTIF' } } },
        },
      },
    })

    if (!event) {
      const error = new Error('Event dengan ID tersebut tidak ditemukan!')
      error.statusCode = 404
      throw error
    }

    const eventDetail = {
      ...event,
      totalPendaftar: event._count.tickets,
      sisaKuota: Math.max(0, event.kuota - event._count.tickets),
    }

    return sendSuccess(res, 200, 'Detail event berhasil ditemukan', eventDetail)
  } catch (error) {
    if (error.code === 'P2023' || error.message.includes('UUID')) {
      error.statusCode = 400
      error.message = 'Format ID event tidak valid!'
    }
    next(error)
  }
}

// 6. Mengambil Semua Event dengan Pagination
export const getAllEvents = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query
    const skip = (Number(page) - 1) * Number(limit)

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        skip,
        take: Number(limit),
        include: {
          owner: {
            select: {
              nama: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.event.count(),
    ])

    const pagination = {
      current_page: Number(page),
      per_page: Number(limit),
      total_data: total,
      total_pages: Math.ceil(total / Number(limit)),
    }

    return sendSuccess(res, 200, 'Daftar event berhasil diambil', events, pagination)
  } catch (error) {
    next(error)
  }
}