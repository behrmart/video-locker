import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth';
import videoRoutes from './routes/videos';
import photoRoutes from './routes/photos';
import adminRoutes from './routes/admin';
import serverMediaRoutes from './routes/serverMedia';
import { requireAuth, requireAdmin } from './middleware/auth';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: ['http://localhost:4200','http://127.0.0.1:4200'], allowedHeaders: ['Content-Type','Authorization'], methods: ['GET','POST','DELETE','OPTIONS'] }));
app.use(express.json());

// Público (login/register)
app.use('/api/auth', authRoutes);

// 🔒 Todo lo de videos requiere estar autenticado
app.use('/api/videos', requireAuth, videoRoutes);

// 🔒 Fotos también protegidas
app.use('/api/photos', requireAuth, photoRoutes);

// 🔒 Zona admin: autenticado + rol admin
app.use('/api/admin', requireAuth, requireAdmin, adminRoutes);

// 🔒 Biblioteca externa del servidor
app.use('/api/server-media', requireAuth, serverMediaRoutes);

app.listen(PORT, () => console.log(`Server: http://localhost:${PORT}`));
