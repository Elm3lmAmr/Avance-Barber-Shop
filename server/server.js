import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import bookingsRouter from './routes/bookings.js';
import authRouter from './routes/auth.js';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

// Security: Helmet for HTTP headers
app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
}));

// Security: Global rate limiter
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    message: { ok: false, message: 'Troppe richieste. Riprova tra qualche minuto.' }
});
app.use(globalLimiter);

// CORS
app.use(cors({
    origin: [
        'https://avancebarbiere.com',
        'https://www.avancebarbiere.com',
        'https://avance-barber-shop.vercel.app',
        'http://localhost:5000',
        'http://localhost:3000',
        'http://localhost:5500',
        'http://127.0.0.1:5000',
        'http://127.0.0.1:5500'
    ],
    credentials: true
}));

// Body parser with size limit
app.use(express.json({ limit: '10kb' }));
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