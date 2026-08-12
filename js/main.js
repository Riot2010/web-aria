// ===================================
// BUSCADOR DE PRODUCTOS
// ===================================

// Páginas de catálogo donde viven las tarjetas .producto-card reales.
// Ajusta esta lista si agregas o renombras alguna página de categoría.
const CATALOGOS_DISPONIBLES = ["viento.html", "teclado.html", "electronicos.html"];

document.addEventListener("DOMContentLoaded", () => {
  const busquedaGuardada = sessionStorage.getItem("terminoBusqueda");
  const inputBusqueda = document.getElementById("searchInput");
  const hayCatalogoAqui = !!document.querySelector(".producto-card");

  // Si hay una búsqueda pendiente guardada (venimos de otra página con productos), la ejecutamos
  if (busquedaGuardada && inputBusqueda && hayCatalogoAqui) {
    inputBusqueda.value = busquedaGuardada;
    filtrarProductos();
    sessionStorage.removeItem("terminoBusqueda");
  }

  // Búsqueda en tiempo real mientras el usuario escribe (solo en páginas con catálogo de tarjetas)
  if (inputBusqueda && hayCatalogoAqui) {
    inputBusqueda.addEventListener("input", filtrarProductos);
  }

  // Páginas sin catálogo (index, categorías, contacto): cerrar el overlay al borrar la búsqueda
  if (inputBusqueda && !hayCatalogoAqui) {
    inputBusqueda.addEventListener("input", () => {
      if (inputBusqueda.value.trim() === "") {
        ocultarResultadoGlobal();
      }
    });
  }

  // NOTA: el keydown (Enter) ya se conecta desde el atributo onkeydown en el HTML.
  // No lo volvemos a conectar aquí para evitar que la búsqueda se dispare dos veces
  // en paralelo (eso era lo que dejaba el overlay "roto" tras cerrarlo una vez).

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

// Filtra productos en la página actual en tiempo real (solo aplica en catálogos con tarjetas)
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
  ocultarResultadoGlobal(); // si estábamos mostrando un resultado global, lo limpiamos al filtrar localmente
}

// Centra las tarjetas visibles como grupo (sin importar la cantidad: 1, 2, 3, 4, 5...)
function actualizarModoDestacado(coincidencias, filtro) {
  const grid = document.querySelector(".productos-grid-catalogo");
  if (!grid) return;

  if (filtro !== "" && coincidencias > 0) {
    grid.style.display = "flex";
    grid.style.flexWrap = "wrap";
    grid.style.justifyContent = "center";
    grid.style.alignItems = "flex-start";
    grid.style.gap = "70px 100px";
    grid.style.padding = "30px 30px";

    const tarjetasVisibles = [...document.querySelectorAll(".producto-card")]
      .filter((t) => t.style.display !== "none");

    if (coincidencias === 1) {
      tarjetasVisibles[0].classList.add("producto-destacado");
      tarjetasVisibles[0].scrollIntoView({ behavior: "smooth", block: "center" });
    }
  } else {
    grid.style.display = "";
    grid.style.flexWrap = "";
    grid.style.justifyContent = "";
    grid.style.alignItems = "";
    grid.style.gap = "";
    grid.style.padding = "";
  }
}

// Muestra un aviso centrado si no se encontraron instrumentos (solo en catálogos)
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

// ===================================
// BÚSQUEDA GLOBAL (páginas sin catálogo: index, categorías, contacto)
// Busca la tarjeta real en los catálogos y la muestra en un overlay de pantalla completa.
// ===================================

// Recorre las páginas de catálogo, busca una tarjeta cuyo título coincida, y devuelve su HTML
async function buscarTarjetaEnCatalogos(filtro) {
  for (const pagina of CATALOGOS_DISPONIBLES) {
    try {
      const respuesta = await fetch(pagina);
      if (!respuesta.ok) continue;

      const html = await respuesta.text();
      const documentoTemporal = new DOMParser().parseFromString(html, "text/html");
      const tarjetas = documentoTemporal.querySelectorAll(".producto-card");

      for (const tarjeta of tarjetas) {
        const tituloElemento = tarjeta.querySelector("h3");
        if (tituloElemento && normalizarTexto(tituloElemento.textContent).includes(filtro)) {
          return tarjeta.outerHTML;
        }
      }
    } catch (error) {
      console.error(`No se pudo revisar ${pagina}:`, error);
    }
  }
  return null; // no se encontró en ningún catálogo
}

// Crea (si no existe) el overlay de pantalla completa donde se muestra el resultado global
function obtenerContenedorResultadoGlobal() {
  let contenedor = document.getElementById("resultadoBusquedaGlobal");
  if (contenedor) return contenedor;

  contenedor = document.createElement("div");
  contenedor.id = "resultadoBusquedaGlobal";
  contenedor.className = "resultado-busqueda-overlay";
  contenedor.innerHTML = `
    <div class="resultado-busqueda-contenido">
      <button type="button" class="btn-cerrar-resultado" id="btnCerrarResultado" aria-label="Cerrar">&times;</button>
      <div id="resultadoBusquedaCard"></div>
    </div>
  `;

  // Se agrega directo al body: es un overlay fijo, no depende de dónde esté en el DOM
  document.body.appendChild(contenedor);

  contenedor.querySelector("#btnCerrarResultado").addEventListener("click", () => {
    const input = document.getElementById("searchInput");
    if (input) input.value = "";
    ocultarResultadoGlobal();
  });

  return contenedor;
}

// Muestra la tarjeta encontrada (o un mensaje de "sin resultados") en el overlay
function mostrarResultadoBusquedaGlobal(htmlTarjeta, textoBusqueda) {
  const contenedor = obtenerContenedorResultadoGlobal();
  const tarjetaWrapper = contenedor.querySelector("#resultadoBusquedaCard");

  if (htmlTarjeta) {
    tarjetaWrapper.innerHTML = htmlTarjeta;
    const tarjeta = tarjetaWrapper.querySelector(".producto-card");
    if (tarjeta) {
      tarjeta.classList.add("producto-destacado");
    }
  } else {
    tarjetaWrapper.innerHTML = `
      <p style="color:#cccccc; text-align:center; font-size:1.1rem;">
        No se encontraron instrumentos que coincidan con "${textoBusqueda}".
      </p>
    `;
  }

  contenedor.classList.add("activo");
  document.body.style.overflow = "hidden"; // bloquea el scroll de fondo mientras el overlay está abierto
}

// Oculta/limpia el overlay de resultado global
function ocultarResultadoGlobal() {
  const contenedor = document.getElementById("resultadoBusquedaGlobal");
  if (contenedor) {
    contenedor.classList.remove("activo");
    document.body.style.overflow = "";
  }
}

// Candado para evitar que dos búsquedas globales corran al mismo tiempo
// (por ejemplo si el usuario presiona Enter varias veces rápido)
let busquedaEnCurso = false;

// Función para manejar la búsqueda (desde Enter o clic en la lupa)
async function manejarBusquedaGlobal(event) {
  const esEnter = event.type === "keydown" && event.key === "Enter";
  const esClic = event.type === "click";

  if (!esEnter && !esClic) return;

  const input = document.getElementById("searchInput");
  if (!input || input.value.trim() === "") return;

  if (busquedaEnCurso) return; // ya hay una búsqueda en proceso, ignoramos esta

  const textoBusqueda = input.value.trim();
  const filtro = normalizarTexto(textoBusqueda);

  // ¿El instrumento buscado tiene una tarjeta EN ESTA MISMA página?
  const tarjetasLocales = document.querySelectorAll(".producto-card");
  const hayCoincidenciaLocal = [...tarjetasLocales].some((tarjeta) => {
    const tituloElemento = tarjeta.querySelector("h3");
    return tituloElemento && normalizarTexto(tituloElemento.textContent).includes(filtro);
  });

  // CASO 1: Sí está en esta página -> lo filtramos y centramos aquí mismo
  if (hayCoincidenciaLocal) {
    filtrarProductos();
    return;
  }

  // CASO 2: No está en esta página (o esta página no tiene catálogo, como index/categorias/contacto)
  // -> Buscamos la tarjeta real en los catálogos y la mostramos en el overlay de pantalla completa
  busquedaEnCurso = true;
  try {
    const htmlTarjeta = await buscarTarjetaEnCatalogos(filtro);
    mostrarResultadoBusquedaGlobal(htmlTarjeta, textoBusqueda);
  } finally {
    busquedaEnCurso = false;
  }
}