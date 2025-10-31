
import ApiClient from '/src/core/middleware/ApiClient.js';

// 1. Configuración -----------------------------------------------------------
const API_BASE = 'http://127.0.0.1:8000/api/v1';
const storage  = window.sessionStorage;
const api      = new ApiClient(API_BASE, storage);

// 2. Acceso al DOM -----------------------------------------------------------
const $ = id => document.getElementById(id);

const productList      = $('Products-list');
const personsList      = $('Persons-list');
const entitiesList     = $('Entities-list');
const associationsList = $('Associations-list');

const btnAddProduct     = $('btnAddProduct');
const btnAddPerson      = $('btnAddPerson');
const btnAddEntity      = $('btnAddEntity');
const btnAddAssociation = $('btnAddAssociation');


// 3. Utilidades --------------------------------------------------------------
const singular = (plural) => plural.endsWith('ies') ? plural.slice(0, -3) + 'y' : plural.slice(0, -1);

async function fetchData(endpoint) {
  const raw = await api.get(endpoint);
  if (raw === undefined) return;
  const pluralArr = raw[endpoint];

  if (Array.isArray(pluralArr)) {
    const sing = singular(endpoint);
    return pluralArr.map(el => el[sing] ?? el);
  }
  if (Array.isArray(raw)) return raw;

  console.error('Formato inesperado', raw);
  throw new Error('Formato JSON no reconocido');
}

// 4. UI ----------------------------------------------------------------------
function createItemCard(item, type) {
  const card = document.createElement('div');
  card.className = 'item-card';

  const imgBox = document.createElement('div');
  imgBox.className = 'item-image';
  imgBox.innerHTML = `<img src="${item.imageUrl}" alt="${item.name}">`;

  const infoBox = document.createElement('div');
  infoBox.className = 'item-info';

  const h3 = document.createElement('h3');
  h3.className = 'item-name';
  h3.textContent = item.name;

  const link = document.createElement('a');
  link.className = 'item-more';
  // redirige a detalle en catalog/detail
  link.href = `catalog/detail/detail.html?${type}=${item.id}`;
  link.textContent = 'Ver más';

  infoBox.append(link, h3);
  card.append(imgBox, infoBox);
  return card;
}

const renderItems = (items, target, type) => {
  target.innerHTML = '';
  items.forEach(i => target.appendChild(createItemCard(i, type)));
};

// 5. Botones “Añadir” --------------------------------------------------------
const handleAddButton = (btn, type) => {
  if (!btn) return;
  btn.addEventListener('click', () => {
    // redirige al formulario de creación
    window.location.href = `catalog/add/addForm.html?type=${type}`;
  });
};

const setDisplay = (el, show) => { if (el) el.style.display = show ? 'block' : 'none'; };

// 6. Inicialización ----------------------------------------------------------
async function initDisplay() {
  if (!storage.getItem('username')) return window.location.replace('auth/login/login.html');
  // permisos
  let role = api.getUserRole();
  if (role === undefined) {
    const username = storage.getItem('username');
    if (username) {
      try {
        await api.loadUserData(username);
        role = api.getUserRole();
      } catch (e) { console.error(e); }
    }
  }

  const canWrite = role === 'WRITER';
  setDisplay(btnAddProduct,     canWrite);
  setDisplay(btnAddPerson,      canWrite);
  setDisplay(btnAddEntity,      canWrite);
  setDisplay(btnAddAssociation, canWrite);

  handleAddButton(btnAddProduct,     'product');
  handleAddButton(btnAddPerson,      'person');
  handleAddButton(btnAddEntity,      'entity');
  handleAddButton(btnAddAssociation, 'association');

  // datos
  try {
    const [products, persons, entities, associations] = await Promise.all([
      fetchData('products'),
      fetchData('persons'),
      fetchData('entities'),
      fetchData('associations')
    ]);

    if(products) renderItems(products,        productList,      'product');
    if(persons) renderItems(persons,          personsList,      'person');
    if(entities) renderItems(entities,        entitiesList,     'entity');
    if(associations) renderItems(associations,associationsList, 'association');
  } catch (err) {
    console.error(err);
    alert('No se pudo cargar la información. Intente más tarde.');
  }
}

// 7. Eventos globales --------------------------------------------------------
document.addEventListener('DOMContentLoaded', initDisplay);
// perfil redirige a gestión de usuario
