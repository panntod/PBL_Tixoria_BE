import { Router } from 'express'
import {
  getAllUsers,
  getUserById,
  createUser,
  login,
  updateUser,
  deleteUser,
  updateProfile,
  changePassword,
  deleteAccount,
  forgotPassword,
} from '../controllers/UserController.js'
import { authenticate } from '../middlewares/AuthMiddleware.js'

const router = Router()

// Endpoint Publik / Auth
router.post('/login', login)
router.post('/register', createUser) // Alternatif alias registrasi
router.post('/forgot-password', forgotPassword) //[cite: 144]

// Endpoint Khusus User yang Sedang Login (Akun Saya)[cite: 137, 138]
router.put('/profile', authenticate, updateProfile)
router.patch('/change-password', authenticate, changePassword)
router.delete('/account', authenticate, deleteAccount)

// Endpoint Manajemen Umum (CRUD User)
router.get('/', getAllUsers)
router.get('/:id', getUserById)
router.post('/', createUser)
router.put('/:id', updateUser)
router.delete('/:id', deleteUser)

export default router