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

function normalizePhotoTitle(rawTitle: unknown, originalName?: string): string {
const title = typeof rawTitle === 'string' ? rawTitle.trim() : '';
if (title) return title;
if (!originalName) return '';
const basename = path.parse(originalName).name;
return basename.trim();
}

router.get('/users', async (_req, res) => {
const users = await prisma.user.findMany({
orderBy: { username: 'asc' },
select: { id: true, username: true, role: true }
});
res.json(users);
});

router.get('/albums', async (_req, res) => {
const albums = await prisma.album.findMany({
orderBy: { name: 'asc' },
include: { _count: { select: { photos: true } } }
});

res.json(albums.map(a => ({
id: a.id,
name: a.name,
description: a.description,
createdAt: a.createdAt,
photoCount: a._count.photos
})));
});

router.post('/albums', async (req, res) => {
const { name, description } = req.body as { name?: string; description?: string };
const cleanName = (name || '').trim();
if (!cleanName) return res.status(400).json({ error: 'album name is required' });

try {
const album = await prisma.album.create({
data: {
name: cleanName,
description: description?.trim() || null
}
});
res.json(album);
} catch (e: any) {
if (e?.code === 'P2002') return res.status(409).json({ error: 'album name already exists' });
throw e;
}
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
const { title, albumId } = req.body as { title?: string; albumId?: string };
if (!req.file) return res.status(400).json({ error: 'file required' });

const normalizedTitle = normalizePhotoTitle(title, req.file.originalname);
if (!normalizedTitle) return res.status(400).json({ error: 'title required' });

let parsedAlbumId: number | null = null;
if (typeof albumId === 'string' && albumId.trim() !== '') {
parsedAlbumId = Number(albumId);
if (!Number.isInteger(parsedAlbumId) || parsedAlbumId <= 0) {
return res.status(400).json({ error: 'invalid albumId' });
}
const album = await prisma.album.findUnique({ where: { id: parsedAlbumId } });
if (!album) return res.status(404).json({ error: 'Album not found' });
}

const photo = await prisma.photo.create({
data: {
title: normalizedTitle,
filename: req.file.filename,
mimeType: req.file.mimetype,
albumId: parsedAlbumId
}
});
res.json(photo);
});

router.post('/albums/:id/photos', uploadPhoto.single('file'), async (req, res) => {
const albumId = Number(req.params.id);
if (!Number.isInteger(albumId) || albumId <= 0) return res.status(400).json({ error: 'invalid album id' });
if (!req.file) return res.status(400).json({ error: 'file required' });

const album = await prisma.album.findUnique({ where: { id: albumId } });
if (!album) return res.status(404).json({ error: 'Album not found' });

const { title } = req.body as { title?: string };
const normalizedTitle = normalizePhotoTitle(title, req.file.originalname);
if (!normalizedTitle) return res.status(400).json({ error: 'title required' });

const photo = await prisma.photo.create({
data: {
title: normalizedTitle,
filename: req.file.filename,
mimeType: req.file.mimetype,
albumId
}
});

res.json(photo);
});

router.patch('/photos/assign-album', async (req, res) => {
const { photoIds, albumId } = req.body as { photoIds?: number[]; albumId?: number };

if (!Array.isArray(photoIds) || photoIds.length === 0) {
return res.status(400).json({ error: 'photoIds is required' });
}

const uniqueIds = Array.from(new Set(photoIds.map(Number).filter(id => Number.isInteger(id) && id > 0)));
if (uniqueIds.length === 0) return res.status(400).json({ error: 'photoIds are invalid' });

if (!Number.isInteger(albumId) || Number(albumId) <= 0) {
return res.status(400).json({ error: 'albumId is invalid' });
}

const album = await prisma.album.findUnique({ where: { id: Number(albumId) } });
if (!album) return res.status(404).json({ error: 'Album not found' });

const updated = await prisma.photo.updateMany({
where: { id: { in: uniqueIds } },
data: { albumId: Number(albumId) }
});

res.json({ ok: true, updated: updated.count, albumId: Number(albumId) });
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
