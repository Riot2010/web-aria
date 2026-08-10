// Se ejecuta cuando el documento se carga completamente
document.addEventListener("DOMContentLoaded", () => {
  // Verificar si hay un término de búsqueda guardado en la sesión
  const busquedaGuardada = sessionStorage.getItem("terminoBusqueda");
  const inputBusqueda = document.getElementById("searchInput");

  // Si estamos en una página con productos y hay una búsqueda pendiente, la ejecutamos
  if (busquedaGuardada && inputBusqueda) {
    inputBusqueda.value = busquedaGuardada;
    filtrarProductos();
    // Limpiamos la memoria para futuras búsquedas
    sessionStorage.removeItem("terminoBusqueda");
  }
});

// Función para filtrar productos en la página actual en tiempo real
function filtrarProductos() {
  const input = document.getElementById("searchInput");
  if (!input) return;

  const filtro = input.value.toLowerCase().trim();
  const tarjetas = document.querySelectorAll(".producto-card");

  tarjetas.forEach((tarjeta) => {
    // Buscamos el título dentro de la tarjeta del producto
    const tituloElemento = tarjeta.querySelector("h3");
    if (tituloElemento) {
      const titulo = tituloElemento.textContent.toLowerCase();
      if (titulo.includes(filtro)) {
        tarjeta.style.display = ""; // Muestra el producto
      } else {
        tarjeta.style.display = "none"; // Oculta el producto
      }
    }
  });
}

// Función para manejar la búsqueda (desde Enter o clic en la lupa)
function manejarBusquedaGlobal(event) {
  // Escucha si presiona Enter o si es un evento de clic
  if (event.type === "click" || event.key === "Enter") {
    const input = document.getElementById("searchInput");
    if (!input || input.value.trim() === "") return;

    const textoBusqueda = input.value.trim();
    const tarjetas = document.querySelectorAll(".producto-card");

    // CASO 1: Si ya hay productos en la página actual (ejemplo: estás en teclado.html)
    if (tarjetas.length > 0) {
      filtrarProductos();
    } 
    // CASO 2: Si estás en Inicio o Contacto donde no hay productos visibles
    else {
      // Guardamos la búsqueda en memoria temporal
      sessionStorage.setItem("terminoBusqueda", textoBusqueda);

      // Redirigimos a una página de catálogo principal (puedes cambiar "categorias.html" por la que prefieras)
      window.location.href = "categorias.html"; 
    }
  }
}