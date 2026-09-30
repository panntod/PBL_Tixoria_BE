import prisma from '../config/prisma.js'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

// Format data user yang aman dikembalikan ke client (tanpa password)
const userSelect = {
  id: true,
  nama: true,
  email: true,
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

    res.status(200).json({ success: true, data: users })
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
      return res.status(404).json({ success: false, message: 'User tidak ditemukan' })
    }

    res.status(200).json({ success: true, data: user })
  } catch (error) {
    next(error)
  }
}

export const createUser = async (req, res, next) => {
  try {
    const { nama, email, password, roleId, isActive } = req.body

    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email sudah digunakan' })
    }

    const role = await prisma.role.findUnique({ where: { id: roleId } })
    if (!role) {
      return res.status(404).json({ success: false, message: 'Role tidak ditemukan' })
    }

    // Hash password sebelum disimpan
    const hashedPassword = await bcrypt.hash(password, 10)

    const newUser = await prisma.user.create({
      data: {
        nama,
        email,
        password: hashedPassword,
        roleId,
        isActive: isActive ?? true,
      },
      select: userSelect,
    })

    res.status(201).json({ success: true, data: newUser })
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
      return res.status(401).json({ success: false, message: 'Email atau password salah' })
    }

    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Email atau password salah' })
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Akun Anda sedang tidak aktif' })
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role.kode },
      process.env.JWT_SECRET || 'tixoria_pbl_secret',
      { expiresIn: '1d' }
    )

    const { password: _, ...userData } = user

    res.status(200).json({
      success: true,
      message: 'Login berhasil',
      token,
      data: userData,
    })
  } catch (error) {
    next(error)
  }
}

export const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params
    const { nama, email, password, roleId, isActive } = req.body

    const user = await prisma.user.findUnique({ where: { id } })
    if (!user) {
      return res.status(404).json({ success: false, message: 'User tidak ditemukan' })
    }

    if (email && email !== user.email) {
      const existingUser = await prisma.user.findUnique({ where: { email } })
      if (existingUser) {
        return res.status(400).json({ success: false, message: 'Email sudah digunakan' })
      }
    }

    if (roleId) {
      const role = await prisma.role.findUnique({ where: { id: roleId } })
      if (!role) {
        return res.status(404).json({ success: false, message: 'Role tidak ditemukan' })
      }
    }

    let hashedPassword
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10)
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        ...(nama !== undefined && { nama }),
        ...(email !== undefined && { email }),
        ...(password !== undefined && { password: hashedPassword }),
        ...(roleId !== undefined && { roleId }),
        ...(isActive !== undefined && { isActive }),
      },
      select: userSelect,
    })

    res.status(200).json({ success: true, data: updatedUser })
  } catch (error) {
    next(error)
  }
}

export const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params

    const user = await prisma.user.findUnique({ where: { id } })
    if (!user) {
      return res.status(404).json({ success: false, message: 'User tidak ditemukan' })
    }

    await prisma.user.delete({ where: { id } })

    res.status(200).json({ success: true, message: 'User berhasil dihapus' })
  } catch (error) {
    next(error)
  }
}