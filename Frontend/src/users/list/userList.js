// src/users/list/usersList.js
import ApiClient from '/src/core/middleware/ApiClient.js';

const API_URL = 'http://127.0.0.1:8000/api/v1';
const storage = window.sessionStorage;
const api     = new ApiClient(API_URL, storage);

const addUserBtn   = document.getElementById('add-user');
const $            = id => document.getElementById(id);

/* ──────────────────────────────────────────────────────────────
   IIFE principal:  comprueba token + rol y genera las tarjetas
──────────────────────────────────────────────────────────────── */
(async function init () {
  // 1.  Redirección inmediata si no hay token
  if (!storage.getItem('token')) {
    return location.replace('auth/login/login.html');
  }

  // 2.  Asegura la carga de datos del usuario (role, id, etc.)
  try {
    await api.loadUserData(storage.getItem('username'));
  } catch (err) {
    storage.clear();
    return location.replace('auth/login/login.html');
  }

  // 3.  Sólo WRITER puede ver esta página
  if (api.getUserRole() !== 'WRITER') {
    return location.replace('index.html');
  }

  // 4.  Cargar y pintar las tarjetas
  await generateCards();

  // 5.  Event listeners que dependen del DOM cargado
  addUserBtn.addEventListener('click', () => location.href = 'auth/register/register.html');
})();

/* ──────────────────────────────────────────────────────────────
   Crea la tarjeta HTML para un usuario
──────────────────────────────────────────────────────────────── */
function createCard ({ id, username }) {
  const card = document.createElement('div');
  card.className  = 'item-card';
  card.style.width = '100%';

  const info = document.createElement('div');
  info.className = 'item-info';

  const h3 = document.createElement('h3');
  h3.className   = 'item-title';
  h3.textContent = username;

  const link = document.createElement('a');
  link.className = 'item-more';
  // redirige a gestión de usuario en users/detail
  link.href      = `users/detail/userDetails.html?user=${id}`;
  link.textContent = 'Manage';

  info.appendChild(h3);
  info.appendChild(link);
  card.appendChild(info);
  return card;
}

/* ──────────────────────────────────────────────────────────────
   Obtiene los usuarios y pinta las tarjetas
──────────────────────────────────────────────────────────────── */
async function generateCards () {
  try {
    const raw   = await api.get('users');
    const users = (raw.users || []).map(u => u.user ?? u);

    const container = $('cards-container');
    container.innerHTML = '';
    users.forEach(u => container.appendChild(createCard(u)));
  } catch (err) {
    console.error(err);
    alert('No se pudieron cargar los usuarios');
  }
}