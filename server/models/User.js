import mongoose from 'mongoose'
const userSchema = new mongoose.Schema({ email:{type:String,unique:true}, passwordHash:String, role:{type:String,default:'admin'} })
export default mongoose.model('User', userSchema)
