import ApiClient from '/src/core/middleware/ApiClient.js';

const API_URL = 'http://127.0.0.1:8000/api/v1';
const storage = window.sessionStorage;
const api     = new ApiClient(API_URL, storage);

// ─────────────────────────────────────────────
// 1. Elementos del DOM
// ─────────────────────────────────────────────
const $ = id => document.getElementById(id);

const currentUserSpan   = $('btn-profile');
const btnLogout         = $('btnLogout');

const btnAddProduct     = $('btnAddProduct');
const btnAddPerson      = $('btnAddPerson');
const btnAddEntity      = $('btnAddEntity');
const btnAddAssociation = $('btnAddAssociation');
const profileBtn = $('btnDetails');
const userArea          = $('user-area');

// ─────────────────────────────────────────────
// 2. Cargar datos del usuario
// ─────────────────────────────────────────────
async function loadCurrentUserData() {
  const username = storage.getItem('username');
  if (!username) {
    // sin usuario → login
    return window.location.replace('auth/login/login.html');
  }

  // a) completa id y rol
  await api.loadUserData(username);

  // b) guarda el ETag (si lo necesitas para PUT condicionales)
  const detailRes = await api.get(`users/${api.getUserId()}`, { returnJson:false });
  storage.setItem('etag', detailRes.headers.get('etag') || '');

  // c) rol inactivo → logout inmediato
  if (api.getUserRole() === 'INACTIVE') {
    alert('Esta cuenta está inactiva');
    api.clearCredentials();
    return window.location.replace('auth/login/login.html');
  }
}

// ─────────────────────────────────────────────
// 3. Actualizar la interfaz
// ─────────────────────────────────────────────
function toggle(el, show) {
  if (el) el.style.display = show ? 'block' : 'none';
}

function updateUI() {
  const username = storage.getItem('username');
  const role     = api.getUserRole();        // ← ¡llamado como método!

  if (!username) {
    if (userArea) userArea.style.display = 'none';
    return window.location.replace('auth/login/login.html');
  }

  if (userArea) userArea.style.display = 'block';
  if (currentUserSpan) currentUserSpan.textContent = username;

  const canWrite = role === 'WRITER';
  toggle(btnAddProduct,     canWrite);
  toggle(btnAddPerson,      canWrite);
  toggle(btnAddEntity,      canWrite);
  toggle(btnAddAssociation, canWrite);
}

// ─────────────────────────────────────────────
// 4. Logout
// ─────────────────────────────────────────────
btnLogout?.addEventListener('click', () => {
  api.clearCredentials();
  window.location.replace('auth/login/login.html');
});

// ─────────────────────────────────────────────
// 5. Inicio
// ─────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  try {
    // sólo carga si aún no conocemos rol / etag
    if (api.getUserRole() === undefined || !storage.getItem('etag')) {
      await loadCurrentUserData();
    }
  } catch (err) {
    console.error(err);
    api.clearCredentials();
    return window.location.replace('auth/login/login.html');
  }

  updateUI();
});

profileBtn?.addEventListener('click', () => {
  window.location.href = 'users/detail/userDetails.html';
});