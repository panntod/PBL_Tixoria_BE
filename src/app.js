import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import routes from './routes/index.js'
import { errorHandler } from './middlewares/ErrorMiddleware.js'
import { logger } from './middlewares/LoggerMiddleware.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

app.use(cors())
app.use(express.json())

app.use(logger)
app.use('/api', routes)

app.get('/', (req, res) => {
  res.send('API Tixoria siap digunakan 🚀')
})

app.use(errorHandler)

app.listen(PORT, () => {
  console.log(`[STARTING] Server is running on port ${PORT}`)
})