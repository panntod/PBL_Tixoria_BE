// src/middlewares/ErrorMiddleware.js
import { sendError } from '../utils/responseFormatter.js'

export const errorHandler = (err, req, res, next) => {
  console.error('[ERROR]', err.message)

  if (err.stack) {
    console.error(err.stack)
  }

  // Handling Error Prisma / UUID
  if (err.code === 'P2023' || err.message.includes('UUID')) {
    return sendError(res, 400, 'Format ID tidak valid!')
  }

  const statusCode = err.status || err.statusCode || 500
  const message = err.message || 'Internal Server Error'

  return sendError(res, statusCode, message)
}