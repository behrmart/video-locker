// routes/videos.ts (encabezado correcto)
import { Router } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { prisma } from '../prisma';
const router = Router();
const MEDIA_DIR = process.env.MEDIA_DIR || path.join(process.cwd(), 'media', 'videos');


router.get('/', async (_req, res) => {
const videos = await prisma.video.findMany({
orderBy: { createdAt: 'desc' },
select: { id: true, title: true, views: true, description: true, mimeType: true, createdAt: true }
});
res.json(videos);
});


router.get('/:id', async (req, res) => {
const id = Number(req.params.id);
const video = await prisma.video.findUnique({ where: { id } });
if (!video) return res.status(404).json({ error: 'Not found' });
res.json(video);
});


router.get('/:id/stream', async (req, res) => {
const id = Number(req.params.id);
const video = await prisma.video.findUnique({ where: { id } });
if (!video) return res.status(404).end();
const filePath = path.join(MEDIA_DIR, video.filename);
if (!fs.existsSync(filePath)) return res.status(404).end();
const stat = fs.statSync(filePath);
const range = req.headers.range;
const mime = video.mimeType || 'application/octet-stream';


if (range) {
const parts = range.replace(/bytes=/, '').split('-');
const start = parseInt(parts[0], 10);
const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1;
const chunkSize = (end - start) + 1;
const file = fs.createReadStream(filePath, { start, end });
res.writeHead(206, {
'Content-Range': `bytes ${start}-${end}/${stat.size}`,
'Accept-Ranges': 'bytes',
'Content-Length': chunkSize,
'Content-Type': mime
});
file.pipe(res);
} else {
res.writeHead(200, { 'Content-Length': stat.size, 'Content-Type': mime });
fs.createReadStream(filePath).pipe(res);
}
});


router.post('/:id/view', async (req, res) => {
const id = Number(req.params.id);
await prisma.video.update({ where: { id }, data: { views: { increment: 1 } } });
res.json({ ok: true });
});


router.get('/:id/comments', async (req, res) => {
const id = Number(req.params.id);
const comments = await prisma.comment.findMany({
where: { videoId: id },
orderBy: { createdAt: 'desc' },
select: { id: true, content: true, createdAt: true, user: { select: { username: true } } }
});
res.json(comments.map(c => ({ id: c.id, content: c.content, createdAt: c.createdAt, username: c.user.username })));
});


router.post('/:id/comments', async (req, res) => {
const user = (req as any).user as { id: number };
const id = Number(req.params.id);
const { content } = req.body;
if (!content) return res.status(400).json({ error: 'content required' });
const created = await prisma.comment.create({ data: { content, videoId: id, userId: user.id } });
res.json(created);
});


export default router;
