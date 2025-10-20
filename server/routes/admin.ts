// routes/admin.ts (encabezado correcto)
import { Router } from 'express';
import multer from 'multer';
import * as path from 'path';
import * as fs from 'fs';
import { prisma } from '../prisma';


const router = Router();
const MEDIA_VIDEOS_DIR = process.env.MEDIA_DIR || path.join(process.cwd(), 'media', 'videos');
const MEDIA_PHOTOS_DIR = process.env.MEDIA_PHOTOS_DIR || path.join(process.cwd(), 'media', 'photos');
if (!fs.existsSync(MEDIA_VIDEOS_DIR)) fs.mkdirSync(MEDIA_VIDEOS_DIR, { recursive: true });
if (!fs.existsSync(MEDIA_PHOTOS_DIR)) fs.mkdirSync(MEDIA_PHOTOS_DIR, { recursive: true });


const videoStorage = multer.diskStorage({
destination: (_req, _file, cb) => cb(null, MEDIA_VIDEOS_DIR),
filename: (_req, file, cb) => {
const ts = Date.now();
const safe = file.originalname.replace(/[^a-zA-Z0-9_.-]/g, '_');
cb(null, `${ts}_${safe}`);
}
});
const photoStorage = multer.diskStorage({
destination: (_req, _file, cb) => cb(null, MEDIA_PHOTOS_DIR),
filename: (_req, file, cb) => {
const ts = Date.now();
const safe = file.originalname.replace(/[^a-zA-Z0-9_.-]/g, '_');
cb(null, `${ts}_${safe}`);
}
});
const uploadVideo = multer({ storage: videoStorage });
const uploadPhoto = multer({ storage: photoStorage });


router.post('/videos', uploadVideo.single('file'), async (req, res) => {
const { title, description } = req.body as { title: string; description?: string };
if (!req.file || !title) return res.status(400).json({ error: 'title & file required' });
const video = await prisma.video.create({ data: { title, description: description || null, filename: req.file.filename, mimeType: req.file.mimetype } });
res.json(video);
});


router.delete('/videos/:id', async (req, res) => {
const id = Number(req.params.id);
const vid = await prisma.video.findUnique({ where: { id } });
if (!vid) return res.status(404).json({ error: 'Not found' });
const filepath = path.join(MEDIA_VIDEOS_DIR, vid.filename);
await prisma.comment.deleteMany({ where: { videoId: id } });
await prisma.video.delete({ where: { id } });
if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
res.json({ ok: true });
});


router.post('/photos', uploadPhoto.single('file'), async (req, res) => {
const { title } = req.body as { title: string };
if (!req.file || !title) return res.status(400).json({ error: 'title & file required' });
const photo = await prisma.photo.create({ data: { title, filename: req.file.filename, mimeType: req.file.mimetype } });
res.json(photo);
});


router.delete('/photos/:id', async (req, res) => {
const id = Number(req.params.id);
const photo = await prisma.photo.findUnique({ where: { id } });
if (!photo) return res.status(404).json({ error: 'Not found' });
const filepath = path.join(MEDIA_PHOTOS_DIR, photo.filename);
await prisma.photo.delete({ where: { id } });
if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
res.json({ ok: true });
});


export default router;
