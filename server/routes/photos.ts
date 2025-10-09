import { Router } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { prisma } from '../prisma';

const router = Router();
const MEDIA_DIR = process.env.MEDIA_PHOTOS_DIR || path.join(process.cwd(), 'media', 'photos');
if (!fs.existsSync(MEDIA_DIR)) fs.mkdirSync(MEDIA_DIR, { recursive: true });

router.get('/', async (_req, res) => {
  const photos = await prisma.photo.findMany({
    orderBy: { createdAt: 'desc' },
    select: { id: true, title: true, filename: true, mimeType: true, createdAt: true }
  });
  res.json(photos);
});

router.get('/:id/stream', async (req, res) => {
  const id = Number(req.params.id);
  const photo = await prisma.photo.findUnique({ where: { id } });
  if (!photo) return res.status(404).json({ error: 'Not found' });
  const filePath = path.join(MEDIA_DIR, photo.filename);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File missing' });

  res.setHeader('Content-Type', photo.mimeType || 'application/octet-stream');
  const stream = fs.createReadStream(filePath);
  stream.on('error', () => res.status(500).end());
  stream.pipe(res);
});

export default router;
