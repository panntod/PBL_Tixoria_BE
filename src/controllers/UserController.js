import prisma from '../config/prisma.js'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { sendSuccess } from '../utils/responseFormatter.js'

// Format data user yang aman dikembalikan ke client (tanpa password)
const userSelect = {
  id: true,
  nama: true,
  email: true,
  noWhatsApp: true,
  institusi: true,
  roleId: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
  role: true,
}

export const getAllUsers = async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      select: userSelect,
      orderBy: { createdAt: 'desc' },
    })
    return sendSuccess(res, 200, 'Daftar user berhasil diambil', users)
  } catch (error) {
    next(error)
  }
}

export const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params
    const user = await prisma.user.findUnique({
      where: { id },
      select: userSelect,
    })

    if (!user) {
      const error = new Error('User tidak ditemukan')
      error.statusCode = 404
      throw error
    }

    return sendSuccess(res, 200, 'Detail user berhasil ditemukan', user)
  } catch (error) {
    next(error)
  }
}

export const createUser = async (req, res, next) => {
  try {
    const { nama, email, password, roleId, isActive, noWhatsApp, institusi } = req.body

    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser) {
      const error = new Error('Email sudah digunakan')
      error.statusCode = 400
      throw error
    }

    const role = await prisma.role.findUnique({ where: { id: roleId } })
    if (!role) {
      const error = new Error('Role tidak ditemukan')
      error.statusCode = 404
      throw error
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const newUser = await prisma.user.create({
      data: {
        nama,
        email,
        password: hashedPassword,
        roleId,
        isActive: isActive ?? true,
        noWhatsApp: noWhatsApp || null,
        institusi: institusi || null,
      },
      select: userSelect,
    })

    return sendSuccess(res, 201, 'User berhasil dibuat', newUser)
  } catch (error) {
    next(error)
  }
}

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body

    const user = await prisma.user.findUnique({
      where: { email },
      include: { role: true },
    })

    if (!user) {
      const error = new Error('Email atau password salah')
      error.statusCode = 401
      throw error
    }

    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      const error = new Error('Email atau password salah')
      error.statusCode = 401
      throw error
    }

    if (!user.isActive) {
      const error = new Error('Akun Anda sedang tidak aktif')
      error.statusCode = 403
      throw error
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role.kode },
      process.env.JWT_SECRET || 'tixoria_pbl_secret',
      { expiresIn: '1d' }
    )

    const { password: _, ...userData } = user

    return sendSuccess(res, 200, 'Login berhasil', {
      token,
      data: userData,
    })
  } catch (error) {
    next(error)
  }
}

// 1. Memperbarui Profil Pengguna (Halaman Akun Saya)[cite: 137, 138]
export const updateProfile = async (req, res, next) => {
  try {
    const userId = req.user.id
    const { nama, noWhatsApp, institusi } = req.body

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(nama && { nama }),
        ...(noWhatsApp !== undefined && { noWhatsApp }),
        ...(institusi !== undefined && { institusi }),
      },
      select: userSelect,
    })

    return sendSuccess(res, 200, 'Profil berhasil diperbarui', updatedUser)
  } catch (error) {
    next(error)
  }
}

// 2. Ganti Kata Sandi (Halaman Akun Saya)[cite: 137, 138]
export const changePassword = async (req, res, next) => {
  try {
    const userId = req.user.id
    const { kataSandiBaru } = req.body

    if (!kataSandiBaru || kataSandiBaru.length < 6) {
      const error = new Error('Kata sandi baru minimal harus 6 karakter!')
      error.statusCode = 400
      throw error
    }

    const hashedPassword = await bcrypt.hash(kataSandiBaru, 10)

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    })

    return sendSuccess(res, 200, 'Kata sandi berhasil diperbarui')
  } catch (error) {
    next(error)
  }
}

// 3. Hapus Akun Pengguna secara Permanen[cite: 137, 138]
export const deleteAccount = async (req, res, next) => {
  try {
    const userId = req.user.id
    await prisma.user.delete({ where: { id: userId } })
    return sendSuccess(res, 200, 'Akun dan seluruh riwayat berhasil dihapus permanen')
  } catch (error) {
    next(error)
  }
}

// 4. Fitur Lupa Kata Sandi (Kirim Tautan Pemulihan Surel)[cite: 144]
export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body
    const user = await prisma.user.findUnique({ where: { email } })

    // Validasi generik agar tidak membocorkan informasi keberadaan email ke publik
    if (!user) {
      return sendSuccess(res, 200, 'Jika surel terdaftar, tautan atur ulang telah dikirim.')
    }

    // Simulasi pengiriman token/tautan atur ulang ke surel pengguna
    return sendSuccess(res, 200, 'Tautan atur ulang kata sandi telah dikirim ke surel Anda.')
  } catch (error) {
    next(error)
  }
}

export const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params
    const { nama, email, password, roleId, isActive, noWhatsApp, institusi } = req.body

    const user = await prisma.user.findUnique({ where: { id } })
    if (!user) {
      const error = new Error('User tidak ditemukan')
      error.statusCode = 404
      throw error
    }

    if (email && email !== user.email) {
      const existingUser = await prisma.user.findUnique({ where: { email } })
      if (existingUser) {
        const error = new Error('Email sudah digunakan')
        error.statusCode = 400
        throw error
      }
    }

    let hashedPassword = undefined
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10)
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        ...(nama && { nama }),
        ...(email && { email }),
        ...(hashedPassword && { password: hashedPassword }),
        ...(roleId && { roleId }),
        ...(isActive !== undefined && { isActive }),
        ...(noWhatsApp !== undefined && { noWhatsApp }),
        ...(institusi !== undefined && { institusi }),
      },
      select: userSelect,
    })

    return sendSuccess(res, 200, 'User berhasil diperbarui', updatedUser)
  } catch (error) {
    next(error)
  }
}

export const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params
    const user = await prisma.user.findUnique({ where: { id } })
    if (!user) {
      const error = new Error('User tidak ditemukan')
      error.statusCode = 404
      throw error
    }

    await prisma.user.delete({ where: { id } })
    return sendSuccess(res, 200, 'User berhasil dihapus')
  } catch (error) {
    next(error)
  }
}