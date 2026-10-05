// src/utils/responseFormatter.js

export const sendSuccess = (res, statusCode = 200, message = 'Success', data = null, pagination = null) => {
  const response = {
    meta: {
      status: 'success',
      code: statusCode,
      message,
      timestamp: new Date().toISOString(),
      ...(pagination && { pagination }), // pagination hanya muncul jika dikirimkan
    },
    data,
  }
  return res.status(statusCode).json(response)
}

export const sendError = (res, statusCode = 500, message = 'Internal Server Error', errors = null) => {
  const response = {
    meta: {
      status: 'error',
      code: statusCode,
      message,
      timestamp: new Date().toISOString(),
    },
    ...(errors && { errors }),
  }
  return res.status(statusCode).json(response)
}