import { Router } from 'express';
import * as fs from 'fs';
import * as path from 'path';

type MediaKind = 'video' | 'image' | 'audio';

interface MediaItem {
  id: string;
  name: string;
  relativePath: string;
  mimeType: string;
  type: MediaKind;
  size: number;
  modifiedAt: string;
}

const SUPPORTED_EXTENSIONS = new Map<string, { type: MediaKind; mime: string }>([
  ['.mp4', { type: 'video', mime: 'video/mp4' }],
  ['.mkv', { type: 'video', mime: 'video/x-matroska' }],
  ['.webm', { type: 'video', mime: 'video/webm' }],
  ['.mov', { type: 'video', mime: 'video/quicktime' }],
  ['.m4v', { type: 'video', mime: 'video/mp4' }],
  ['.avi', { type: 'video', mime: 'video/x-msvideo' }],
  ['.mpg', { type: 'video', mime: 'video/mpeg' }],
  ['.mpeg', { type: 'video', mime: 'video/mpeg' }],
  ['.ts', { type: 'video', mime: 'video/mp2t' }],

  ['.jpg', { type: 'image', mime: 'image/jpeg' }],
  ['.jpeg', { type: 'image', mime: 'image/jpeg' }],
  ['.png', { type: 'image', mime: 'image/png' }],
  ['.gif', { type: 'image', mime: 'image/gif' }],
  ['.bmp', { type: 'image', mime: 'image/bmp' }],
  ['.webp', { type: 'image', mime: 'image/webp' }],

  ['.mp3', { type: 'audio', mime: 'audio/mpeg' }],
  ['.m4a', { type: 'audio', mime: 'audio/mp4' }],
  ['.aac', { type: 'audio', mime: 'audio/aac' }],
  ['.ogg', { type: 'audio', mime: 'audio/ogg' }],
  ['.oga', { type: 'audio', mime: 'audio/ogg' }],
  ['.wav', { type: 'audio', mime: 'audio/wav' }],
  ['.flac', { type: 'audio', mime: 'audio/flac' }]
]);

const ROOT_DIR = path.resolve(process.env.SERVER_MEDIA_DIR || '/media/1TB/www/html');

const router = Router();

function toBase64Url(value: string): string {
  return Buffer.from(value, 'utf8').toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function fromBase64Url(value: string): string {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padding = normalized.length % 4 ? 4 - (normalized.length % 4) : 0;
  const padded = normalized + '='.repeat(padding);
  return Buffer.from(padded, 'base64').toString('utf8');
}

function listMediaFiles(): MediaItem[] {
  if (!fs.existsSync(ROOT_DIR)) return [];

  const collected: MediaItem[] = [];
  const root = path.resolve(ROOT_DIR);

  const walk = (currentDir: string) => {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.name.startsWith('.')) continue; // skip hidden files/directories

      const absolute = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        walk(absolute);
        continue;
      }

      if (!entry.isFile()) continue;

      const ext = path.extname(entry.name).toLowerCase();
      const meta = SUPPORTED_EXTENSIONS.get(ext);
      if (!meta) continue;

      const stat = fs.statSync(absolute);
      const relativePath = path.relative(root, absolute);

      collected.push({
        id: toBase64Url(relativePath),
        name: entry.name,
        relativePath,
        mimeType: meta.mime,
        type: meta.type,
        size: stat.size,
        modifiedAt: stat.mtime.toISOString()
      });
    }
  };

  walk(root);

  collected.sort((a, b) => new Date(b.modifiedAt).getTime() - new Date(a.modifiedAt).getTime());

  return collected;
}

function ensureInsideRoot(relativePath: string): string | null {
  const root = path.resolve(ROOT_DIR);
  const absolute = path.resolve(root, relativePath);
  const isInside = absolute === root || absolute.startsWith(root + path.sep);
  if (!isInside) return null;
  return absolute;
}

router.get('/', (_req, res) => {
  try {
    const media = listMediaFiles();
    res.json(media);
  } catch (err) {
    console.error('Failed to read media directory', err);
    res.status(500).json({ error: 'Unable to read media directory' });
  }
});

router.get('/stream/:id', (req, res) => {
  try {
    const relativePath = fromBase64Url(req.params.id);
    const absolute = ensureInsideRoot(relativePath);
    if (!absolute) return res.status(400).json({ error: 'Invalid path' });
    if (!fs.existsSync(absolute)) return res.status(404).json({ error: 'File not found' });

    const stat = fs.statSync(absolute);
    if (!stat.isFile()) return res.status(404).json({ error: 'File not found' });

    const ext = path.extname(absolute).toLowerCase();
    const meta = SUPPORTED_EXTENSIONS.get(ext);
    if (!meta) return res.status(404).json({ error: 'Unsupported file' });

    const mime = meta.mime || 'application/octet-stream';
    const rangeHeader = req.headers.range;

    if (rangeHeader && (mime.startsWith('video/') || mime.startsWith('audio/'))) {
      const parts = rangeHeader.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      let end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1;

      if (Number.isNaN(start) || start < 0 || start >= stat.size) {
        return res.status(416).header('Content-Range', `bytes */${stat.size}`).end();
      }

      if (Number.isNaN(end) || end < start) {
        end = stat.size - 1;
      }

      if (end >= stat.size) {
        end = stat.size - 1;
      }

      const chunkSize = (end - start) + 1;
      const stream = fs.createReadStream(absolute, { start, end });
      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${stat.size}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize,
        'Content-Type': mime
      });
      stream.pipe(res);
      return;
    }

    res.writeHead(200, {
      'Content-Length': stat.size,
      'Content-Type': mime
    });
    const stream = fs.createReadStream(absolute);
    stream.on('error', () => res.status(500).end());
    stream.pipe(res);
  } catch (err) {
    console.error('Failed to stream media', err);
    res.status(500).json({ error: 'Unable to stream media' });
  }
});

export default router;
