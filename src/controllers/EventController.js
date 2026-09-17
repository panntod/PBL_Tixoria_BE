import prisma from '../config/prisma.js'

export const getAllEvents = async (req, res, next) => {
  try {
    const events = await prisma.event.findMany({
      orderBy: { date: 'asc' },
    })
    res.status(200).json({ success: true, data: events })
  } catch (error) {
    next(error)
  }
}

export const getEventById = async (req, res, next) => {
  try {
    const { id } = req.params
    const event = await prisma.event.findUnique({
      where: { id },
    })

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event tidak ditemukan' })
    }

    res.status(200).json({ success: true, data: event })
  } catch (error) {
    next(error)
  }
}

export const createEvent = async (req, res, next) => {
  try {
    const { title, description, date, location, price, quota } = req.body

    const newEvent = await prisma.event.create({
      data: {
        title,
        description,
        date: new Date(date),
        location,
        price: Number(price),
        quota: Number(quota),
      },
    })

    res.status(201).json({ success: true, data: newEvent })
  } catch (error) {
    next(error)
  }
}