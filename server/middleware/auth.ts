import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JwtPayload } from '../types.js';
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';


export function requireAuth(req: Request, res: Response, next: NextFunction) {
const auth = req.headers.authorization || '';
const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
if (!token) return res.status(401).json({ error: 'No token' });
try {
const payload = jwt.verify(token, JWT_SECRET) as JwtPayload;
(req as any).user = payload; next();
} catch { return res.status(401).json({ error: 'Invalid token' }); }
}


export function requireAdmin(req: Request, res: Response, next: NextFunction) {
const u = (req as any).user as JwtPayload | undefined;
if (!u) return res.status(401).json({ error: 'Not Authenticated' });
if (u.role !== 'ADMIN') return res.status(403) .json({ error: 'Admin only' });
next();
}
```ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JwtPayload } from '../types.js';
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';


export function requireAuth(req: Request, res: Response, next: NextFunction) {
const auth = req.headers.authorization || '';
const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
if (!token) return res.status(401).json({ error: 'No token' });
try {
const payload = jwt.verify(token, JWT_SECRET) as JwtPayload;
(req as any).user = payload; next();
} catch { return res.status(401).json({ error: 'Invalid token' }); }
}


export function requireAdmin(req: Request, res: Response, next: NextFunction) {
const u = (req as any).user as JwtPayload | undefined;
if (!u) return res.status(401).json({ error: 'Not Authenticated' });
if (u.role !== 'ADMIN') return res.status(403).json({ error: 'Admin only' });
next();
}