import prisma from '../config/prisma.js'

export const getAllRoles = async (req, res, next) => {
  try {
    const roles = await prisma.role.findMany({
      include: {
        users: true,
      },
      orderBy: {
        nama: 'asc',
      },
    })

    res.status(200).json({
      success: true,
      data: roles,
    })
  } catch (error) {
    next(error)
  }
}

export const getRoleById = async (req, res, next) => {
  try {
    const { id } = req.params

    const role = await prisma.role.findUnique({
      where: { id },
      include: {
        users: true,
      },
    })

    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Role tidak ditemukan',
      })
    }

    res.status(200).json({
      success: true,
      data: role,
    })
  } catch (error) {
    next(error)
  }
}

export const createRole = async (req, res, next) => {
  try {
    const {
      nama,
      kode,
      description,
    } = req.body

    const existingRole = await prisma.role.findUnique({
      where: { kode },
    })

    if (existingRole) {
      return res.status(400).json({
        success: false,
        message: 'Kode role sudah digunakan',
      })
    }

    const newRole = await prisma.role.create({
      data: {
        nama,
        kode,
        description,
      },
    })

    res.status(201).json({
      success: true,
      data: newRole,
    })
  } catch (error) {
    next(error)
  }
}

export const updateRole = async (req, res, next) => {
  try {
    const { id } = req.params
    const {
      nama,
      kode,
      description,
    } = req.body

    const role = await prisma.role.findUnique({
      where: { id },
    })

    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Role tidak ditemukan',
      })
    }

    if (kode && kode !== role.kode) {
      const existingRole = await prisma.role.findUnique({
        where: { kode },
      })

      if (existingRole) {
        return res.status(400).json({
          success: false,
          message: 'Kode role sudah digunakan',
        })
      }
    }

    const updatedRole = await prisma.role.update({
      where: { id },
      data: {
        ...(nama !== undefined && { nama }),
        ...(kode !== undefined && { kode }),
        ...(description !== undefined && { description }),
      },
    })

    res.status(200).json({
      success: true,
      data: updatedRole,
    })
  } catch (error) {
    next(error)
  }
}

export const deleteRole = async (req, res, next) => {
  try {
    const { id } = req.params

    const role = await prisma.role.findUnique({
      where: { id },
    })

    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Role tidak ditemukan',
      })
    }

    const userCount = await prisma.user.count({
      where: {
        roleId: id,
      },
    })

    if (userCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Role tidak dapat dihapus karena masih digunakan oleh user',
      })
    }

    await prisma.role.delete({
      where: { id },
    })

    res.status(200).json({
      success: true,
      message: 'Role berhasil dihapus',
    })
  } catch (error) {
    next(error)
  }
}