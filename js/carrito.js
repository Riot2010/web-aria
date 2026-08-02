/* ==========================================================
   carrito.js
   Lógica del carrito de compras usando localStorage.
   Inclúyelo en TODAS tus páginas (product pages, carrito.html,
   compra.html) con: <script src="../js/carrito.js"></script>
   ========================================================== */

const CARRITO_KEY = 'carritoAria';
const ENVIO = 5.00;

// Devuelve el carrito guardado (array de productos)
function obtenerCarrito() {
  const data = localStorage.getItem(CARRITO_KEY);
  return data ? JSON.parse(data) : [];
}

// Guarda el carrito completo
function guardarCarrito(carrito) {
  localStorage.setItem(CARRITO_KEY, JSON.stringify(carrito));
  actualizarContadorCarrito();
}

// Agrega un producto al carrito. Si ya existe (mismo id), suma cantidad.
// producto = { id, nombre, precio, imagen }
function agregarAlCarrito(producto, cantidad = 1) {
  const carrito = obtenerCarrito();
  const existente = carrito.find(p => p.id === producto.id);

  if (existente) {
    existente.cantidad += cantidad;
  } else {
    carrito.push({ ...producto, cantidad });
  }

  guardarCarrito(carrito);
}

// Cambia la cantidad de un producto (delta puede ser +1 o -1)
function cambiarCantidadCarrito(id, delta) {
  const carrito = obtenerCarrito();
  const producto = carrito.find(p => p.id === id);
  if (!producto) return;

  producto.cantidad += delta;
  if (producto.cantidad < 1) producto.cantidad = 1;

  guardarCarrito(carrito);
}

// Elimina un producto del carrito por id
function eliminarDelCarrito(id) {
  const carrito = obtenerCarrito().filter(p => p.id !== id);
  guardarCarrito(carrito);
}

// Vacía el carrito por completo (se usa después de confirmar la compra)
function vaciarCarrito() {
  guardarCarrito([]);
}

// Calcula subtotal, envío y total
function calcularTotalesCarrito() {
  const carrito = obtenerCarrito();
  const subtotal = carrito.reduce((acc, p) => acc + p.precio * p.cantidad, 0);
  const envio = carrito.length > 0 ? ENVIO : 0;
  return {
    subtotal,
    envio,
    total: subtotal + envio
  };
}

// Actualiza el número que aparece en el ícono del carrito de la navbar,
// si existe un elemento con id="contadorCarrito" en la página.
function actualizarContadorCarrito() {
  const contador = document.getElementById('contadorCarrito');
  if (!contador) return;
  const totalItems = obtenerCarrito().reduce((acc, p) => acc + p.cantidad, 0);
  contador.textContent = totalItems;
  contador.style.display = totalItems > 0 ? 'inline-flex' : 'none';
}

document.addEventListener('DOMContentLoaded', actualizarContadorCarrito);