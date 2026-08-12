// ===================================
// BUSCADOR DE PRODUCTOS
// ===================================

// Nombres de los archivos de catálogo (donde viven las tarjetas .producto-card reales).
// Ajusta esta lista si agregas o renombras alguna página de categoría.
const NOMBRES_CATALOGOS = ["viento.html", "teclado.html", "electronicos.html"];

// Detectamos automáticamente si la página actual vive DENTRO de la carpeta /html/
// o FUERA de ella (como index.html), para poder construir las rutas correctas
// sin importar desde dónde se busque.
const DENTRO_DE_HTML = window.location.pathname.includes("/html/");
const PREFIJO_CATALOGOS = DENTRO_DE_HTML ? "" : "html/";
const CATALOGOS_DISPONIBLES = NOMBRES_CATALOGOS.map((archivo) => PREFIJO_CATALOGOS + archivo);

document.addEventListener("DOMContentLoaded", () => {
  const inputBusqueda = document.getElementById("searchInput");
  const hayCatalogoAqui = !!document.querySelector(".producto-card");

  // Búsqueda en tiempo real mientras el usuario escribe (solo en páginas con catálogo de tarjetas)
  if (inputBusqueda && hayCatalogoAqui) {
    inputBusqueda.addEventListener("input", filtrarProductos);
  }

  // Páginas sin catálogo (index, categorías, contacto): al borrar la búsqueda, cerramos el overlay
  if (inputBusqueda && !hayCatalogoAqui) {
    inputBusqueda.addEventListener("input", () => {
      if (inputBusqueda.value.trim() === "") {
        ocultarResultadoGlobal();
      }
    });
  }

  // NOTA: el Enter (keydown) y el clic en la lupa ya están conectados desde los atributos
  // onkeydown / onclick en el HTML. No los volvemos a conectar aquí para evitar que la
  // búsqueda se dispare dos veces en paralelo.
});

// Normaliza texto: minúsculas, sin tildes, sin espacios extra
function normalizarTexto(texto) {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // elimina acentos
    .trim();
}

// ===================================
// BÚSQUEDA LOCAL (páginas de catálogo: viento, teclado, electronicos)
// ===================================

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

// Centra las tarjetas visibles como grupo (sin importar la cantidad).
// Usamos clases CSS en vez de estilos inline para que el CSS pueda
// adaptarlas correctamente en móvil vía media queries.
function actualizarModoDestacado(coincidencias, filtro) {
  const catalogoContainer = document.querySelector(".catalogo-container");
  if (!catalogoContainer) return;

  const hayBusquedaConResultados = filtro !== "" && coincidencias > 0;
  catalogoContainer.classList.toggle("modo-destacado", hayBusquedaConResultados);

  if (hayBusquedaConResultados && coincidencias === 1) {
    const tarjetaVisible = [...document.querySelectorAll(".producto-card")]
      .find((t) => t.style.display !== "none");
    if (tarjetaVisible) {
      tarjetaVisible.classList.add("producto-destacado");
      tarjetaVisible.scrollIntoView({ behavior: "smooth", block: "center" });
    }
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
    mensaje.style.display = "block";
  } else if (mensaje) {
    mensaje.style.display = "none";
  }
}

// ===================================
// BÚSQUEDA GLOBAL (páginas sin catálogo: index, categorías, contacto)
// Busca la tarjeta real en los catálogos y la muestra en un overlay, sin redirigir.
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

// Las tarjetas de catálogo usan rutas relativas a la carpeta /html/ (ej: "../assets/foto.png",
// "clarinete-descripcion.html"). Si insertamos esa tarjeta en una página FUERA de /html/
// (como index.html), esas rutas quedarían rotas. Esta función las corrige según dónde estemos.
function ajustarRutasTarjeta(htmlTarjeta) {
  if (DENTRO_DE_HTML) return htmlTarjeta; // ya estamos en /html/, las rutas relativas ya son correctas

  const temporal = document.createElement("div");
  temporal.innerHTML = htmlTarjeta;

  // Imagen: "../assets/foto.png" -> "assets/foto.png" (ya no hace falta subir de nivel)
  temporal.querySelectorAll("img").forEach((img) => {
    const src = img.getAttribute("src") || "";
    if (src.startsWith("../")) {
      img.setAttribute("src", src.replace("../", ""));
    }
  });

  // Enlace "Ver info": "clarinete-descripcion.html" -> "html/clarinete-descripcion.html"
  temporal.querySelectorAll("a").forEach((enlace) => {
    const href = enlace.getAttribute("href") || "";
    const esRutaAbsoluta = href.startsWith("http") || href.startsWith("/");
    const yaTienePrefijo = href.startsWith("html/");
    if (!esRutaAbsoluta && !yaTienePrefijo) {
      enlace.setAttribute("href", "html/" + href);
    }
  });

  return temporal.innerHTML;
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

  document.body.appendChild(contenedor);

  contenedor.querySelector("#btnCerrarResultado").addEventListener("click", () => {
    const input = document.getElementById("searchInput");
    if (input) input.value = "";
    ocultarResultadoGlobal();
  });

  // Cerrar también si se hace clic fuera de la tarjeta (en el fondo oscuro)
  contenedor.addEventListener("click", (evento) => {
    if (evento.target === contenedor) {
      const input = document.getElementById("searchInput");
      if (input) input.value = "";
      ocultarResultadoGlobal();
    }
  });

  return contenedor;
}

// Muestra la tarjeta encontrada (o un mensaje de "sin resultados") en el overlay
function mostrarResultadoBusquedaGlobal(htmlTarjeta, textoBusqueda) {
  const contenedor = obtenerContenedorResultadoGlobal();
  const tarjetaWrapper = contenedor.querySelector("#resultadoBusquedaCard");

  // Limpiamos cualquier resultado anterior antes de pintar el nuevo,
  // para evitar contenido residual de una búsqueda previa.
  tarjetaWrapper.innerHTML = "";

  if (htmlTarjeta) {
    tarjetaWrapper.innerHTML = ajustarRutasTarjeta(htmlTarjeta);
    const tarjeta = tarjetaWrapper.querySelector(".producto-card");
    if (tarjeta) {
      tarjeta.classList.add("producto-destacado");
    }
  } else {
    tarjetaWrapper.innerHTML = `
      <p class="resultado-busqueda-vacio">
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

// Identificador de la búsqueda global más reciente. En vez de un simple
// candado booleano (que ignoraba por completo cualquier búsqueda mientras
// otra seguía en curso), usamos un contador: cada búsqueda nueva se marca
// con su propio número, y si la respuesta del fetch llega cuando ya no es
// la búsqueda más reciente, simplemente se descarta en vez de bloquear
// nuevas búsquedas. Esto es lo que arregla el bug de "la segunda vez no
// funciona".
let idBusquedaActual = 0;

// Función para manejar la búsqueda (desde Enter o clic en la lupa)
async function manejarBusquedaGlobal(event) {
  const esEnter = event.type === "keydown" && event.key === "Enter";
  const esClic = event.type === "click";

  if (!esEnter && !esClic) return;

  const input = document.getElementById("searchInput");
  if (!input || input.value.trim() === "") return;

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
  // -> Buscamos la tarjeta real en los catálogos y la mostramos en el overlay, sin navegar
  const miId = ++idBusquedaActual; // marcamos esta búsqueda como "la más reciente"

  const htmlTarjeta = await buscarTarjetaEnCatalogos(filtro);

  // Si mientras esperábamos el fetch el usuario lanzó otra búsqueda más
  // nueva, esta respuesta ya quedó obsoleta: no la mostramos.
  if (miId !== idBusquedaActual) return;

  mostrarResultadoBusquedaGlobal(htmlTarjeta, textoBusqueda);
}