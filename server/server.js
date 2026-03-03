import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import bookingsRouter from './routes/bookings.js';
import authRouter from './routes/auth.js';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.resolve(__dirname, '../client')));

// Database 
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('🚀 Production DB Connected'))
    .catch(err => console.error('❌ DB Error:', err));

// Routes
app.use('/api', bookingsRouter);
app.use('/api/auth', authRouter);

// Serve index.html for all other routes (SPA feel)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/index.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🔥 Server active on port ${PORT}`));