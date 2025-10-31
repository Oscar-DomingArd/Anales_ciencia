
import ApiClient from '/src/core/middleware/ApiClient.js';

/* ─── configuración y cliente ──────────────────────────────── */
const API_URL = 'http://127.0.0.1:8000/api/v1';
const storage = window.sessionStorage;
const api     = new ApiClient(API_URL, storage);

// si no hay token, redirige al login
if (!storage.getItem('token')) location.replace('auth/login/login.html');

/* ─── mapas estáticos ──────────────────────────────────────── */
const pluralPath = {
  product: 'products',
  person:  'persons',
  entity:  'entities',
  association: 'associations',
  user:    'users'
};
const fieldName = {
  product: 'product',
  person:  'person',
  entity:  'entity',
  association: 'association',
  user:    'user'
};

/* ─── helpers DOM ──────────────────────────────────────────── */
const $ = id => document.getElementById(id);
const formBox = $('form-Container');
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);

/* ─── parseo URL: ?product=3 … ─────────────────────────────── */
const params = new URLSearchParams(location.search);
const [[type, rawId]] = [...params.entries()];
const id = Number(rawId);
if (!type || !pluralPath[type] || !id) {
  formBox.innerHTML = '<p>URL incorrecta</p>';
  throw new Error('Parámetros de URL inválidos');
}

let originalRelIds = {};   // { persons:[1,3], … }
let currentEtag    = '';

/* ──────────────────────────────────────────────────────────────
   1 · Cargar datos principales + listas de apoyo
──────────────────────────────────────────────────────────────── */
async function loadData () {
  /* 1.1 detalle con ETag */
  const res   = await api.get(`${pluralPath[type]}/${id}`, { returnJson:false });
  const detail = await res.json();
  const node   = detail[fieldName[type]] ?? detail;
  currentEtag  = res.headers.get('etag') || '';

  /* 1.2 cabecera */
  const headerEl = $('banner-name');
  if (headerEl) headerEl.textContent = `Update "${node.name || 'Item'}"`;

  /* 1.3 relaciones iniciales */
  ['persons','entities','products','associations'].forEach(key=>{
    if (Array.isArray(node[key])) originalRelIds[key] = node[key];
  });

  /* 1.4 listas externas para checkboxes */
  const [persons, entities, products, associations] = await Promise.all([
    api.get('persons').then(r => (r?r.persons:[]).map(x=>x.person??x)),
    api.get('entities').then(r => (r?r.entities:[]).map(x=>x.entity??x)),
    api.get('products').then(r => (r?r.products:[]).map(x=>x.product??x)),
    api.get('associations').then(r => (r?r.associations:[]).map(x=>x.association??x))
  ]);

  buildForm(node, { persons, entities, products, associations });
}

/* ──────────────────────────────────────────────────────────────
   2 · Generar formulario dinámico
──────────────────────────────────────────────────────────────── */
function buildForm (node, lists) {
  const form = document.createElement('form');
  form.id = 'updateForm';
  form.className = 'login-card';
  formBox.appendChild(form);


  const btnClose = document.createElement('button');
  btnClose.id = 'close-button';
  btnClose.className = 'login-button';
  btnClose.type = 'button';
  btnClose.textContent = 'X';
  btnClose.addEventListener('click', () => location.replace('index.html'));
  form.appendChild(btnClose);

  /* 2.1 campos simples por tipo */
  const simpleFields = {
    product:     ['name','birthDate','deathDate','imageUrl','wikiUrl'],
    person:      ['name','birthDate','deathDate','imageUrl','wikiUrl'],
    entity:      ['name','birthDate','deathDate','imageUrl','wikiUrl'],
    association: ['name','website','birthDate','deathDate','imageUrl','wikiUrl'],
  }[type];

  simpleFields.forEach(f => {
    const wrap = document.createElement('div');
    wrap.className = 'input-group';
    wrap.innerHTML = `
      <label for="${f}">${cap(f)}</label>
      <input id="${f}" name="${f}" type="${f.includes('Date') ? 'Date' : 'text'}"
             value="${node[f] ?? ''}">
    `;
    form.appendChild(wrap);
  });

  /* 2.2 relaciones (checkbox) */
  const relMap = {
    product:     { persons:lists.persons, entities:lists.entities },
    entity:      { persons:lists.persons, products:lists.products, associations:lists.associations },
    person:      { entities:lists.entities, products:lists.products },
    association: { entities:lists.entities }
  }[type] || {};

  for (const [rel, items] of Object.entries(relMap)) {
    const grp = document.createElement('div');
    grp.className = 'form-group';
    grp.innerHTML = `<label>Select ${cap(rel)}</label>`;
    const box = document.createElement('div');
    box.className = 'checkbox-list';

    items.forEach(it => {
      const checked = node[rel]?.includes(it.id);
      box.innerHTML += `
        <div class="checkbox-item">
          <input type="checkbox" id="${rel}_${it.id}" name="${rel}"
                 value="${it.id}" ${checked ? 'checked' : ''}>
          <label for="${rel}_${it.id}">${it.name}</label>
        </div>`;
    });
    grp.appendChild(box);
    form.appendChild(grp);
  }

  /* 2.3 botón de guardado */
  const btn = document.createElement('button');
  btn.type = 'submit';
  btn.textContent = 'Save';
  form.appendChild(btn);

  /* 2.4 handler submit */
  form.addEventListener('submit', onSubmit(simpleFields, relMap));
}

/* ──────────────────────────────────────────────────────────────
   3 · Guardar cambios y sincronizar relaciones
──────────────────────────────────────────────────────────────── */
function onSubmit (simpleFields, relMap) {
  return async e => {
    e.preventDefault();
    // botón cerrar → volver al index principal
    if (e.submitter?.id === 'close-button') return location.replace('index.html');

    const fd = new FormData(e.target);

    /* 3.1 campos simples */
    const body = {};
    simpleFields.forEach(f => {
      const val = fd.get(f);
      if (val !== null && val !== '') body[f] = val;
    });

    /* PUT principal con If-Match */
    if (Object.keys(body).length) {
      await api.put(`${pluralPath[type]}/${id}`, body, {
        headers: { 'If-Match': currentEtag }
      });
    }

    /* 3.2 relaciones add / rem */
    for (const rel of Object.keys(relMap)) {
      const newIds = fd.getAll(rel).map(Number);
      const oldIds = originalRelIds[rel] || [];

      const add = newIds.filter(x => !oldIds.includes(x));
      const rem = oldIds.filter(x => !newIds.includes(x));

      /* PUT sin body */
      await Promise.all([
        ...add.map(rid => api.put(`${pluralPath[type]}/${id}/${rel}/add/${rid}`, null, { returnJson:false })),
        ...rem.map(rid => api.put(`${pluralPath[type]}/${id}/${rel}/rem/${rid}`, null, { returnJson:false }))
      ]);
    }

    alert('Actualizado');
    // redirige a detalle
    location.replace(`catalog/detail/detail.html?${type}=${id}`);
  };
}

/* ─── init ──────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', loadData);