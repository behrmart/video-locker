import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
const prisma = new PrismaClient();


async function main() {
const adminPassword = process.env.ADMIN_SEED_PASSWORD || 'APPluc79%';
const hash = await bcrypt.hash(adminPassword, 10);
await prisma.user.upsert({
where: { username: 'admin' },
update: {passwordHash: hash},
create: { username: 'admin', passwordHash: hash, role: 'ADMIN' }
});
console.log(`Admin listo: admin / ${adminPassword}`);
}
main().finally(() => prisma.$disconnect());
