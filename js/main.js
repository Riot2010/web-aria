// ===================================
// BUSCADOR DE PRODUCTOS
// ===================================

document.addEventListener("DOMContentLoaded", () => {
  const busquedaGuardada = sessionStorage.getItem("terminoBusqueda");
  const inputBusqueda = document.getElementById("searchInput");

  // Si hay una búsqueda pendiente guardada (venimos de otra página), la ejecutamos
  if (busquedaGuardada && inputBusqueda) {
    inputBusqueda.value = busquedaGuardada;
    filtrarProductos();
    sessionStorage.removeItem("terminoBusqueda");
  }

  // Búsqueda en tiempo real mientras el usuario escribe
  if (inputBusqueda) {
    inputBusqueda.addEventListener("input", filtrarProductos);
    inputBusqueda.addEventListener("keydown", manejarBusquedaGlobal);
  }

  // Si el buscador tiene un botón de lupa, lo enlazamos también
  const botonLupa = document.getElementById("searchButton");
  if (botonLupa) {
    botonLupa.addEventListener("click", manejarBusquedaGlobal);
  }
});

// Normaliza texto: minúsculas, sin tildes, sin espacios extra
function normalizarTexto(texto) {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // elimina acentos
    .trim();
}

// Filtra productos en la página actual en tiempo real
function filtrarProductos() {
  const input = document.getElementById("searchInput");
  if (!input) return;

  const filtro = normalizarTexto(input.value);
  const tarjetas = document.querySelectorAll(".producto-card");
  let coincidencias = 0;

  tarjetas.forEach((tarjeta) => {
    const tituloElemento = tarjeta.querySelector("h3");
    if (!tituloElemento) return;

    const titulo = normalizarTexto(tituloElemento.textContent);

    // Quitamos el resaltado de búsquedas anteriores
    tarjeta.classList.remove("producto-destacado");

    if (filtro === "" || titulo.includes(filtro)) {
      tarjeta.style.display = "";
      coincidencias++;
    } else {
      tarjeta.style.display = "none";
    }
  });

  mostrarMensajeSinResultados(coincidencias, filtro);
  actualizarModoDestacado(coincidencias, filtro);
}

// Centra las tarjetas visibles como grupo (sin importar la cantidad: 1, 2, 3, 4, 5...)
function actualizarModoDestacado(coincidencias, filtro) {
  const grid = document.querySelector(".productos-grid-catalogo");
  if (!grid) return;

  if (filtro !== "" && coincidencias > 0) {
    // Cambiamos de grid fijo a flex con wrap para que las tarjetas
    // se agrupen y centren juntas, sin importar cuántas sean
    grid.style.display = "flex";
    grid.style.flexWrap = "wrap";
    grid.style.justifyContent = "center";
    grid.style.alignItems = "flex-start";
    grid.style.gap = "80px 110px"; // espacio amplio vertical y horizontal
    grid.style.padding = "40px 40px";

    const tarjetasVisibles = [...document.querySelectorAll(".producto-card")]
      .filter((t) => t.style.display !== "none");

    // El borde dorado destacado solo aplica si queda UNA sola tarjeta
    if (coincidencias === 1) {
      tarjetasVisibles[0].classList.add("producto-destacado");
      tarjetasVisibles[0].scrollIntoView({ behavior: "smooth", block: "center" });
    }
  } else {
    // Sin búsqueda activa: volvemos al grid normal de 3 columnas
    grid.style.display = "";
    grid.style.flexWrap = "";
    grid.style.justifyContent = "";
    grid.style.alignItems = "";
    grid.style.gap = "";
    grid.style.padding = "";
  }
}

// Muestra un aviso centrado si no se encontraron instrumentos
function mostrarMensajeSinResultados(coincidencias, filtro) {
  let mensaje = document.getElementById("sinResultados");
  const contenedor = document.querySelector(".productos-grid-catalogo") || document.body;

  if (coincidencias === 0 && filtro !== "") {
    if (!mensaje) {
      mensaje = document.createElement("p");
      mensaje.id = "sinResultados";
      contenedor.appendChild(mensaje);
    }
    mensaje.textContent = `No se encontraron instrumentos que coincidan con "${filtro}".`;
    mensaje.style.cssText = `
      display: block;
      width: 100%;
      text-align: center;
      padding: 40px 20px;
      font-size: 1.1rem;
      color: #cccccc;
      grid-column: 1 / -1;
    `;
  } else if (mensaje) {
    mensaje.style.display = "none";
  }
}

// Función para manejar la búsqueda (desde Enter o clic en la lupa)
function manejarBusquedaGlobal(event) {
  const esEnter = event.type === "keydown" && event.key === "Enter";
  const esClic = event.type === "click";

  if (!esEnter && !esClic) return;

  const input = document.getElementById("searchInput");
  if (!input || input.value.trim() === "") return;

  const textoBusqueda = input.value.trim();
  const tarjetas = document.querySelectorAll(".producto-card");

  // CASO 1: Ya hay productos en la página actual (ej: estás en teclado.html)
  if (tarjetas.length > 0) {
    filtrarProductos();
  }
  // CASO 2: Estás en una página sin productos visibles (Inicio, Contacto, etc.)
  else {
    sessionStorage.setItem("terminoBusqueda", textoBusqueda);
    window.location.href = "categorias.html";
  }
}