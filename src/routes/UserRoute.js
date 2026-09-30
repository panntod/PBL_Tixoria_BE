import { Router } from 'express'
import {
  getAllUsers,
  getUserById,
  createUser,
  login,
  updateUser,
  deleteUser,
} from '../controllers/UserController.js'

const router = Router()

// GET
router.get('/', getAllUsers)
router.get('/:id', getUserById)

//POST
router.post('/', createUser)
router.post('/login', login)

//PUT & DELETE
router.put('/:id', updateUser)
router.delete('/:id', deleteUser)

export default router