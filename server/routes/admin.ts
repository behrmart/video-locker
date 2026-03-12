// routes/admin.ts (encabezado correcto)
import { Router } from 'express';
import multer from 'multer';
import * as path from 'path';
import * as fs from 'fs';
import bcrypt from 'bcryptjs';
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

function isStrongPassword(password: string): boolean {
const hasMinLength = password.length >= 8;
const hasUpper = /[A-Z]/.test(password);
const hasLower = /[a-z]/.test(password);
const hasNumber = /[0-9]/.test(password);
const hasSymbol = /[^A-Za-z0-9]/.test(password);
return hasMinLength && hasUpper && hasLower && hasNumber && hasSymbol;
}

router.get('/users', async (_req, res) => {
const users = await prisma.user.findMany({
orderBy: { username: 'asc' },
select: { id: true, username: true, role: true }
});
res.json(users);
});

router.post('/users/:id/password', async (req, res) => {
const id = Number(req.params.id);
const { password } = req.body as { password?: string };

if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: 'invalid user id' });
if (!password || !isStrongPassword(password)) {
return res.status(400).json({
error: 'weak password',
details: 'Password must be at least 8 characters and include uppercase, lowercase, number, and symbol.'
});
}

const user = await prisma.user.findUnique({ where: { id } });
if (!user) return res.status(404).json({ error: 'User not found' });

const hash = await bcrypt.hash(password, 10);
await prisma.user.update({ where: { id }, data: { passwordHash: hash } });

res.json({ ok: true });
});


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
