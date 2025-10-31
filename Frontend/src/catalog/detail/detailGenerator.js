// src/catalog/detail/detailGenerator.js
import ApiClient from '/src/core/middleware/ApiClient.js';

const API_URL  = 'http://127.0.0.1:8000/api/v1';
const storage = window.sessionStorage;
const api = new ApiClient(API_URL, storage);

/* ─────────────────────────────── helpers genéricos ─────────────────────── */
const $ = id => document.getElementById(id);
const capitalize = str => str.charAt(0).toUpperCase() + str.slice(1);

function toggle(el, show) {
  if (el) el.style.display = show ? 'block' : 'none';
}

function paragraph(label, text) {
  const p = document.createElement('p');
  p.textContent = `${label}: ${text}`;
  return p;
}

/* ──────────────────────────────── mapas estáticos ──────────────────────── */
const pathByType  = {
  product:      'products',
  person:       'persons',
  entity:       'entities',
  association:  'associations'
};
const fieldByType = {
  product:      'product',
  person:       'person',
  entity:       'entity',
  association:  'association'
};
const endpointByRelation = {
  products:     'products',
  entities:     'entities',
  persons:      'persons',
  inventors:    'persons',
  associations: 'associations'
};

/* ──────────────────────────────── flujo principal ──────────────────────── */
async function initDetail() {
  /* 1 · Parámetros de la URL */
  const params = new URLSearchParams(location.search);
  const [[type, rawId]] = [...params.entries()];
  const id = Number(rawId);

  if (!type || !pathByType[type] || !id) {
    alert('URL incorrecta');
    return;
  }

  /* 2 · Registro principal */
  const rawData = await api.get(`${pathByType[type]}/${id}`);
  if (!rawData) {
    alert('No se pudo cargar detalles: Item inexistente.');
    window.location.replace('index.html');
  }
  const data = rawData[fieldByType[type]] ?? rawData;

  /* 3 · Cabecera e imagen */
  $('banner-name').textContent = data.name ?? 'Detalle';
  if (data.imageUrl) {
    $('element-image').innerHTML = `<img src="${data.imageUrl}" alt="${data.name}">`;
  }
  if (data.wikiUrl) {
    $('wiki-iframe').src = data.wikiUrl;
  }

  /* 4 · Propiedades */
  const box = $('element-content');
  box.innerHTML = '';

  for (const [key, value] of Object.entries(data)) {
    if (['id', 'name', 'imageUrl', 'wikiUrl'].includes(key)) continue;

    /* valores simples */
    if (typeof value === 'string' && value.trim()) {
      box.appendChild(paragraph(capitalize(key), value));
      continue;
    }

    /* relaciones → ids */
    if (Array.isArray(value) && endpointByRelation[key]) {
      const plural = endpointByRelation[key];
      const dataRel = await api.get(`${pathByType[type]}/${id}/${plural}`);
      const names = (dataRel[plural] ?? []).map(item => Object.values(item)[0].name);
      if (names.length) {
        box.appendChild(paragraph(capitalize(key), names.join(', ')));
      }
    }
  }

  /* 5 · Botones Update / Delete según rol */
  const btnDelete = $('btnDelete');
  const btnUpdate = $('btnUpdate');
  const isWriter  = api.getUserRole() === 'WRITER';

  toggle(btnDelete, isWriter);
  toggle(btnUpdate, isWriter);

  btnDelete?.addEventListener('click', async () => {
    if (!confirm('¿Eliminar este elemento?')) return;
    try {
      await api.delete(`${pathByType[type]}/${id}`, { returnJson:false });
      alert('Elemento eliminado');
      // desde catalog/detail redirect al home
      location.replace('index.html');
    } catch (e) {
      console.error(e);
      alert('No se pudo eliminar');
    }
  });

  btnUpdate?.addEventListener('click', () => {
    location.href = `catalog/update/updateForm.html?${type}=${id}`;
  });
}

document.addEventListener('DOMContentLoaded', initDetail);
