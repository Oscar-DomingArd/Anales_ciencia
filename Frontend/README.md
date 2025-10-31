# Annals of Science - Frontend Project Final - Andres Benito Llorente y Oscar Domingez Ardaiz

## Descripción
Annals of Science es una aplicación web que permite gestionar y visualizar información sobre productos, inventores y entidades científicas. La aplicación incluye funcionalidades CRUD (Crear, Leer, Actualizar, Eliminar) y un sistema de autenticación de usuarios.

## Características Principales
- Visualización de productos, inventores y entidades
- Sistema de autenticación (login/logout)
- Funcionalidades CRUD para gestionar elementos
- Integración con Wikipedia para información adicional
- Diseño responsive y moderno
- Interfaz de usuario intuitiva

## Estructura del Proyecto
```
src/
├── img/                 # Imágenes y assets
├── js/                  # Código JavaScript
│   ├── CRUD/           # Funcionalidades CRUD
│   │   ├── add.js      # Añadir elementos
│   │   └── update.js   # Actualizar elementos
│   └── services/       # Servicios
│       ├── auth.js     # Autenticación
│       └── detailGenerator.js # Generación de detalles
├── styles/             # Estilos CSS
│   └── pages/         # Estilos específicos por página
├── addForm.html        # Formulario para añadir elementos
├── detail.html         # Página de detalles
├── index.html          # Página principal
└── updateForm.html     # Formulario para actualizar elementos
```

## Funcionalidades

### Autenticación
- Login de usuarios
- Logout
- Protección de rutas y funcionalidades

### Gestión de Elementos
- **Productos**
  - Nombre
  - Fecha de creación
  - Fecha de finalización (opcional)
  - Imagen
  - Enlace a Wikipedia
  - Inventores asociados
  - Entidades asociadas

- **Inventores**
  - Nombre
  - Fecha de nacimiento
  - Fecha de fallecimiento (opcional)
  - Imagen
  - Enlace a Wikipedia

- **Entidades**
  - Nombre
  - Fecha de creación
  - Fecha de finalización (opcional)
  - Imagen
  - Enlace a Wikipedia
  - Inventores fundadores

### Interfaz de Usuario
- Diseño responsive
- Formularios con validación
- Listas de selección con checkboxes
- Botones de acción contextuales
- Integración con Wikipedia mediante iframe
- Estilos consistentes y modernos

## Tecnologías Utilizadas
- HTML5
- CSS3
- JavaScript (ES6+)
- LocalStorage para persistencia de datos

## Estilos
- Paleta de colores principal: #0F766E (verde teal)
- Paleta de colores secundaria: #14B8A6 (verde teal claro)
- Diseño responsive con media queries
- Animaciones y transiciones suaves
- Estilos consistentes en toda la aplicación

## Cómo Usar
1. Accede a la página principal (index.html)
2. Navega por los diferentes elementos
3. Inicia sesión para acceder a funcionalidades de edición
4. Utiliza los formularios para añadir o actualizar elementos
5. Visualiza los detalles de cada elemento con información adicional de Wikipedia

## Notas de Desarrollo
- La aplicación utiliza LocalStorage para persistencia de datos
- Los formularios incluyen validación básica
- La interfaz es completamente responsive
- Se mantiene un estilo consistente en toda la aplicación
