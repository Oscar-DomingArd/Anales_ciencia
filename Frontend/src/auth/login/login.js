// src/auth/login/login.js
import ApiClient from '/src/core/middleware/ApiClient.js';

const API_URL = 'http://127.0.0.1:8000';
const storage = window.sessionStorage;
const api     = new ApiClient(API_URL, storage);

const form = document.getElementById('login-form');

/* --- 1. si ya hay token, directo a index ------------------- */
window.addEventListener('DOMContentLoaded', () => {
  if (storage.getItem('token')) {
    
    window.location.replace('index.html');
  }
});

/* --- 2. login ---------------------------------------------- */
form.addEventListener('submit', async (event) => {
  event.preventDefault();

  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;
  if (!username || !password) return alert('Introduce usuario y contraseña.');

  // FastAPI • OAuth2 Password: x-www-form-urlencoded
  const body = new URLSearchParams({ username, password });

  try {
    const json = await api.post(
      'access_token',               // endpoint relativo a /api/v1
      body,                         // cuerpo
      {
        headers: {
          accept: 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    const token = json.access_token;
    if (!token) throw new Error('Respuesta sin access_token');

    /* --- 3. guardar token y usuario ------------------------- */
    storage.setItem('token', token);
    storage.setItem('username', username);

    /* --- 4. ¡dentro! ---------------------------------------- */
    window.location.replace('index.html');

  } catch (err) {
    alert(err.message === 'Error 400 (access_token)' ? 'Usuario inactivo' : 'No se pudo iniciar sesión');
    document.getElementById('password').value = '';
  }
});