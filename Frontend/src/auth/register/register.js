// src/auth/register/register.js
import ApiClient from '/src/core/middleware/ApiClient.js';

const API_URL = 'http://127.0.0.1:8000/api/v1';
const storage = window.sessionStorage;
const api     = new ApiClient(API_URL, storage);

const form = document.getElementById('register-form');

/* helpers UI */
const $     = id  => document.getElementById(id);
const toast = msg => alert(msg);  // cámbialo por tu componente preferido

/* ─── función de registro usando ApiClient ─────────────────── */
async function registerUser(username, email, password) {
  try {
    await api.post('users', { username, email, password });
  } catch (err) {
    if (err.message.includes('409')) {  // 409 CONFLICT típico “username exists”
      throw new Error('Usuario ya existe');
    }
    throw err;
  }
}

function resetUser(){
  document.getElementById('username').value = '';
  document.getElementById('password').value = '';
}

/* ─── submit del formulario ────────────────────────────────── */
form.addEventListener('submit', async e => {
  e.preventDefault();

  const username = $('username').value.trim();
  const email    = $('email').value.trim();
  const password = $('password').value;

  if (!username || !email || !password) {
    return toast('Rellena usuario, email y contraseña');
  }

  if(! /^[a-zA-Z0-9()áéíóúÁÉÍÓÚñÑ %$\.+-]+$/.test(username)){
    resetUser();
    alert("Error: Nombre de usuario no válido.\n Al menos un caracter válido: a-z,A-Z,0-9,(),áéíóúÁÉÍÓÚñÑ, ,%,$\.+-")
    return;
  }

  const resp = await api.exist('users/username/'+username);
  if(resp.status === 204){
    resetUser();
    alert("Error: Nombre de usuario ya existente.");
    return;
  }

  try {
    await registerUser(username, email, password);
    toast('Usuario creado.');
    location.replace('index.html');
  } catch (err) {
    toast(err.message);
    $('password').value = '';
  }
});