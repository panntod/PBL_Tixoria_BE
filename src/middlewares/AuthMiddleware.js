import jwt from 'jsonwebtoken'

// 1. Memeriksa apakah request membawa Token JWT yang valid
export const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Akses ditolak! Token tidak ditemukan.',
    })
  }

  const token = authHeader.split(' ')[1]

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'tixoria_pbl_secret')
    req.user = decoded // Menyimpan data user { id, email, role } ke objek req
    next()
  } catch (error) {
    return res.status(403).json({
      success: false,
      message: 'Token tidak valid atau telah kadaluwarsa!',
    })
  }
}

// 2. Memeriksa apakah role pengguna diizinkan mengakses endpoint tertentu (RBAC)
export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Akses ditolak! Anda tidak memiliki izin untuk fitur ini.',
      })
    }
    next()
  }
}