#!/usr/bin/env bash
set -e

echo "⏳ Esperando base de datos en $DATABASE_URL ..."
# pequeña espera inicial
sleep 3

echo "🗄️  Aplicando schema (prisma db push)..."
npx prisma db push

# Opcional: crear admin si no existe (una sola vez)
if [ "${SEED_ADMIN:-true}" = "true" ]; then
  ADMIN_SEED_PASSWORD="${ADMIN_SEED_PASSWORD:-APPluc79%}" \
    node -e "import('bcryptjs').then(async b=>{const bcrypt=b.default; const {PrismaClient}=await import('@prisma/client'); const p=new PrismaClient(); const password=process.env.ADMIN_SEED_PASSWORD || 'APPluc79%'; const u=await p.user.findUnique({where:{username:'admin'}}); if(!u){ const hash=await bcrypt.hash(password,10); await p.user.create({data:{username:'admin',passwordHash:hash,role:'ADMIN'}}); console.log(\`👑 Admin creado: admin/${password}\`); } else { console.log('👑 Admin ya existe'); } await p.\$disconnect(); })"
fi

echo "🚀 Iniciando servidor..."
node dist/index.js
