// routes/admin.ts (encabezado correcto)
import { Router } from 'express';
import multer from 'multer';
import * as path from 'path';
import * as fs from 'fs';
import { prisma } from '../prisma';
import { requireAuth, requireAdmin } from '../middleware/auth';


const router = Router();
const MEDIA_DIR = process.env.MEDIA_DIR || path.join(process.cwd(), 'media', 'videos');
if (!fs.existsSync(MEDIA_DIR)) fs.mkdirSync(MEDIA_DIR, { recursive: true });


const storage = multer.diskStorage({
destination: (_req, _file, cb) => cb(null, MEDIA_DIR),
filename: (_req, file, cb) => {
const ts = Date.now();
const safe = file.originalname.replace(/[^a-zA-Z0-9_.-]/g, '_');
cb(null, `${ts}_${safe}`);
}
});
const upload = multer({ storage });


router.post('/videos', requireAuth, requireAdmin, upload.single('file'), async (req, res) => {
const { title, description } = req.body as { title: string; description?: string };
if (!req.file || !title) return res.status(400).json({ error: 'title & file required' });
const video = await prisma.video.create({ data: { title, description: description || null, filename: req.file.filename, mimeType: req.file.mimetype } });
res.json(video);
});


router.delete('/videos/:id', requireAuth, requireAdmin, async (req, res) => {
const id = Number(req.params.id);
const vid = await prisma.video.findUnique({ where: { id } });
if (!vid) return res.status(404).json({ error: 'Not found' });
const filepath = path.join(MEDIA_DIR, vid.filename);
await prisma.comment.deleteMany({ where: { videoId: id } });
await prisma.video.delete({ where: { id } });
if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
res.json({ ok: true });
});


export default router;
