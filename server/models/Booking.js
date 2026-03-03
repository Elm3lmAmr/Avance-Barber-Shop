import mongoose from 'mongoose'
const bookingSchema = new mongoose.Schema({
  id:{type:String,required:true,unique:true},
  name:String,
  contact:String,
  date:String,
  slot:String,
  timestamp:{type:Date,default:Date.now}
})
export default mongoose.model('Booking', bookingSchema)
