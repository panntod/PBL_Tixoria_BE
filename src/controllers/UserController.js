import prisma from '../config/prisma.js'

export const getAllUsers = async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      include: {
        role: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    res.status(200).json({
      success: true,
      data: users,
    })
  } catch (error) {
    next(error)
  }
}

export const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        role: true,
      },
    })

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User tidak ditemukan',
      })
    }

    res.status(200).json({
      success: true,
      data: user,
    })
  } catch (error) {
    next(error)
  }
}

export const createUser = async (req, res, next) => {
  try {
    const {
      nama,
      email,
      password,
      roleId,
      isActive,
    } = req.body

    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email sudah digunakan',
      })
    }

    const role = await prisma.role.findUnique({
      where: { id: roleId },
    })

    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Role tidak ditemukan',
      })
    }

    const newUser = await prisma.user.create({
      data: {
        nama,
        email,
        password,
        roleId,
        isActive: isActive ?? true,
      },
      include: {
        role: true,
      },
    })

    res.status(201).json({
      success: true,
      data: newUser,
    })
  } catch (error) {
    next(error)
  }
}

export const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params
    const {
      nama,
      email,
      password,
      roleId,
      isActive,
    } = req.body

    const user = await prisma.user.findUnique({
      where: { id },
    })

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User tidak ditemukan',
      })
    }

    if (email && email !== user.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email },
      })

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email sudah digunakan',
        })
      }
    }

    if (roleId) {
      const role = await prisma.role.findUnique({
        where: { id: roleId },
      })

      if (!role) {
        return res.status(404).json({
          success: false,
          message: 'Role tidak ditemukan',
        })
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        ...(nama !== undefined && { nama }),
        ...(email !== undefined && { email }),
        ...(password !== undefined && { password }),
        ...(roleId !== undefined && { roleId }),
        ...(isActive !== undefined && { isActive }),
      },
      include: {
        role: true,
      },
    })

    res.status(200).json({
      success: true,
      data: updatedUser,
    })
  } catch (error) {
    next(error)
  }
}

export const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params

    const user = await prisma.user.findUnique({
      where: { id },
    })

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User tidak ditemukan',
      })
    }

    await prisma.user.delete({
      where: { id },
    })

    res.status(200).json({
      success: true,
      message: 'User berhasil dihapus',
    })
  } catch (error) {
    next(error)
  }
}