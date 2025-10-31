
export default class ApiClient {
  constructor(baseURL, storage = window.sessionStorage) {
    this.baseURL  = baseURL;
    this.storage  = storage;
    this._userId = undefined;
    this._userRole = undefined;
    if (storage.getItem('token')) this.loadUserData(storage.getItem('username'));
  }


  get token() {
    return this.storage.getItem('token');
  }


  _authHeaders(extra = {}) {
    const hdrs = { ...extra };
    if (this.token) {                       // ⟵ nuevo  (solo si hay token)
      hdrs.Authorization = `Bearer ${this.token}`;
    }
    return hdrs;
  }

  //--------------------------------------------------
  //   METODO GENÉRICO
  //--------------------------------------------------
  async request(method, endpoint, { body = null, returnJson = true, headers = {} } = {}) {
    // Detecta si body es texto plano, URLSearchParams, FormData, etc.
    const isPlainObject =
      body && typeof body === 'object' &&
      !(body instanceof FormData) &&
      !(body instanceof URLSearchParams) &&
      !(body instanceof Blob);

    const hdrs = this._authHeaders(headers);

    // Content-Type automático sólo para JSON
    if (isPlainObject) hdrs['Content-Type'] = 'application/json';

    const payload = isPlainObject ? JSON.stringify(body) : body;

    const res = await fetch(`${this.baseURL}/${endpoint}`, {
      method,
      headers: hdrs,
      body: payload
    });

    // Token caducado → limpia y redirige
    if (res.status === 401) {
      this.clearCredentials();
      window.location.replace('index.html');
      return;                          // para evitar seguir ejecutando
    }

    //Esto no me convence, pero ahora mismo no se me ocurre nada mejor, cambiar por tratamiento de errores
    if(res.status === 404) return;

    if (!res.ok) throw new Error(`Error ${res.status} (${endpoint})`);

    if (res.status === 204) {
      return res;
    }
    // Devolver JSON o el Response tal cual
    return returnJson ? res.json() : res;
  }

  //--------------------------------------------------
  //   METODOS
  //--------------------------------------------------
  get   (ep, opts) { return this.request('GET',    ep, opts); }
  post  (ep, b, o={}) { return this.request('POST', ep, { ...o, body: b }); }
  put   (ep, b, o={}) { return this.request('PUT',  ep, { ...o, body: b }); }
  delete(ep, opts) {    return this.request('DELETE', ep, opts); }
  exist (ep, opts) { return this.request('GET', ep, opts); }


  async loadUserData(username) {
    // 1) usa this.get
    const raw = await this.get('users');          // ✔

    // 2) aplana si viene { user:{…} }
    const usersArr = (raw.users || []).map(u => u.user ?? u);

    // 3) tu usuario
    const me = usersArr.find(
      u => u.username.toLowerCase() === username.toLowerCase()
    );
    if (!me) throw new Error('Usuario no encontrado en /users');

    // 4) asigna, no llames
    this._userId  = me.id;                        // ✔
    this._userRole = me.role;                     // ✔
  }


  getUserId(){return this._userId};
  getUserRole(){return this._userRole}
  //--------------------------------------------------
  //   BORRAR CREDENCIALES (LOGOUT)
  //--------------------------------------------------
  clearCredentials() {
    ['token','username','etag']
      .forEach(k => this.storage.removeItem(k));
    this._userId = undefined;
    this._userRole = undefined;
  }
}
