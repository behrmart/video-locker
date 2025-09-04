import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import videoRoutes from './routes/videos.js';
import adminRoutes from './routes/admin.js';


const app = express();
const PORT = process.env.PORT || 3000;


app.use(cors({ origin: 'http://localhost:4200' }));
app.use(express.json());


app.use('/api/auth', authRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/admin', adminRoutes);


app.listen(PORT, () => console.log(`Server: http://localhost:${PORT}`));
```ts
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import videoRoutes from './routes/videos.js';
import adminRoutes from './routes/admin.js';


const app = express();
const PORT = process.env.PORT || 3000;


app.use(cors({ origin: 'http://localhost:4200' }));
app.use(express.json());


app.use('/api/auth', authRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/admin', adminRoutes);


app.listen(PORT, () => console.log(`Server: http://localhost:${PORT}`));