// src/catalog/add/add.js
import ApiClient from '/src/core/middleware/ApiClient.js';

/* ─── configuración y cliente ─────────────────────────────── */
const API_URL = 'http://127.0.0.1:8000/api/v1';
const storage = window.sessionStorage;
const api     = new ApiClient(API_URL, storage);

// si no hay token, redirige al login
if (!storage.getItem('token')) location.replace('auth/login/login.html');

/* ─── helpers UI ───────────────────────────────────────────── */
const $   = id => document.getElementById(id);
const cap = s  => s.charAt(0).toUpperCase() + s.slice(1);

/* ─── tablas de rutas y campos ────────────────────────────── */
const plural = {
  product:'products', person:'persons',
  entity:'entities',  association:'associations'
};
const fields = {
  product:     ['name','birthDate','deathDate','imageUrl','wikiUrl'],
  person:      ['name','birthDate','deathDate','imageUrl','wikiUrl'],
  entity:      ['name','birthDate','deathDate','imageUrl','wikiUrl'],
  association: ['name','website','birthDate','deathDate','imageUrl','wikiUrl']
};
const relMap = {
  product:     ['persons','entities'],
  person:      ['entities','products'],
  entity:      ['persons','products','associations'],
  association: ['entities']
};

/* ─── identificar tipo según ?type= ───────────────────────── */
const type = new URLSearchParams(location.search).get('type');
if (!plural[type]) {
  $('form-Container').innerHTML = '<p>URL incorrecta</p>';
  throw new Error('Tipo inválido en URL');
}

/* título dinámico */
const banner = document.getElementById('element-name')
            || document.querySelector('.banner-content h1');
if (banner) banner.textContent = `Add ${cap(type)}`;

/* ─── 1 · cargar listas auxiliares ─────────────────────────── */
async function loadLists () {
  const [persons, entities, products, associations] = await Promise.all([
    api.get('persons').then(r => (r?r.persons:[]).map(x=>x.person??x)),
    api.get('entities').then(r => (r?r.entities:[]).map(x=>x.entity??x)),
    api.get('products').then(r => (r?r.products:[]).map(x=>x.product??x)),
    api.get('associations').then(r => (r?r.associations:[]).map(x=>x.association??x))
  ]);

  await buildForm({ persons, entities, products, associations });
}

/* ─── 2 · construir formulario ────────────────────────────── */
async function buildForm (lists) {
  const box  = $('form-Container');
  const form = document.createElement('form');
  form.id = 'createForm';
  form.className = 'login-card';
  box.appendChild(form);

  /* botón cerrar */
  const btnClose = document.createElement('button');
  btnClose.id = 'close-button';
  btnClose.className = 'login-button';
  btnClose.formNoValidate = 'true';
  btnClose.textContent = 'X';
  btnClose.addEventListener('click', () => location.replace('index.html'));
  form.appendChild(btnClose);

  const inputContainer = document.createElement('div');
  inputContainer.className = 'input-container';
  form.appendChild(inputContainer);

  /* 2.1 campos simples */
  fields[type].forEach(f => {
    inputContainer.innerHTML += `
      <div class="input-group">
        <label for="${f}">${cap(f)}</label>
        <input id="${f}" name="${f}"
               type="${f.includes('Date') ? 'date' : 'text'}"
               ${/name/.test(f) ? 'required' : ''}>
      </div>`;
  });

  /* 2.2 relaciones (checkbox) */
  if(relMap)
  relMap[type].forEach(rel => {
    const items = lists[rel];
    if (!items.length) return;
    inputContainer.innerHTML += `
      <div class="form-group">
        <label>Select ${cap(rel)}</label>
        <div class="checkbox-list">
          ${items.map(it => `
            <div class="checkbox-item">
              <input type="checkbox" id="${rel}_${it.id}"
                     name="${rel}" value="${it.id}">
              <label for="${rel}_${it.id}">${it.name}</label>
            </div>`).join('')}
        </div>
      </div>`;
  });

  /* 2.3 botón Guardar */
  form.innerHTML += `<button type="submit">Save ${cap(type)}</button>`;
  form.addEventListener('submit', onSubmit);
}

/* ─── 3 · submit handler ──────────────────────────────────── */
async function onSubmit (e) {
  e.preventDefault();
  if(e.submitter.id === 'close-button') window.location.href = 'index.html';
  const fd = new FormData(e.target);

  /* 3.1 cuerpo simple */
  const body = {};
  fields[type].forEach(f => {
    const v = fd.get(f);
    if (v) body[f] = v;
  });

  try {
    /* 3.2 POST principal */
    const created = await api.post(plural[type], body);
    const newId   = (created[fieldName(type)] ?? created).id;

    /* 3.3 vínculos */
    await Promise.all(
      relMap[type].flatMap(rel => {
        const ids = fd.getAll(rel).map(Number);
        return ids.map(rid =>
          api.put(`${plural[type]}/${newId}/${rel}/add/${rid}`,
                  null, { returnJson:false })
        );
      })
    );

    alert('Creado correctamente');
    // redirige a detalle
    location.replace(`catalog/detail/detail.html?${type}=${newId}`);
  } catch (err) {
    alert('Error al crear: ' + err.message);
  }
}

/* util pequeño */
const fieldName = t => ({product:'product',
                         person:'person',
                         entity:'entity',
                         association:'association'}[t]);

/* ─── init ─────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', loadLists);
