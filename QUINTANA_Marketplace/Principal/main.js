
/* =========================================================
   RANTIY Y RANTIKUY
   PRINCIPAL/MAIN.JS -> Catálogo conectado a Firebase
========================================================= */


/* =========================================================
   1. firebase 
========================================================= */
import { db } from '../firebase/firebase.js';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  startAfter, 
  getDocs 
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
/* =========================================================
   2. CONFIGURACIÓN
========================================================= */

const COLECCION = "productos";
const PRODUCTOS_POR_PAGINA = 12;
const PRECIO_MAXIMO_SLIDER = 1000;
const MINUTOS_CACHE = 5;
const ESPERA_BUSQUEDA_MS = 500;
const ESPERA_PRECIO_MS = 400;

// LO DEJAMOS TRUE COMO PEDISTE
const MODO_DEMO = true;


/* =========================================================
   3. CONFIGURACIÓN DE IMAGEN
========================================================= */

// Imagen de reemplazo si la URL no existe o no es segura.
const IMAGEN_VACIA =
    "data:image/svg+xml;utf8," +
    encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400">' +
        '<rect width="100%" height="100%" fill="#e5e7eb"/>' +
        '<text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#6b7280" font-size="24">Imagen no disponible</text>' +
        "</svg>"
    );


/* =========================================================
   4. FORMATO DE MONEDA
========================================================= */

// Marketplace para Perú -> Sol peruano.
const FORMATEADOR_MONEDA = new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
});

function formatearPrecio(valor) {
    const numero = Number(valor);

    if (!Number.isFinite(numero)) {
        return FORMATEADOR_MONEDA.format(0);
    }

    return FORMATEADOR_MONEDA.format(numero);
}


/* =========================================================
   5. ELEMENTOS DEL DOM
========================================================= */

const botonLogin = document.querySelector(".btn-login");
const modalLogin = document.querySelector("#modal-login");
const botonCerrarModal = document.querySelector("#btn-cerrar-modal");
const formularioLogin = document.querySelector("#form-login");

const contenedorProductos =
    document.querySelector("#contenedor-productos");

const inputBusqueda =
    document.querySelector("#input-busqueda");

const botonBuscar =
    document.querySelector("#btn-buscar");

const contadorProductos =
    document.querySelector("#contador-productos");

const sinResultados =
    document.querySelector("#sin-resultados");

const filtroPrecio =
    document.querySelector("#filtro-precio");

const valorPrecio =
    document.querySelector("#valor-precio");

const botonLimpiarFiltros =
    document.querySelector("#btn-limpiar-filtros");

const botonBanner =
    document.querySelector(".btn-banner");

const filtrosCategoria =
    document.querySelectorAll('input[name="categoria"]');

const enlacesCategoria =
    document.querySelectorAll(".barra-categorias a");


/* =========================================================
   6. BOTÓN "VER MÁS"
========================================================= */

const botonVerMas = document.createElement("button");

botonVerMas.type = "button";
botonVerMas.className = "btn-ver-mas";
botonVerMas.textContent = "Ver más productos";
botonVerMas.hidden = true;

contenedorProductos.after(botonVerMas);


/* =========================================================
   7. ESTADO DE LA APLICACIÓN
========================================================= */

let terminoBusqueda = "";
let precioMaximo = PRECIO_MAXIMO_SLIDER;

let ultimoDocumento = null;
let productosMostrados = 0;

// Sirve para ignorar respuestas antiguas.
let numeroPeticion = 0;

// Cache temporal del navegador.
const cache = new Map();


/* =========================================================
   8. FUNCIONES DE AYUDA
========================================================= */


/* ---------------------------------------------------------
   Normalizar texto

   "Audífonos" -> "audifonos"
   " ZAPATILLAS " -> "zapatillas"
--------------------------------------------------------- */

function normalizarTexto(texto) {
    return String(texto || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim();
}


/* ---------------------------------------------------------
   Espera corta / debounce

   Evita hacer una consulta por cada letra o movimiento
   del slider.
--------------------------------------------------------- */

function crearEsperaCorta(funcion, milisegundos) {
    let temporizador;

    return (...argumentos) => {
        clearTimeout(temporizador);

        temporizador = setTimeout(() => {
            funcion(...argumentos);
        }, milisegundos);
    };
}


/* ---------------------------------------------------------
   Comprobar URL de imagen
--------------------------------------------------------- */

function esUrlSegura(url) {
    try {
        return new URL(url).protocol === "https:";
    } catch {
        return false;
    }
}


/* ---------------------------------------------------------
   Obtener categorías seleccionadas
--------------------------------------------------------- */

function obtenerCategoriasSeleccionadas() {
    return Array.from(filtrosCategoria)
        .filter((filtro) => filtro.checked)
        .map((filtro) => filtro.value);
}


/* ---------------------------------------------------------
   Buscar solo cuando hay 2 o más caracteres
--------------------------------------------------------- */

function hayBusquedaActiva() {
    return normalizarTexto(terminoBusqueda).length >= 2;
}


/* ---------------------------------------------------------
   Comprobar filtro de precio
--------------------------------------------------------- */

function hayFiltroPrecio() {
    return precioMaximo < PRECIO_MAXIMO_SLIDER;
}


/* ---------------------------------------------------------
   Comprobar si existe algún filtro
--------------------------------------------------------- */

function hayFiltrosActivos() {
    return (
        hayBusquedaActiva() ||
        hayFiltroPrecio() ||
        obtenerCategoriasSeleccionadas().length > 0
    );
}


/* ---------------------------------------------------------
   Filtros locales para MODO_DEMO

   Firebase hará los filtros reales cuando esté conectado.
--------------------------------------------------------- */

function pasaFiltrosLocales(producto) {
    const categorias = obtenerCategoriasSeleccionadas();

    const precio = Number(producto.precio);

    const cumplePrecio =
        !hayFiltroPrecio() ||
        (Number.isFinite(precio) && precio <= precioMaximo);

    const cumpleCategoria =
        categorias.length === 0 ||
        categorias.includes(producto.categoria);

    return cumplePrecio && cumpleCategoria;
}


/* ---------------------------------------------------------
   Búsqueda local para MODO_DEMO

   Se mantiene igual que la búsqueda real:
   busca por nombre.
--------------------------------------------------------- */

function pasaBusquedaLocal(producto) {
    if (!hayBusquedaActiva()) {
        return true;
    }

    const texto = normalizarTexto(terminoBusqueda);
    const nombre = normalizarTexto(producto.nombre);

    return nombre.includes(texto);
}


/* ---------------------------------------------------------
   Clave única para el cache
--------------------------------------------------------- */

function crearClaveCache() {
    return JSON.stringify({
        busqueda: normalizarTexto(terminoBusqueda),
        categorias: [...obtenerCategoriasSeleccionadas()].sort(),
        precio: precioMaximo
    });
}


/* =========================================================
   9. LOGIN
   Todavía NO usa Firebase Auth.
========================================================= */

if (botonLogin && modalLogin) {
    botonLogin.addEventListener("click", (evento) => {
        evento.preventDefault();
        modalLogin.showModal();
    });
}


if (botonCerrarModal && modalLogin) {
    botonCerrarModal.addEventListener("click", () => {
        modalLogin.close();
    });
}


if (formularioLogin) {
    formularioLogin.addEventListener("submit", (evento) => {
        evento.preventDefault();

        const correo =
            document.querySelector("#correo-login").value.trim();

        const password =
            document.querySelector("#password-login").value.trim();

        if (correo === "" || password === "") {
            alert("Completa todos los campos.");
            return;
        }

        /*
          IMPORTANTE:
          Esto todavía NO autentica al usuario.
          Firebase Authentication se conectará después.
        */

        alert(
            `Formulario recibido para ${correo}. ` +
            "La autenticación real se conectará con Firebase."
        );

        formularioLogin.reset();
        modalLogin.close();
    });
}


/* =========================================================
   10. CONSTRUIR CONSULTA A FIRESTORE
========================================================= */

function construirConsulta() {
    const condiciones = [];

    /*
      ------------------------------------------------------
      BÚSQUEDA
      ------------------------------------------------------

      Firestore buscará desde:

      nombreBusqueda >= texto

      hasta:

      nombreBusqueda <= texto + carácter final

      IMPORTANTE:
      Tu documento de Firebase deberá tener un campo:

      nombreBusqueda

      con el nombre ya normalizado.
    */

    if (hayBusquedaActiva()) {
        const texto = normalizarTexto(terminoBusqueda);

        condiciones.push(
            where("nombreBusqueda", ">=", texto),
            where(
                "nombreBusqueda",
                "<=",
                texto + "\uf8ff"
            ),

            orderBy("nombreBusqueda")
        );
    }


    /*
      ------------------------------------------------------
      CATEGORÍAS
      ------------------------------------------------------
    */

    const categorias = obtenerCategoriasSeleccionadas();

    if (categorias.length > 0) {
        condiciones.push(
            where("categoria", "in", categorias)
        );
    }


    /*
      ------------------------------------------------------
      PRECIO
      ------------------------------------------------------
    */

    if (hayFiltroPrecio()) {
        condiciones.push(
            where("precio", "<=", precioMaximo)
        );

        /*
          Solo ponemos orderBy precio cuando NO estamos
          buscando por nombre.

          Si hay búsqueda, el orden principal será
          nombreBusqueda.
        */
        if (!hayBusquedaActiva()) {
            condiciones.push(orderBy("precio"));
        }
    }


    /*
      ------------------------------------------------------
      PAGINACIÓN
      ------------------------------------------------------
    */

    if (ultimoDocumento) {
        condiciones.push(
            startAfter(ultimoDocumento)
        );
    }


    /*
      ------------------------------------------------------
      LÍMITE
      ------------------------------------------------------
    */

    condiciones.push(
        limit(PRODUCTOS_POR_PAGINA)
    );


    return query(
        collection(db, COLECCION),
        ...condiciones
    );
}


/* =========================================================
   11. PEDIR UNA PÁGINA DE PRODUCTOS
========================================================= */

async function pedirPagina() {
    const consulta = construirConsulta();

    const captura = await getDocs(consulta);

    const productos = captura.docs.map((documento) => ({
        id: documento.id,
        ...documento.data()
    }));

    const ultimo =
        captura.docs[captura.docs.length - 1] || null;

    const hayMas =
        captura.docs.length === PRODUCTOS_POR_PAGINA;

    /*
      IMPORTANTE:

      Ahora los filtros de Firebase se hacen en Firebase.
      Ya no descargamos 12 productos para luego eliminar
      productos en el navegador.

      Eso evita la inconsistencia anterior con la paginación.
    */

    return {
        productos,
        ultimo,
        hayMas
    };
}


/* =========================================================
   12. CREAR TARJETA DE PRODUCTO
========================================================= */

function crearTarjetaProducto(producto) {
    const tarjeta =
        document.createElement("article");

    tarjeta.className = "tarjeta-producto";


    /* ------------------------------------------------------
       IMAGEN
    ------------------------------------------------------ */

    const img =
        document.createElement("img");

    img.className = "imagen-producto";

    img.src = esUrlSegura(producto.imagen)
        ? producto.imagen
        : IMAGEN_VACIA;

    img.alt =
        producto.nombre || "Producto";

    img.loading = "lazy";
    img.decoding = "async";


    /*
      Si la URL es HTTPS pero la imagen igualmente falla,
      mostramos la imagen de reemplazo.
    */

    img.addEventListener(
        "error",
        () => {
            if (img.src !== IMAGEN_VACIA) {
                img.src = IMAGEN_VACIA;
            }
        },
        { once: true }
    );


    tarjeta.appendChild(img);


    /* ------------------------------------------------------
       ETIQUETA OFERTA
    ------------------------------------------------------ */

    if (producto.oferta) {
        const etiqueta =
            document.createElement("span");

        etiqueta.className =
            "etiqueta-oferta";

        etiqueta.textContent =
            String(producto.oferta);

        tarjeta.appendChild(etiqueta);
    }


    /* ------------------------------------------------------
       INFORMACIÓN
    ------------------------------------------------------ */

    const info =
        document.createElement("div");

    info.className =
        "info-producto";


    /* ------------------------------------------------------
       NOMBRE
    ------------------------------------------------------ */

    const nombre =
        document.createElement("h4");

    nombre.textContent =
        producto.nombre || "Sin nombre";

    info.appendChild(nombre);


    /* ------------------------------------------------------
       VENDEDOR
    ------------------------------------------------------ */

    const vendedor =
        document.createElement("p");

    vendedor.className =
        "vendedor";

    vendedor.textContent =
        `Por: ${producto.vendedor || "Vendedor"}`;

    info.appendChild(vendedor);


    /* ------------------------------------------------------
       PRECIO
    ------------------------------------------------------ */

    const precio =
        document.createElement("p");

    precio.className =
        "precio";

    precio.textContent =
        formatearPrecio(producto.precio);


    /* ------------------------------------------------------
       PRECIO ANTERIOR
    ------------------------------------------------------ */

    const precioViejoNumero =
        Number(producto.precioViejo);

    if (
        Number.isFinite(precioViejoNumero) &&
        precioViejoNumero > 0
    ) {
        const precioViejo =
            document.createElement("span");

        precioViejo.className =
            "precio-viejo";

        precioViejo.textContent =
            ` ${formatearPrecio(precioViejoNumero)}`;

        precio.appendChild(precioViejo);
    }


    info.appendChild(precio);


    /* ------------------------------------------------------
       BOTÓN WHATSAPP
    ------------------------------------------------------ */

    const boton =
        document.createElement("button");

    boton.className =
        "btn-agregar";

    boton.type = "button";

    boton.textContent =
        "Comprar por WhatsApp";


    /*
      Guardamos los datos en data-*.

      Luego el listener general los obtiene.
    */

    boton.dataset.telefono =
        String(producto.telefono || "");

    boton.dataset.nombre =
        String(producto.nombre || "Producto");

    boton.dataset.precio =
        String(producto.precio ?? 0);


    info.appendChild(boton);


    tarjeta.appendChild(info);


    return tarjeta;
}


/* =========================================================
   13. MOSTRAR PRODUCTOS
========================================================= */

function mostrarProductos(
    productos,
    reiniciar,
    hayMas
) {
    if (reiniciar) {
        contenedorProductos.replaceChildren();
        productosMostrados = 0;
    }


    /*
      DocumentFragment:
      construimos las tarjetas fuera del DOM y luego
      insertamos todo junto.
    */

    const fragmento =
        document.createDocumentFragment();


    productos.forEach((producto) => {
        fragmento.appendChild(
            crearTarjetaProducto(producto)
        );
    });


    contenedorProductos.appendChild(
        fragmento
    );


    productosMostrados += productos.length;


    /*
      Mostrar / ocultar mensaje de "sin resultados"
    */

    sinResultados.hidden =
        productosMostrados > 0 ||
        hayMas;


    if (productosMostrados > 0) {
        contadorProductos.textContent =
            `${productosMostrados} producto(s) mostrado(s)`;
    } else {
        contadorProductos.textContent =
            "No hay productos disponibles";
    }


    botonVerMas.hidden =
        !hayMas;

    botonVerMas.disabled = false;
}


/* =========================================================
   14. MOSTRAR ERROR
========================================================= */

function mostrarError(mensaje) {
    contenedorProductos.replaceChildren();

    productosMostrados = 0;

    sinResultados.hidden = true;

    botonVerMas.hidden = true;

    botonVerMas.disabled = false;

    contadorProductos.textContent =
        mensaje;
}


/* =========================================================
   15. MODO DEMO
========================================================= */

async function mostrarDemo(peticionActual) {
    try {
        const { baseDeDatos } =
            await import("./productos.js");


        /*
          Si el usuario cambió de búsqueda/filtro mientras
          cargábamos la demo, ignoramos esta respuesta.
        */

        if (peticionActual !== numeroPeticion) {
            return;
        }


        const lista =
            baseDeDatos.filter(
                (producto) =>
                    pasaFiltrosLocales(producto) &&
                    pasaBusquedaLocal(producto)
            );


        mostrarProductos(
            lista,
            true,
            false
        );

    } catch (error) {
        console.error(
            "No se pudo cargar productos.js:",
            error
        );

        mostrarError(
            "No se pudieron cargar los productos."
        );
    }
}


/* =========================================================
   16. CARGAR PRODUCTOS
========================================================= */

async function cargarProductos(
    reiniciar = true
) {
    /*
      Cada petición recibe un número.

      Si una respuesta vieja llega después de una nueva,
      la ignoramos.
    */

    const peticion =
        ++numeroPeticion;


    const clave =
        crearClaveCache();


    /* ------------------------------------------------------
       REINICIAR
    ------------------------------------------------------ */

    if (reiniciar) {
        ultimoDocumento = null;


        /*
          Revisar cache
        */

        const guardado =
            cache.get(clave);


        if (
            guardado &&
            Date.now() - guardado.hora
                < MINUTOS_CACHE * 60 * 1000
        ) {
            ultimoDocumento =
                guardado.ultimo;

            mostrarProductos(
                guardado.productos,
                true,
                guardado.hayMas
            );

            return;
        }


        contadorProductos.textContent =
            "Cargando productos...";
    }


    botonVerMas.disabled = true;


    try {
        const pagina =
            await pedirPagina();


        /*
          Ignorar respuesta vieja
        */

        if (peticion !== numeroPeticion) {
            return;
        }


        ultimoDocumento =
            pagina.ultimo;


        /*
          --------------------------------------------------
          DEMO

          Si Firebase no tiene productos, usamos demo.

          IMPORTANTE:
          NO guardamos el resultado vacío de Firebase
          en cache antes de mostrar la demo.

          Eso corrige un problema que tenía la versión
          anterior.
        --------------------------------------------------
        */

        if (
            reiniciar &&
            pagina.productos.length === 0 &&
            MODO_DEMO
        ) {
            await mostrarDemo(peticion);
            return;
        }


        /*
          Guardamos solamente resultados reales de Firebase.
        */

        if (reiniciar) {
            cache.set(
                clave,
                {
                    ...pagina,
                    hora: Date.now()
                }
            );
        }


        mostrarProductos(
            pagina.productos,
            reiniciar,
            pagina.hayMas
        );


    } catch (error) {
        console.error(
            "Error al leer productos:",
            error
        );


        if (peticion !== numeroPeticion) {
            return;
        }


        /*
          Firestore suele informar cuando hace falta
          crear un índice.
        */

        if (
            error?.code ===
            "failed-precondition"
        ) {
            mostrarError(
                "Este filtro necesita un índice en Firebase. " +
                "Abre la consola y utiliza el enlace que proporciona Firebase."
            );

            return;
        }


        /*
          Si Firebase falla y el modo demo está activo,
          usamos productos.js.
        */

        if (
            MODO_DEMO &&
            reiniciar
        ) {
            await mostrarDemo(peticion);
            return;
        }


        mostrarError(
            "No se pudieron cargar los productos. Intenta de nuevo."
        );
    }
}


/* =========================================================
   17. NORMALIZAR TELÉFONO PARA WHATSAPP
========================================================= */

function normalizarTelefonoWhatsApp(numero) {
    const digitos =
        String(numero || "")
            .replace(/\D/g, "");


    if (!digitos) {
        return "";
    }


    /*
      Número peruano de celular:

      987654321
      ↓
      51987654321
    */

    if (digitos.length === 9) {
        return `51${digitos}`;
    }


    /*
      Ya viene con código de Perú:

      51987654321
    */

    if (
        digitos.startsWith("51") &&
        digitos.length === 11
    ) {
        return digitos;
    }


    /*
      Permitimos números internacionales que ya
      vengan correctamente escritos.
    */

    if (
        digitos.length >= 8 &&
        digitos.length <= 15
    ) {
        return digitos;
    }


    return "";
}


/* =========================================================
   18. WHATSAPP
   Un solo listener para todos los productos
========================================================= */

contenedorProductos.addEventListener(
    "click",
    (evento) => {
        const boton =
            evento.target.closest(".btn-agregar");


        if (!boton) {
            return;
        }


        const telefono =
            normalizarTelefonoWhatsApp(
                boton.dataset.telefono
            );


        const nombre =
            boton.dataset.nombre ||
            "Producto";


        const precioNumero =
            Number(boton.dataset.precio);


        if (!telefono) {
            alert(
                "El vendedor no ha registrado un número de WhatsApp válido."
            );

            return;
        }


        const precioTexto =
            formatearPrecio(precioNumero);


        const mensaje =
            `Hola, vengo de Rantiy y Rantikuy. ` +
            `Estoy interesado en el producto "${nombre}" ` +
            `que cuesta ${precioTexto}. ` +
            `¿Aún está disponible?`;


        const url =
            `https://wa.me/${telefono}?text=${encodeURIComponent(
                mensaje
            )}`;


        window.open(
            url,
            "_blank",
            "noopener,noreferrer"
        );
    }
);


/* =========================================================
   19. BUSCADOR
========================================================= */

function ejecutarBusqueda() {
    if (!inputBusqueda) {
        return;
    }


    terminoBusqueda =
        inputBusqueda.value.trim();


    cargarProductos(true);
}


const busquedaConEspera =
    crearEsperaCorta(
        ejecutarBusqueda,
        ESPERA_BUSQUEDA_MS
    );


if (botonBuscar) {
    botonBuscar.addEventListener(
        "click",
        ejecutarBusqueda
    );
}


if (inputBusqueda) {

    inputBusqueda.addEventListener(
        "input",
        () => {
            const largo =
                inputBusqueda.value.trim().length;


            /*
              Buscamos cuando:

              - queda vacío
              - tiene 2 o más caracteres
            */

            if (
                largo === 0 ||
                largo >= 2
            ) {
                busquedaConEspera();
            }
        }
    );


    inputBusqueda.addEventListener(
        "keydown",
        (evento) => {
            if (
                evento.key === "Enter"
            ) {
                ejecutarBusqueda();
            }
        }
    );
}


/* =========================================================
   20. FILTRO DE PRECIO
========================================================= */

const filtrarPrecioConEspera =
    crearEsperaCorta(
        () => cargarProductos(true),
        ESPERA_PRECIO_MS
    );


if (filtroPrecio) {
    filtroPrecio.addEventListener(
        "input",
        () => {

            precioMaximo =
                Number(filtroPrecio.value);


            if (valorPrecio) {
                valorPrecio.textContent =
                    precioMaximo;
            }


            filtrarPrecioConEspera();
        }
    );
}


/* =========================================================
   21. FILTROS DE CATEGORÍA
========================================================= */

filtrosCategoria.forEach(
    (filtro) => {
        filtro.addEventListener(
            "change",
            () => {
                cargarProductos(true);
            }
        );
    }
);


/* =========================================================
   22. REINICIAR FILTROS
========================================================= */

function reiniciarFiltros() {

    filtrosCategoria.forEach(
        (filtro) => {
            filtro.checked = false;
        }
    );


    precioMaximo =
        PRECIO_MAXIMO_SLIDER;


    if (filtroPrecio) {
        filtroPrecio.value =
            PRECIO_MAXIMO_SLIDER;
    }


    if (valorPrecio) {
        valorPrecio.textContent =
            PRECIO_MAXIMO_SLIDER;
    }


    terminoBusqueda = "";


    if (inputBusqueda) {
        inputBusqueda.value = "";
    }


    cargarProductos(true);
}


if (botonLimpiarFiltros) {
    botonLimpiarFiltros.addEventListener(
        "click",
        reiniciarFiltros
    );
}


/* =========================================================
   23. ENLACE "TODO"
========================================================= */

enlacesCategoria.forEach(
    (enlace) => {

        enlace.addEventListener(
            "click",
            (evento) => {

                if (
                    enlace.dataset.categoria ===
                    "todo"
                ) {
                    evento.preventDefault();

                    reiniciarFiltros();
                }
            }
        );

    }
);


/* =========================================================
   24. BOTÓN "VER MÁS"
========================================================= */

botonVerMas.addEventListener(
    "click",
    () => {
        cargarProductos(false);
    }
);


/* =========================================================
   25. BOTÓN DEL BANNER
========================================================= */

if (botonBanner) {
    botonBanner.addEventListener(
        "click",
        () => {

            const catalogo =
                document.querySelector(
                    ".catalogo-productos"
                );


            if (catalogo) {
                catalogo.scrollIntoView({
                    behavior: "smooth"
                });
            }
        }
    );
}


/* =========================================================
   26. INICIAR APLICACIÓN
========================================================= */

cargarProductos();

console.log(
    "🛍️ Rantiy y Rantikuy - Catálogo iniciado correctamente."
);