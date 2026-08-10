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

// Función para filtrar productos en la página actual
function filtrarProductos() {
  const input = document.getElementById("searchInput");
  if (!input) return;

  const filtro = input.value.toLowerCase();
  const tarjetas = document.querySelectorAll(".producto-card");

  tarjetas.forEach((tarjeta) => {
    const titulo = tarjeta.querySelector("h3").textContent.toLowerCase();
    if (titulo.includes(filtro)) {
      tarjeta.style.display = "";
    } else {
      tarjeta.style.display = "none";
    }
  });
}

// Función para redirigir si el usuario presiona Enter o clic en la lupa desde Inicio/Categorías
function manejarBusquedaGlobal(event) {
  // Escucha si se presiona la tecla 'Enter' (keyCode 13) o si se activa directamente
  if (event.type === "click" || event.key === "Enter") {
    const input = document.getElementById("searchInput");
    if (input && input.value.trim() !== "") {
      // Guardamos lo que escribió en la memoria del navegador
      sessionStorage.setItem("terminoBusqueda", input.value.trim());

      // Redirigimos a la página de catálogo (ejemplo: viento.html)
      // Ajusta la ruta según la ubicación de tus HTML
      window.location.href = "viento.html";
      window.location.href = "teclado.html";
      window.location.href = "electronicos.html";
    }
  }
}