import prisma from '../config/prisma.js'
import { sendSuccess } from '../utils/responseFormatter.js'

// 1. Ringkasan Dasbor Event Owner
export const getDashboardSummary = async (req, res, next) => {
  try {
    const ownerId = req.user.id

    const totalAcara = await prisma.event.count({ where: { ownerId } })
    const acaraTerbit = await prisma.event.count({ where: { ownerId, statusVerifikasi: 'TERBIT' } })
    const draftCount = await prisma.event.count({ where: { ownerId, statusVerifikasi: 'DRAF' } })
    const pendingCount = await prisma.event.count({ where: { ownerId, statusVerifikasi: 'MENUNGGU_TINJAUAN' } })

    // Total tiket terjual & pendaftar pada event milik owner
    const events = await prisma.event.findMany({
      where: { ownerId },
      include: {
        _count: { select: { tickets: { where: { statusTiket: 'AKTIF' } } } },
      },
    })

    const totalTiketTerjual = events.reduce((acc, ev) => acc + ev._count.tickets, 0)
    const acaraMenendatang = events.filter((ev) => new Date(ev.tanggalMulai) > new Date()).slice(0, 5)

    return sendSuccess(res, 200, 'Ringkasan dasbor berhasil diambil', {
      totalAcara,
      acaraTerbit,
      draftCount,
      pendingCount,
      totalTiketTerjual,
      totalPendaftar: totalTiketTerjual,
      acaraMenendatang,
    })
  } catch (error) {
    next(error)
  }
}

// 2. Daftar Acara Saya (Dengan Filter Status)
export const getOwnerEvents = async (req, res, next) => {
  try {
    const ownerId = req.user.id
    const { status, search, sortBy } = req.query

    // 1. Kondisi Filter Dasar (Kepemilikan Owner)
    const whereClause = { ownerId }

    // Filter berdasarkan Status Tab (jika ada dan bukan 'SEMUA')
    if (status && status !== 'SEMUA') {
      whereClause.statusVerifikasi = status
    }

    // Filter berdasarkan Search (Pencarian nama/judul acara)
    if (search) {
      whereClause.judulEvent = {
        contains: search,
        mode: 'insensitive', // Tidak case-sensitive (huruf besar/kecil diabaikan)
      }
    }

    // 2. Pengaturan Logika Pengurutan (SortBy)
    let orderByClause = { createdAt: 'desc' } // Default: Dibuat paling baru

    if (sortBy === 'tanggal_terdekat') {
      orderByClause = { tanggalMulai: 'asc' } // Dari tanggal event terdekat
    } else if (sortBy === 'tanggal_terjauh') {
      orderByClause = { tanggalMulai: 'desc' } // Dari tanggal event terjauh
    } else if (sortBy === 'judul_az') {
      orderByClause = { judulEvent: 'asc' } // Urut abjad A-Z
    }

    // Eksekusi Query ke Database Prisma
    const events = await prisma.event.findMany({
      where: whereClause,
      include: {
        _count: {
          select: { tickets: { where: { statusTiket: 'AKTIF' } } },
        },
      },
      orderBy: orderByClause,
    })

    return sendSuccess(res, 200, 'Daftar acara berhasil diambil', events)
  } catch (error) {
    next(error)
  }
}

// 3. Wizard Step 1: Buat Draf Acara Baru
// 3. Wizard Step 1: Buat Draf Acara Baru
export const createEventDraft = async (req, res, next) => {
  try {
    const ownerId = req.user.id
    const { 
      judulEvent, 
      kategori, 
      deskripsi, 
      posterUrl, 
      bannerUrl, 
      tanggalMulai, 
      tanggalSelesai, 
      namaTempat, 
      kota, 
      kuota 
    } = req.body

    const newEvent = await prisma.event.create({
      data: {
        ownerId,
        judulEvent: judulEvent || 'Acara Tanpa Judul',
        kategori: kategori || 'Seminar',
        deskripsi: deskripsi || 'Deskripsi belum diisi.',
        bannerUrl: posterUrl || bannerUrl || null, // Menyesuaikan dengan kolom schema.prisma (bannerUrl)
        tanggalMulai: tanggalMulai ? new Date(tanggalMulai) : new Date(),
        tanggalSelesai: tanggalSelesai ? new Date(tanggalSelesai) : new Date(),
        namaTempat: namaTempat || 'TBD',
        kota: kota || 'Malang',
        kuota: kuota ? parseInt(kuota) : 100,
        statusVerifikasi: 'DRAF',
      },
    })

    // Catat log pengajuan draf
    await prisma.eventSubmissionLog.create({
      data: {
        eventId: newEvent.id,
        status: 'DRAF',
        catatan: 'Draf acara berhasil dibuat.',
      },
    })

    return res.status(201).json({
      success: true,
      message: 'Draf acara berhasil disimpan',
      data: newEvent,
    })
  } catch (error) {
    next(error)
  }
}

// 4. Update Informasi Acara
export const updateEventInfo = async (req, res, next) => {
  try {
    const { id } = req.params
    const ownerId = req.user.id
    const dataToUpdate = req.body

    const event = await prisma.event.findUnique({ where: { id } })
    if (!event || event.ownerId !== ownerId) {
      const err = new Error('Acara tidak ditemukan atau Anda tidak memiliki hak akses!')
      err.statusCode = 404
      throw err
    }

    const updated = await prisma.event.update({
      where: { id },
      data: {
        ...(dataToUpdate.judulEvent && { judulEvent: dataToUpdate.judulEvent }),
        ...(dataToUpdate.kategori && { kategori: dataToUpdate.kategori }),
        ...(dataToUpdate.deskripsi && { deskripsi: dataToUpdate.deskripsi }),
        ...(dataToUpdate.posterUrl !== undefined && { posterUrl: dataToUpdate.posterUrl }),
        ...(dataToUpdate.tanggalMulai && { tanggalMulai: new Date(dataToUpdate.tanggalMulai) }),
        ...(dataToUpdate.tanggalSelesai && { tanggalSelesai: new Date(dataToUpdate.tanggalSelesai) }),
        ...(dataToUpdate.namaTempat && { namaTempat: dataToUpdate.namaTempat }),
        ...(dataToUpdate.kota && { kota: dataToUpdate.kota }),
        ...(dataToUpdate.kuota !== undefined && { kuota: parseInt(dataToUpdate.kuota) }),
      },
    })

    return sendSuccess(res, 200, 'Informasi acara berhasil diperbarui', updated)
  } catch (error) {
    next(error)
  }
}

// 5. Kelola Kategori Tiket (Tab Tiket)
export const manageTicketCategory = async (req, res, next) => {
  try {
    const { eventId } = req.params
    const { namaKategori, harga, kuota, mulaiJual, berakhir, wajibKTM } = req.body

    const category = await prisma.ticketCategory.create({
      data: {
        eventId,
        namaKategori,
        harga: parseFloat(harga) || 0,
        kuota: parseInt(kuota) || 0,
        mulaiJual: mulaiJual ? new Date(mulaiJual) : null,
        berakhir: berakhir ? new Date(berakhir) : null,
        wajibKTM: wajibKTM ?? false,
      },
    })

    return sendSuccess(res, 201, 'Kategori tiket berhasil ditambahkan', category)
  } catch (error) {
    next(error)
  }
}

// 6. Kelola Rundown Acara & PIC Panitia (Tab Rundown)
// 6. Kelola Rundown Acara & PIC Panitia (Tab Rundown)
export const manageRundown = async (req, res, next) => {
  try {
    const { eventId } = req.params
    const { judulSesi, waktuMulai, waktuSelesai, pembicara, keterangan, picId, committeeId } = req.body

    const rundown = await prisma.rundown.create({
      data: {
        eventId,
        judulSesi,
        waktuMulai,
        waktuSelesai,
        pembicara,
        keterangan,
        committeeId: committeeId || picId || null, // Menyesuaikan dengan schema.prisma (committeeId)
      },
      include: { pic: true },
    })

    return res.status(201).json({
      success: true,
      message: 'Sesi rundown berhasil ditambahkan',
      data: rundown,
    })
  } catch (error) {
    next(error)
  }
}

// 7. Kelola Anggota Panitia (Tab Panitia)
export const managePanitia = async (req, res, next) => {
  try {
    const { eventId } = req.params
    const { nama, peran, divisi, noWhatsApp, surel, namaPanitia, posisiJabatan, kontak } = req.body

    const panitia = await prisma.committee.create({
      data: {
        eventId,
        namaPanitia: namaPanitia || nama,
        posisiJabatan: posisiJabatan || peran,
        divisi,
        kontak: kontak || noWhatsApp,
        surel,
      },
    })

    return res.status(201).json({
      success: true,
      message: 'Anggota panitia berhasil ditambahkan',
      data: panitia,
    })
  } catch (error) {
    next(error)
  }
}

// 8. Kelola RAB / Anggaran (Tab RAB)
// 8. Kelola RAB / Anggaran (Tab RAB)
export const manageRabItem = async (req, res, next) => {
  try {
    const { eventId } = req.params
    const { kategori, rencana, realisasi } = req.body

    const rab = await prisma.rabDetail.create({
      data: {
        eventId,
        kategori,
        rencana: parseFloat(rencana) || 0,
        realisasi: parseFloat(realisasi) || 0,
      },
    })

    return res.status(201).json({
      success: true,
      message: 'Item RAB berhasil ditambahkan',
      data: rab,
    })
  } catch (error) {
    next(error)
  }
}

// 9. Kelola Peserta & Batalkan Tiket Peserta (Tab Peserta)
export const cancelParticipantTicket = async (req, res, next) => {
  try {
    const { ticketId } = req.params

    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } })
    if (!ticket) {
      const err = new Error('Tiket peserta tidak ditemukan!')
      err.statusCode = 404
      throw err
    }

    const updated = await prisma.ticket.update({
      where: { id: ticketId },
      data: { statusTiket: 'BATAL' },
    })

    return sendSuccess(res, 200, 'Tiket peserta berhasil dibatalkan', updated)
  } catch (error) {
    next(error)
  }
}

// 10. Pengajuan & Tarik Pengajuan Acara (Tab Pengajuan)
export const submitEventForReview = async (req, res, next) => {
  try {
    const { id } = req.params

    const event = await prisma.event.update({
      where: { id },
      data: { statusVerifikasi: 'MENUNGGU_TINJAUAN' },
    })

    await prisma.eventSubmissionLog.create({
      data: {
        eventId: id,
        status: 'MENUNGGU_TINJAUAN',
        catatan: 'Acara diajukan kembali untuk ditinjau oleh admin.',
      },
    })

    return sendSuccess(res, 200, 'Acara berhasil diajukan untuk ditinjau', event)
  } catch (error) {
    next(error)
  }
}

export const withdrawEventSubmission = async (req, res, next) => {
  try {
    const { id } = req.params

    const event = await prisma.event.update({
      where: { id },
      data: { statusVerifikasi: 'DRAF' },
    })

    await prisma.eventSubmissionLog.create({
      data: {
        eventId: id,
        status: 'DRAF',
        catatan: 'Pengajuan ditarik kembali ke draf.',
      },
    })

    return sendSuccess(res, 200, 'Pengajuan acara berhasil ditarik ke draf', event)
  } catch (error) {
    next(error)
  }
}

// 11. Zona Berbahaya: Batalkan Acara (Wajib alasan minimal 20 karakter)
export const cancelEventByOwner = async (req, res, next) => {
  try {
    const { id } = req.params
    const { alasanPembatalan } = req.body

    if (!alasanPembatalan || alasanPembatalan.length < 20) {
      const err = new Error('Alasan pembatalan wajib diisi dan minimal 20 karakter!')
      err.statusCode = 400
      throw err
    }

    // 1. Perbarui status event menjadi BATAL dan simpan alasannya
    const event = await prisma.event.update({
      where: { id },
      data: {
        statusVerifikasi: 'BATAL',
        alasanPembatalan,
      },
    })

    // 2. Batalkan seluruh tiket aktif pada event tersebut secara otomatis
    await prisma.ticket.updateMany({
      where: { eventId: id },
      data: { statusTiket: 'BATAL' },
    })

    // 3. Catat ke dalam log riwayat pengajuan (EventSubmissionLog)
    await prisma.eventSubmissionLog.create({
      data: {
        eventId: id,
        status: 'BATAL',
        catatan: `Acara dibatalkan oleh penyelenggara. Alasan: ${alasanPembatalan}`,
      },
    })

    return res.status(200).json({
      success: true,
      message: 'Acara berhasil dibatalkan secara permanen',
      data: event,
    })
  } catch (error) {
    next(error)
  }
}

// 12. Publikasikan Acara (Tab Pengaturan)
export const publishEvent = async (req, res, next) => {
  try {
    const { id } = req.params

    const event = await prisma.event.findUnique({ where: { id } })
    if (!event || event.statusVerifikasi !== 'DISETUJUI') {
      const err = new Error('Acara harus berstatus disetujui oleh admin sebelum dapat diterbitkan!')
      err.statusCode = 400
      throw err
    }

    const published = await prisma.event.update({
      where: { id },
      data: { statusVerifikasi: 'TERBIT' },
    })

    return sendSuccess(res, 200, 'Acara berhasil diterbitkan ke halaman publik', published)
  } catch (error) {
    next(error)
  }
}

// 13. Mendapatkan daftar peserta event (mendukung pencarian nama/nomor tiket & filter status)
export const getEventParticipants = async (req, res, next) => {
  try {
    const { id } = req.params // eventId
    const { search, status } = req.query

    const whereClause = { eventId: id }

    if (status) {
      whereClause.statusTiket = status
    }

    // Mendukung fitur pencarian berdasarkan nama peserta atau nomor tiket sesuai UI/UX
    if (search) {
      whereClause.OR = [
        { kodeTiket: { contains: search, mode: 'insensitive' } },
        { user: { nama: { contains: search, mode: 'insensitive' } } },
      ]
    }

    const participants = await prisma.ticket.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            nama: true,
            email: true,
            noWhatsApp: true,
            institusi: true,
          },
        },
        ticketCategory: true,
      },
      orderBy: { waktuDaftar: 'desc' },
    })

    return sendSuccess(res, 200, 'Daftar peserta berhasil diambil', participants)
  } catch (error) {
    next(error)
  }
}

// 14. Sunting Detail Acara (Hanya dapat disunting saat status DRAF)
export const updateOwnerEvent = async (req, res, next) => {
  try {
    const { id } = req.params // eventId
    const ownerId = req.user.id
    const { 
      judulEvent, 
      kategori, 
      deskripsi, 
      posterUrl, 
      bannerUrl, 
      tanggalMulai, 
      tanggalSelesai, 
      namaTempat, 
      kota, 
      kuota 
    } = req.body

    // 1. Periksa apakah event ada dan milik owner yang sedang login
    const existingEvent = await prisma.event.findFirst({
      where: { id, ownerId }
    })

    if (!existingEvent) {
      const err = new Error('Acara tidak ditemukan atau Anda tidak memiliki hak akses!')
      err.statusCode = 404
      throw err
    }

    // 2. Validasi aturan bisnis: Hanya boleh disunting jika statusnya DRAF
    if (existingEvent.statusVerifikasi !== 'DRAF') {
      const err = new Error('Acara tidak dapat disunting karena sudah diajukan, disetujui, atau diterbitkan. Tarik pengajuan ke draf terlebih dahulu.')
      err.statusCode = 400
      throw err
    }

    // 3. Perbarui data acara (mempertahankan nilai lama jika field tidak dikirim)
    const updatedEvent = await prisma.event.update({
      where: { id },
      data: {
        judulEvent: judulEvent !== undefined ? judulEvent : existingEvent.judulEvent,
        kategori: kategori !== undefined ? kategori : existingEvent.kategori,
        deskripsi: deskripsi !== undefined ? deskripsi : existingEvent.deskripsi,
        bannerUrl: posterUrl !== undefined ? posterUrl : (bannerUrl !== undefined ? bannerUrl : existingEvent.bannerUrl),
        tanggalMulai: tanggalMulai ? new Date(tanggalMulai) : existingEvent.tanggalMulai,
        tanggalSelesai: tanggalSelesai ? new Date(tanggalSelesai) : existingEvent.tanggalSelesai,
        namaTempat: namaTempat !== undefined ? namaTempat : existingEvent.namaTempat,
        kota: kota !== undefined ? kota : existingEvent.kota,
        kuota: kuota !== undefined ? parseInt(kuota) : existingEvent.kuota,
      },
    })

    return res.status(200).json({
      success: true,
      message: 'Detail draf acara berhasil diperbarui',
      data: updatedEvent,
    })
  } catch (error) {
    next(error)
  }
}