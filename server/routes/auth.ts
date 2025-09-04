import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../prisma.js';
const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';


router.post('/register', async (req, res) => {
const { username, password } = req.body;
if (!username || !password) return res.status(400).json({ error: 'username & password required' });
const exists = await prisma.user.findUnique({ where: { username } });
if (exists) return res.status(409).json({ error: 'username taken' });
const passwordHash = await bcrypt.hash(password, 10);
const user = await prisma.user.create({ data: { username, passwordHash, role: 'USER' } });
res.json({ id: user.id, username: user.username });
});


router.post('/login', async (req, res) => {
const { username, password } = req.body;
const user = await prisma.user.findUnique({ where: { username } });
if (!user) return res.status(401).json({ error: 'Invalid credentials' });
const ok = await bcrypt.compare(password, user.passwordHash);
if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
const token = jwt.sign({ id: user.id, role: user.role, username: user.username }, JWT_SECRET, { expiresIn: '2d' });
res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
});


export default router;
```ts
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../prisma.js';
const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';


router.post('/register', async (req, res) => {
const { username, password } = req.body;
if (!username || !password) return res.status(400).json({ error: 'username & password required' });
const exists = await prisma.user.findUnique({ where: { username } });
if (exists) return res.status(409).json({ error: 'username taken' });
const passwordHash = await bcrypt.hash(password, 10);
const user = await prisma.user.create({ data: { username, passwordHash, role: 'USER' } });
res.json({ id: user.id, username: user.username });
});


router.post('/login', async (req, res) => {
const { username, password } = req.body;
const user = await prisma.user.findUnique({ where: { username } });
if (!user) return res.status(401).json({ error: 'Invalid credentials' });
const ok = await bcrypt.compare(password, user.passwordHash);
if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
const token = jwt.sign({ id: user.id, role: user.role, username: user.username }, JWT_SECRET, { expiresIn: '2d' });
res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
});


export default router;