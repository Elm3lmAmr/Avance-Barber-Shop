import mongoose from 'mongoose'
const bookingSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: String,
  contact: String,
  date: String,
  slot: String,
  service: { type: String, default: '' },
  googleEmail: { type: String, default: '' },
  timestamp: { type: Date, default: Date.now }
})
export default mongoose.model('Booking', bookingSchema)
