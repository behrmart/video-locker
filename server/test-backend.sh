#!/usr/bin/env bash
set -euo pipefail

# Uso recomendado con Docker Compose, porque el servicio server no publica el puerto 3000 al host:
#   docker compose exec -T server bash /app/test-backend.sh
#
# Si publicas el puerto del backend al host, tambien puedes usar:
#   API_URL=http://localhost:3000/api ./server/test-backend.sh

API_URL="${API_URL:-http://localhost:3000/api}"
ADMIN_USERNAME="${ADMIN_USERNAME:-admin}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-APPluc79%}"
TEST_USERNAME="${TEST_USERNAME:-santi_$(date +%s)}"
TEST_PASSWORD="${TEST_PASSWORD:-1234}"
UPLOAD_TITLE="${UPLOAD_TITLE:-Video de prueba Docker}"
UPLOAD_DESCRIPTION="${UPLOAD_DESCRIPTION:-Upload temporal generado por test-backend.sh}"
UPLOAD_FILE_PATH="${UPLOAD_FILE_PATH:-}"

echo "Probando backend en ${API_URL}"
echo "Usuario de prueba: ${TEST_USERNAME}"
echo "Admin configurado: ${ADMIN_USERNAME}"

API_URL="${API_URL}" \
ADMIN_USERNAME="${ADMIN_USERNAME}" \
ADMIN_PASSWORD="${ADMIN_PASSWORD}" \
TEST_USERNAME="${TEST_USERNAME}" \
TEST_PASSWORD="${TEST_PASSWORD}" \
UPLOAD_TITLE="${UPLOAD_TITLE}" \
UPLOAD_DESCRIPTION="${UPLOAD_DESCRIPTION}" \
UPLOAD_FILE_PATH="${UPLOAD_FILE_PATH}" \
node <<'NODE'
const fs = require('node:fs');
const path = require('node:path');

const {
  API_URL,
  ADMIN_USERNAME,
  ADMIN_PASSWORD,
  TEST_USERNAME,
  TEST_PASSWORD,
  UPLOAD_TITLE,
  UPLOAD_DESCRIPTION,
  UPLOAD_FILE_PATH
} = process.env;

let createdVideoId = null;

function pretty(value) {
  return JSON.stringify(value, null, 2);
}

function logStep(title, payload) {
  console.log(`\n== ${title} ==`);
  if (payload !== undefined) {
    console.log(typeof payload === 'string' ? payload : pretty(payload));
  }
}

function fail(message, payload) {
  console.error(`\nERROR: ${message}`);
  if (payload !== undefined) {
    console.error(typeof payload === 'string' ? payload : pretty(payload));
  }
  process.exit(1);
}

async function parseResponse(response) {
  const text = await response.text();
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return text;
  }
}

async function request(endpoint, options = {}) {
  const { method = 'GET', token, json, body, headers = {} } = options;
  const requestHeaders = { ...headers };

  if (token) requestHeaders.Authorization = `Bearer ${token}`;
  if (json !== undefined) requestHeaders['Content-Type'] = 'application/json';

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method,
      headers: requestHeaders,
      body: json !== undefined ? JSON.stringify(json) : body
    });

    return {
      status: response.status,
      ok: response.ok,
      body: await parseResponse(response)
    };
  } catch (error) {
    const code = error && error.cause && error.cause.code ? error.cause.code : null;
    if (code === 'ECONNREFUSED' || code === 'EPERM') {
      fail(
        `No se pudo conectar a ${API_URL}. En el Docker Compose actual el backend escucha en el puerto interno 3000, pero no esta publicado al host.`,
        'Usa: docker compose exec -T server bash /app/test-backend.sh'
      );
    }
    fail('Fallo la peticion HTTP.', String(error));
  }
}

function expectStatus(result, allowedStatuses, step) {
  if (!allowedStatuses.includes(result.status)) {
    fail(`${step}: estado inesperado ${result.status}`, result.body);
  }
}

function createUploadForm() {
  const form = new FormData();
  form.append('title', UPLOAD_TITLE);
  form.append('description', UPLOAD_DESCRIPTION);

  if (UPLOAD_FILE_PATH) {
    const buffer = fs.readFileSync(UPLOAD_FILE_PATH);
    const filename = path.basename(UPLOAD_FILE_PATH);
    form.append('file', new Blob([buffer], { type: 'video/mp4' }), filename);
    return form;
  }

  const filename = `test-${Date.now()}.mp4`;
  const contents = Buffer.from(`video-locker docker self-test ${Date.now()}\n`, 'utf8');
  form.append('file', new Blob([contents], { type: 'video/mp4' }), filename);
  return form;
}

async function main() {
  const unauthenticatedVideos = await request('/videos');
  logStep('1. /videos sin token debe responder 401', unauthenticatedVideos);
  expectStatus(unauthenticatedVideos, [401], 'Proteccion de /videos');

  const register = await request('/auth/register', {
    method: 'POST',
    json: { username: TEST_USERNAME, password: TEST_PASSWORD }
  });
  logStep('2. Registrar usuario de prueba', register);
  expectStatus(register, [200, 409], 'Registro');

  const userLogin = await request('/auth/login', {
    method: 'POST',
    json: { username: TEST_USERNAME, password: TEST_PASSWORD }
  });
  logStep('3. Login usuario de prueba', userLogin);
  expectStatus(userLogin, [200], 'Login usuario');

  const userToken = userLogin.body && userLogin.body.token;
  if (!userToken) fail('Login usuario: falta token en la respuesta.', userLogin.body);

  const videosBefore = await request('/videos', { token: userToken });
  logStep('4. Listar videos con usuario autenticado', {
    status: videosBefore.status,
    total: Array.isArray(videosBefore.body) ? videosBefore.body.length : null
  });
  expectStatus(videosBefore, [200], 'Listado inicial de videos');
  if (!Array.isArray(videosBefore.body)) {
    fail('Listado inicial de videos: se esperaba un arreglo JSON.', videosBefore.body);
  }

  const missingVideo = await request('/videos/99999999', { token: userToken });
  logStep('5. Consultar video inexistente', missingVideo);
  expectStatus(missingVideo, [404], 'Video inexistente');

  const adminLogin = await request('/auth/login', {
    method: 'POST',
    json: { username: ADMIN_USERNAME, password: ADMIN_PASSWORD }
  });
  logStep('6. Login admin', adminLogin);
  expectStatus(adminLogin, [200], 'Login admin');

  const adminToken = adminLogin.body && adminLogin.body.token;
  if (!adminToken) fail('Login admin: falta token en la respuesta.', adminLogin.body);

  const upload = await request('/admin/videos', {
    method: 'POST',
    token: adminToken,
    body: createUploadForm()
  });
  logStep('7. Subir video de prueba', upload);
  expectStatus(upload, [200], 'Upload de video');

  createdVideoId = upload.body && upload.body.id;
  if (!createdVideoId) fail('Upload de video: falta id en la respuesta.', upload.body);

  const videosAfter = await request('/videos', { token: userToken });
  const containsUploadedVideo = Array.isArray(videosAfter.body)
    && videosAfter.body.some((video) => video.id === createdVideoId);
  logStep('8. Confirmar que el video aparece en /videos', {
    status: videosAfter.status,
    total: Array.isArray(videosAfter.body) ? videosAfter.body.length : null,
    containsUploadedVideo
  });
  expectStatus(videosAfter, [200], 'Listado final de videos');
  if (!containsUploadedVideo) {
    fail('Listado final de videos: no aparecio el video recien creado.', videosAfter.body);
  }

  const removeVideo = await request(`/admin/videos/${createdVideoId}`, {
    method: 'DELETE',
    token: adminToken
  });
  logStep('9. Limpiar video temporal', removeVideo);
  expectStatus(removeVideo, [200], 'Eliminacion del video temporal');

  logStep('Resultado', {
    ok: true,
    apiUrl: API_URL,
    port: 3000,
    notes: [
      'El backend respondio correctamente a requests autenticadas y administrativas.',
      'El script no depende de curl ni jq.',
      'En Docker Compose, el servicio server solo esta expuesto a la red interna salvo que publiques un puerto.'
    ]
  });
}

main().catch((error) => fail('Ejecucion del script.', String(error)));
NODE
