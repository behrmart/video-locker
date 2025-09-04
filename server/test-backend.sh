#!/bin/bash
API="http://localhost:3000/api"

echo "== 1. Probar lista de videos (debe devolver []) =="
curl -s $API/videos | jq

echo -e "\n\n== 2. Registrar usuario normal santi/1234 =="
curl -s -X POST $API/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"santi","password":"1234"}' | jq

echo -e "\n\n== 3. Login con santi/1234 =="
USER_TOKEN=$(curl -s -X POST $API/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"santi","password":"1234"}' | jq -r .token)

echo "Token usuario: $USER_TOKEN"

echo -e "\n\n== 4. Llamar a endpoint protegido (video 1, no existe) =="
curl -s $API/videos/1 -H "Authorization: Bearer $USER_TOKEN" | jq

echo -e "\n\n== 5. Login con admin/admin123 =="
ADMIN_TOKEN=$(curl -s -X POST $API/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' | jq -r .token)

echo "Token admin: $ADMIN_TOKEN"

echo -e "\n\n== 6. Subir un video de prueba (como admin) =="
curl -s -X POST $API/admin/videos \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -F "title=Mi primer video" \
  -F "description=Probando upload" \
  -F "file=@/ruta/a/tu/video.mp4" | jq

echo -e "\n\n== 7. Ver lista de videos otra vez =="
curl -s $API/videos | jq
