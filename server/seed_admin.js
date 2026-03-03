/*
Run this script once to create an admin user in MongoDB.
Usage: node seed_admin.js (after installing dependencies and setting MONGO_URI)
*/
import mongoose from 'mongoose'
import dotenv from 'dotenv'
import bcrypt from 'bcrypt'
import User from './models/User.js'

dotenv.config({ path: './.env' });
const MONGO = process.env.MONGO_URI;
if (!MONGO) {
  console.error("❌ Error: MONGO_URI is not defined in your .env file!");
  process.exit(1);
}

async function run() {
  await mongoose.connect(MONGO)
  const email = process.env.ADMIN_EMAIL || 'admin'
  const pass = process.env.ADMIN_PASS || 'Avance_123'

  // Remove all existing admin users and recreate
  await User.deleteMany({})
  const hash = await bcrypt.hash(pass, 10)
  await User.create({ email, passwordHash: hash })
  console.log('✅ Admin created:', email)
  process.exit(0)
}
run().catch(e => { console.error(e); process.exit(1) })
