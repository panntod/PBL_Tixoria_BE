import prisma from '../config/prisma.js'

// 1. Pengajuan Event Baru oleh Event Owner
export const createEvent = async (req, res, next) => {
  try {
    const ownerId = req.user.id // Diambil dari JWT Token via AuthMiddleware
    const {
      judulEvent,
      deskripsi,
      tanggalMulai,
      tanggalSelesai,
      lokasi,
      bannerUrl,
      rabDetails, // Array of Object [{ namaItem, kategori, jumlahUnit, estimasiBiaya }]
      committees, // Array of Object [{ namaPanitia, posisiJabatan, kontak }]
    } = req.body

    const newEvent = await prisma.event.create({
      data: {
        ownerId,
        judulEvent,
        deskripsi,
        tanggalMulai: new Date(tanggalMulai),
        tanggalSelesai: new Date(tanggalSelesai),
        lokasi,
        bannerUrl,
        statusVerifikasi: 'PENDING',
        // Menyimpan anak tabel otomatis (Nested Writes)
        rabDetails: {
          create: rabDetails || [],
        },
        committees: {
          create: committees || [],
        },
      },
      include: {
        rabDetails: true,
        committees: true,
      },
    })

    res.status(201).json({
      success: true,
      message: 'Pengajuan event berhasil dikirim!',
      data: newEvent,
    })
  } catch (error) {
    next(error)
  }
}

// 2. Mengambil Semua Event yang Sudah Disetujui (Untuk Publik/Peserta)
export const getApprovedEvents = async (req, res, next) => {
  try {
    const events = await prisma.event.findMany({
      where: { statusVerifikasi: 'APPROVED' },
      include: {
        owner: {
          select: { nama: true, email: true },
        },
      },
      orderBy: { tanggalMulai: 'asc' },
    })

    res.status(200).json({ success: true, data: events })
  } catch (error) {
    next(error)
  }
}

// 3. Verifikasi Event oleh Admin (Approve / Reject)
export const verifyEvent = async (req, res, next) => {
  try {
    const { id } = req.params
    const { status } = req.body // Expect: 'APPROVED' atau 'REJECTED'

    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status verifikasi hanya boleh APPROVED atau REJECTED',
      })
    }

    const updatedEvent = await prisma.event.update({
      where: { id },
      data: { statusVerifikasi: status },
    })

    res.status(200).json({
      success: true,
      message: `Status event berhasil diubah menjadi ${status}`,
      data: updatedEvent,
    })
  } catch (error) {
    next(error)
  }
}

// Menampilkan Statistik & Ringkasan Event
export const getEventDashboard = async (req, res, next) => {
  try {
    const { id: eventId } = req.params

    // 1. Ambil Data Event beserta RAB & Panitia
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        rabDetails: true,
        committees: true,
      },
    })

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event tidak ditemukan!',
      })
    }

    // 2. Hitung Total Peserta Mendaftar & Total Peserta Hadir
    const totalPendaftar = await prisma.ticket.count({
      where: { eventId },
    })

    const totalHadir = await prisma.ticket.count({
      where: { eventId, statusKehadiran: true },
    })

    // 3. Hitung Total Estimasi Biaya RAB
    const totalEstimasiRAB = event.rabDetails.reduce(
      (acc, item) => acc + item.estimasiBiaya,
      0
    )

    res.status(200).json({
      success: true,
      data: {
        event,
        statistik: {
          totalPendaftar,
          totalHadir,
          persentaseKehadiran: totalPendaftar > 0 ? `${((totalHadir / totalPendaftar) * 100).toFixed(1)}%` : '0%',
          totalEstimasiRAB,
        },
      },
    })
  } catch (error) {
    next(error)
  }
}