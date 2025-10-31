// src/users/detail/manageUserDetails.js
import ApiClient from '/src/core/middleware/ApiClient.js';

const API_URL = 'http://127.0.0.1:8000/api/v1';
const storage = window.sessionStorage;
const api     = new ApiClient(API_URL, storage);

// si no hay token, redirige al login
if (!storage.getItem('token')) location.replace('auth/login/login.html');

/* ----------------------------------------------------------------
   2. Referencias al DOM
---------------------------------------------------------------- */
const $ = id => document.getElementById(id);
const bannerName   = $('banner-name');
const frm          = $('details-form');
const btnOther     = $('btn-other-users');
const btnDelete    = $('btnDeleteUser');
const fEmail       = $('email');
const fName        = $('name');
const fPass        = $('password');
const fRoleGroup   = $('input-role');
const fRole        = $('role');
const passGroup    = $('input-password');
const pass         = $('password');
const btnClose     = $('close-button');

(async function init () {
  // nos aseguramos de tener _userId y _userRole
  const username = storage.getItem('username');
  if (!username) return location.replace('auth/login/login.html');

  await api.loadUserData(username);

  const myId   = api.getUserId();
  const myRole = api.getUserRole();

  const qsId        = new URLSearchParams(location.search).get('user');
  if(myRole !== 'WRITER' && (qsId !== null && myId !== qsId)) {
    alert('No se ha podido cargar usuario: No tienes suficientes permisos');
    window.location.replace('users/detail/userDetails.html');
  }
  const editId      = qsId ? +qsId : myId;
  const editingSelf = editId === myId;

  let currentEtag   = '';

  // 1. Cargar datos del usuario seleccionado
  async function loadUser () {
    try {
      const res  = await api.get(`users/${editId}`, { returnJson:false });
      const data = await res.json();
      const user = data.user ?? data;

      currentEtag           = res.headers.get('etag');
      bannerName.textContent = user.username;
      fEmail.value           = user.email     ?? '';
      fName.value            = user.username  ?? '';
      fRole.value            = user.role      ?? 'INACTIVE';

      fPass.required = editingSelf;

      if (myRole === 'WRITER') {
        btnOther.style.display   = 'block';
        fRoleGroup.style.display = 'block';
        passGroup.style.display  = editingSelf ? 'block' : 'none';
        btnDelete.style.display  = editingSelf ? 'none'  : 'block';
      } else {
        btnDelete.style.display  = 'none';
        fRoleGroup.style.display = 'none';
        passGroup.style.display  = 'block';
      }
    } catch (err) {
      alert('No se pudieron cargar datos: ' + err.message);
      location.replace('index.html');
    }
  }

  // 2. Guardar cambios (PUT /users/{id})
  frm.addEventListener('submit', async e => {
    e.preventDefault();
    if (e.submitter.id === 'btnDeleteUser') return;

    const body = {
      email:     fEmail.value.trim(),
      username:  fName.value.trim(),
      password:  fPass.value || undefined,
      role:      myRole === 'WRITER' ? fRole.value.trim() : undefined
    };
    Object.keys(body).forEach(k => (body[k] === '' || body[k] === undefined) && delete body[k]);

    if (!Object.keys(body).length) return alert('No hay cambios');

    if(! /^[a-zA-Z0-9()áéíóúÁÉÍÓÚñÑ %$\.+-]+$/.test(body['username'])){
      loadUser();
      alert("Error: Nombre de usuario no válido.\n Al menos un caracter válido: a-z,A-Z,0-9,(),áéíóúÁÉÍÓÚñÑ, ,%,$\.+-")
      return;
    }

    if(!['WRITER', 'READER', 'INACTIVE'].includes(body['role'])){
      loadUser();
      alert("Error: Rol inexistente");
      return;
    }

    try {
      await api.put(`users/${editId}`, body, { headers: { 'If-Match': currentEtag } });
      alert('Usuario actualizado');
      if (editingSelf) {
        if (body.username) storage.setItem('username', body.username);
        if (body.role)     storage.setItem('userRole', body.role);
      }
      location.reload();
    } catch (err) {
      alert('No se pudo actualizar: ' + err.message);
    }
  });

  // 3. Eliminar usuario (DELETE /users/{id})
  btnDelete.addEventListener('click', async () => {
    if (!confirm('¿Eliminar este usuario?')) return;
    try {
      await api.delete(`users/${editId}`, { returnJson:false });
      alert('Usuario eliminado');
      location.replace('index.html');
    } catch (err) {
      alert('No se pudo eliminar: ' + err.message);
    }
  });

  // 4. Navegación varios
  btnOther.addEventListener('click', () => location.href = 'users/list/usersList.html');
  btnClose.addEventListener('click', () => location.href = 'index.html');

  // 5. Primera carga
  await loadUser();
})();