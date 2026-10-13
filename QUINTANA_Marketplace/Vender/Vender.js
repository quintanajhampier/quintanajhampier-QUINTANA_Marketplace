"use strict";

/*
 * ============================================================
 * RANTIY Y RANTIKUY
 * Módulo: Publicar producto
 *
 * Este archivo está diseñado para trabajar de forma independiente.
 *
 * IMPORTANTE:
 * La conexión definitiva con Firebase se integrará aquí sin
 * modificar la navegación ni los IDs existentes.
 * ============================================================
 */


/* ============================================================
   CONFIGURACIÓN
============================================================ */

const CONFIG_VENDER = Object.freeze({

    MAX_IMAGENES: 6,

    MAX_TAMANO_IMAGEN_MB: 5,

    MAX_NOMBRE: 80,

    MAX_DESCRIPCION: 1000,

    PRECIO_MINIMO: 0.01,

    PRECIO_MAXIMO: 9999999

});


/* ============================================================
   ESTADO DE LA PÁGINA
============================================================ */

const estadoVender = {

    imagenes: [],

    enviando: false,

    urlsPreview: [],

    dragActivo: false

};


/* ============================================================
   ELEMENTOS
============================================================ */

const form = document.getElementById("form-vender");

const inputNombre = document.getElementById("nombre");

const inputPrecio = document.getElementById("precio");

const inputCategoria = document.getElementById("categoria");

const inputCondicion = document.getElementById("condicion");

const inputDescripcion = document.getElementById("descripcion");

const inputDepartamento =
    document.getElementById("departamento");

const inputDistrito =
    document.getElementById("distrito");

const inputTelefono =
    document.getElementById("telefono");

const inputImagenes =
    document.getElementById("imagenes");

const zonaImagenes =
    document.getElementById("zona-imagenes");

const btnSeleccionar =
    document.getElementById("btn-seleccionar");

const galeriaPreview =
    document.getElementById("galeria-preview");

const btnPublicar =
    document.getElementById("btn-publicar");

const mensajeGeneral =
    document.getElementById("mensaje-general");


/* ============================================================
   VISTA PREVIA
============================================================ */

const previewNombre =
    document.getElementById("preview-nombre");

const previewPrecio =
    document.getElementById("preview-precio");

const previewDescripcion =
    document.getElementById("preview-descripcion");

const previewCategoria =
    document.getElementById("preview-categoria");

const previewUbicacion =
    document.getElementById("preview-ubicacion");

const productoImagen =
    document.getElementById("producto-imagen");


/* ============================================================
   CONTADORES
============================================================ */

const contadorNombre =
    document.getElementById("contador-nombre");

const contadorDescripcion =
    document.getElementById("contador-descripcion");


/* ============================================================
   INICIO
============================================================ */

document.addEventListener("DOMContentLoaded", iniciarVender);


/**
 * Inicializa todos los eventos del módulo una sola vez.
 */
function iniciarVender() {

    if (!form) {
        console.error(
            "Vender.js: No se encontró #form-vender."
        );

        return;
    }


    configurarEventos();

    actualizarPreview();

}


/* ============================================================
   EVENTOS
============================================================ */

function configurarEventos() {

    form.addEventListener(
        "submit",
        manejarEnvioFormulario
    );


    inputImagenes.addEventListener(
        "change",
        manejarSeleccionImagenes
    );


    btnSeleccionar.addEventListener(
        "click",
        manejarBotonSeleccionar
    );


    inputNombre.addEventListener(
        "input",
        manejarCambioFormulario
    );


    inputPrecio.addEventListener(
        "input",
        manejarCambioFormulario
    );


    inputCategoria.addEventListener(
        "change",
        manejarCambioFormulario
    );


    inputCondicion.addEventListener(
        "change",
        manejarCambioFormulario
    );


    inputDescripcion.addEventListener(
        "input",
        manejarCambioFormulario
    );


    inputDepartamento.addEventListener(
        "input",
        manejarCambioFormulario
    );


    inputDistrito.addEventListener(
        "input",
        manejarCambioFormulario
    );


    inputTelefono.addEventListener(
        "input",
        manejarCambioFormulario
    );


    zonaImagenes.addEventListener(
        "dragover",
        manejarDragOver
    );


    zonaImagenes.addEventListener(
        "dragleave",
        manejarDragLeave
    );


    zonaImagenes.addEventListener(
        "drop",
        manejarDrop
    );

}


/* ============================================================
   BOTÓN DE IMÁGENES
============================================================ */

function manejarBotonSeleccionar(event) {

    /*
     * Evitamos que el click del botón provoque comportamientos
     * inesperados dentro de la etiqueta de la zona de imágenes.
     */

    event.preventDefault();

    inputImagenes.click();

}


/* ============================================================
   IMÁGENES
============================================================ */

function manejarSeleccionImagenes(event) {

    const archivos = Array.from(
        event.target.files || []
    );

    procesarImagenes(archivos);

}


function procesarImagenes(archivos) {

    limpiarError("imagenes");

    if (archivos.length === 0) {
        return;
    }


    /*
     * No permitimos superar el límite establecido.
     */

    const disponibles =
        CONFIG_VENDER.MAX_IMAGENES -
        estadoVender.imagenes.length;


    if (disponibles <= 0) {

        mostrarError(
            "imagenes",
            `Solo puedes agregar ${CONFIG_VENDER.MAX_IMAGENES} imágenes.`
        );

        return;
    }


    const archivosProcesar =
        archivos.slice(0, disponibles);


    const archivosValidos = [];


    for (const archivo of archivosProcesar) {

        const resultado =
            validarImagen(archivo);


        if (!resultado.valida) {

            mostrarError(
                "imagenes",
                resultado.mensaje
            );

            continue;
        }


        archivosValidos.push(archivo);

    }


    /*
     * Agregamos solamente archivos válidos.
     */

    if (archivosValidos.length > 0) {

        estadoVender.imagenes.push(
            ...archivosValidos
        );

    }


    renderizarGaleria();

    actualizarPreviewImagen();

    /*
     * Limpiamos el input para que el usuario pueda seleccionar
     * nuevamente el mismo archivo si fuera necesario.
     */

    inputImagenes.value = "";

}


function validarImagen(archivo) {

    const tiposPermitidos = [
        "image/jpeg",
        "image/png",
        "image/webp"
    ];


    if (!tiposPermitidos.includes(archivo.type)) {

        return {
            valida: false,
            mensaje:
                "Solo se permiten imágenes JPG, PNG o WEBP."
        };

    }


    const tamanoMaximo =
        CONFIG_VENDER.MAX_TAMANO_IMAGEN_MB *
        1024 *
        1024;


    if (archivo.size > tamanoMaximo) {

        return {
            valida: false,
            mensaje:
                `Cada imagen debe pesar máximo ` +
                `${CONFIG_VENDER.MAX_TAMANO_IMAGEN_MB} MB.`
        };

    }


    return {
        valida: true,
        mensaje: ""
    };

}


/* ============================================================
   GALERÍA
============================================================ */

function renderizarGaleria() {

    liberarUrlsPreview();


    galeriaPreview.innerHTML = "";


    estadoVender.imagenes.forEach(
        (archivo, indice) => {

            const url =
                URL.createObjectURL(archivo);


            estadoVender.urlsPreview.push(url);


            const contenedor =
                document.createElement("div");

            contenedor.className =
                "imagen-preview";


            const imagen =
                document.createElement("img");

            imagen.src = url;

            imagen.alt =
                `Imagen del producto ${indice + 1}`;


            contenedor.appendChild(imagen);


            if (indice === 0) {

                const etiqueta =
                    document.createElement("span");

                etiqueta.className =
                    "imagen-principal";

                etiqueta.textContent =
                    "Principal";

                contenedor.appendChild(etiqueta);

            }


            galeriaPreview.appendChild(
                contenedor
            );

        }
    );

}


function liberarUrlsPreview() {

    for (const url of estadoVender.urlsPreview) {

        URL.revokeObjectURL(url);

    }


    estadoVender.urlsPreview = [];

}


/* ============================================================
   DRAG & DROP
============================================================ */

function manejarDragOver(event) {

    event.preventDefault();

    if (!estadoVender.dragActivo) {

        estadoVender.dragActivo = true;

        zonaImagenes.classList.add("dragover");

    }

}


function manejarDragLeave(event) {

    event.preventDefault();

    estadoVender.dragActivo = false;

    zonaImagenes.classList.remove("dragover");

}


function manejarDrop(event) {

    event.preventDefault();

    estadoVender.dragActivo = false;

    zonaImagenes.classList.remove("dragover");


    const archivos =
        Array.from(
            event.dataTransfer.files || []
        );


    procesarImagenes(archivos);

}


/* ============================================================
   CAMBIOS DEL FORMULARIO
============================================================ */

function manejarCambioFormulario() {

    actualizarContadores();

    actualizarPreview();

    limpiarMensajeGeneral();

}


/* ============================================================
   CONTADORES
============================================================ */

function actualizarContadores() {

    contadorNombre.textContent =
        inputNombre.value.length;


    contadorDescripcion.textContent =
        inputDescripcion.value.length;

}


/* ============================================================
   PREVIEW
============================================================ */

function actualizarPreview() {

    const nombre =
        inputNombre.value.trim();


    const descripcion =
        inputDescripcion.value.trim();


    const precio =
        Number.parseFloat(
            inputPrecio.value
        );


    const categoriaTexto =
        obtenerTextoSelect(
            inputCategoria
        );


    const departamento =
        inputDepartamento.value.trim();


    const distrito =
        inputDistrito.value.trim();


    previewNombre.textContent =
        nombre ||
        "Nombre del producto";


    if (
        Number.isFinite(precio) &&
        precio > 0
    ) {

        previewPrecio.textContent =
            formatearPrecio(precio);

    } else {

        previewPrecio.textContent =
            "S/ 0.00";

    }


    previewDescripcion.textContent =
        descripcion ||
        "Aquí aparecerá la descripción de tu producto.";


    previewCategoria.textContent =
        categoriaTexto
            ? `📦 ${categoriaTexto}`
            : "📦 Categoría";


    const ubicacion =
        [distrito, departamento]
            .filter(Boolean)
            .join(", ");


    previewUbicacion.textContent =
        ubicacion
            ? `📍 ${ubicacion}`
            : "📍 Ubicación";


    actualizarPreviewImagen();

}


function actualizarPreviewImagen() {

    if (
        estadoVender.imagenes.length === 0
    ) {

        productoImagen.innerHTML = `
            <div class="placeholder-imagen">
                <span>📷</span>
                <p>Tu foto aparecerá aquí</p>
            </div>
        `;

        return;
    }


    const primeraImagen =
        estadoVender.imagenes[0];


    const url =
        URL.createObjectURL(
            primeraImagen
        );


    productoImagen.innerHTML = "";


    const imagen =
        document.createElement("img");

    imagen.src = url;

    imagen.alt =
        "Vista previa del producto";


    productoImagen.appendChild(imagen);


    /*
     * La URL solamente se necesita para esta imagen.
     */

    imagen.addEventListener(
        "load",
        () => {

            URL.revokeObjectURL(url);

        },
        {
            once: true
        }
    );

}


/* ============================================================
   ENVÍO
============================================================ */

async function manejarEnvioFormulario(event) {

    event.preventDefault();


    /*
     * Protección contra doble click.
     *
     * Esto es importante cuando posteriormente conectemos
     * Firebase: evita crear dos publicaciones por accidente.
     */

    if (estadoVender.enviando) {
        return;
    }


    limpiarMensajeGeneral();


    const datos =
        obtenerDatosFormulario();


    const valido =
        validarFormulario(datos);


    if (!valido) {

        mostrarMensajeGeneral(
            "Revisa los campos marcados antes de publicar."
        );

        return;
    }


    estadoVender.enviando = true;

    activarEstadoCarga();


    try {

        /*
         * -----------------------------------------------------
         * PUNTO DE INTEGRACIÓN CON FIREBASE
         * -----------------------------------------------------
         *
         * Aquí se conectará:
         *
         * 1. Firebase Storage
         *    -> subir las imágenes
         *
         * 2. Cloud Firestore
         *    -> guardar los datos del producto
         *
         * NO utilizamos listeners permanentes aquí.
         * La publicación es una operación única.
         *
         * -----------------------------------------------------
         */

        const resultado =
            await publicarProducto(datos);


        if (!resultado.exito) {

            throw new Error(
                resultado.mensaje ||
                "No se pudo publicar el producto."
            );

        }


        mostrarMensajeGeneral(
            "¡Producto publicado correctamente!",
            "exito"
        );


        /*
         * Dejamos un pequeño tiempo para que el usuario vea
         * el mensaje antes de regresar al marketplace.
         */

        window.setTimeout(
            () => {

                window.location.href =
                    "../index.html";

            },
            1200
        );


    } catch (error) {

        console.error(
            "Error al publicar producto:",
            error
        );


        mostrarMensajeGeneral(
            obtenerMensajeError(error)
        );


        estadoVender.enviando = false;

        desactivarEstadoCarga();

    }

}


/* ============================================================
   OBTENER DATOS
============================================================ */

function obtenerDatosFormulario() {

    const precio =
        Number.parseFloat(
            inputPrecio.value
        );


    return {

        /*
         * ID temporal.
         *
         * En Firebase será mejor generar el ID con addDoc()
         * para evitar colisiones entre usuarios.
         */

        clienteIdTemporal:
            generarIdLocal(),


        nombre:
            limpiarTexto(
                inputNombre.value
            ),


        precio:
            Number.isFinite(precio)
                ? precio
                : null,


        categoria:
            inputCategoria.value,


        condicion:
            inputCondicion.value,


        descripcion:
            limpiarTexto(
                inputDescripcion.value
            ),


        ubicacion: {

            departamento:
                limpiarTexto(
                    inputDepartamento.value
                ),

            distrito:
                limpiarTexto(
                    inputDistrito.value
                )

        },


        telefono:
            limpiarTexto(
                inputTelefono.value
            ),


        imagenes:
            [...estadoVender.imagenes],


        fechaCreacionCliente:
            new Date().toISOString()

    };

}


/* ============================================================
   VALIDACIÓN
============================================================ */

function validarFormulario(datos) {

    let valido = true;


    limpiarTodosLosErrores();


    if (
        datos.nombre.length < 3 ||
        datos.nombre.length >
        CONFIG_VENDER.MAX_NOMBRE
    ) {

        mostrarError(
            "nombre",
            "El nombre debe tener entre 3 y 80 caracteres."
        );

        valido = false;

    }


    if (
        !Number.isFinite(datos.precio) ||
        datos.precio <
        CONFIG_VENDER.PRECIO_MINIMO ||
        datos.precio >
        CONFIG_VENDER.PRECIO_MAXIMO
    ) {

        mostrarError(
            "precio",
            "Ingresa un precio válido."
        );

        valido = false;

    }


    if (!datos.categoria) {

        mostrarError(
            "categoria",
            "Selecciona una categoría."
        );

        valido = false;

    }


    if (!datos.condicion) {

        mostrarError(
            "condicion",
            "Selecciona el estado del producto."
        );

        valido = false;

    }


    if (
        datos.descripcion.length < 10 ||
        datos.descripcion.length >
        CONFIG_VENDER.MAX_DESCRIPCION
    ) {

        mostrarError(
            "descripcion",
            "La descripción debe tener entre 10 y 1000 caracteres."
        );

        valido = false;

    }


    if (
        datos.imagenes.length === 0
    ) {

        mostrarError(
            "imagenes",
            "Agrega al menos una imagen del producto."
        );

        valido = false;

    }


    return valido;

}


/* ============================================================
   PUBLICAR PRODUCTO
============================================================ */

async function publicarProducto(datos) {

    /*
     * IMPORTANTE:
     *
     * Esta función está separada del formulario.
     *
     * Eso permite que posteriormente podamos conectar Firebase
     * sin tener que modificar toda la interfaz.
     *
     * Por ahora hacemos una simulación controlada.
     */

    await esperar(350);


    /*
     * En la siguiente etapa esta función será sustituida por:
     *
     *   1. subir imágenes a Firebase Storage
     *   2. obtener sus URLs
     *   3. crear UN documento en Firestore
     *
     * No habrá un onSnapshot permanente en esta pantalla.
     */

    console.log(
        "PUBLICACIÓN PREPARADA:",
        {
            ...datos,
            imagenes:
                datos.imagenes.map(
                    imagen => ({
                        nombre: imagen.name,
                        tipo: imagen.type,
                        tamano: imagen.size
                    })
                )
        }
    );


    return {

        exito: true,

        mensaje:
            "Producto preparado correctamente."

    };

}


/* ============================================================
   ESTADO DE CARGA
============================================================ */

function activarEstadoCarga() {

    btnPublicar.disabled = true;

    btnPublicar.classList.add(
        "cargando"
    );

}


function desactivarEstadoCarga() {

    btnPublicar.disabled = false;

    btnPublicar.classList.remove(
        "cargando"
    );

}


/* ============================================================
   ERRORES
============================================================ */

function mostrarError(campo, mensaje) {

    const elementoError =
        document.getElementById(
            `error-${campo}`
        );


    if (elementoError) {

        elementoError.textContent =
            mensaje;

    }


    const input =
        document.getElementById(
            campo
        );


    const contenedor =
        input?.closest(".campo");


    if (contenedor) {

        contenedor.classList.add(
            "error"
        );

    }

}


function limpiarError(campo) {

    const elementoError =
        document.getElementById(
            `error-${campo}`
        );


    if (elementoError) {

        elementoError.textContent = "";

    }


    const input =
        document.getElementById(
            campo
        );


    const contenedor =
        input?.closest(".campo");


    if (contenedor) {

        contenedor.classList.remove(
            "error"
        );

    }

}


function limpiarTodosLosErrores() {

    const errores =
        document.querySelectorAll(
            ".mensaje-error"
        );


    errores.forEach(
        elemento => {
            elemento.textContent = "";
        }
    );


    const campos =
        document.querySelectorAll(
            ".campo.error"
        );


    campos.forEach(
        campo => {
            campo.classList.remove(
                "error"
            );
        }
    );

}


function mostrarMensajeGeneral(
    mensaje,
    tipo = "error"
) {

    mensajeGeneral.textContent =
        mensaje;


    if (tipo === "exito") {

        mensajeGeneral.style.color =
            "#008f72";

    } else {

        mensajeGeneral.style.color =
            "#dc3545";

    }

}


function limpiarMensajeGeneral() {

    mensajeGeneral.textContent = "";

}


/* ============================================================
   UTILIDADES
============================================================ */

function limpiarTexto(texto) {

    return String(texto || "")
        .trim()
        .replace(/\s+/g, " ");

}


function obtenerTextoSelect(select) {

    if (!select || !select.value) {
        return "";
    }


    const opcion =
        select.options[
            select.selectedIndex
        ];


    return opcion
        ? opcion.textContent.trim()
        : "";

}


function formatearPrecio(precio) {

    return new Intl.NumberFormat(
        "es-PE",
        {
            style: "currency",
            currency: "PEN",
            minimumFractionDigits: 2
        }
    ).format(precio);

}


function generarIdLocal() {

    if (
        typeof crypto !== "undefined" &&
        typeof crypto.randomUUID === "function"
    ) {

        return crypto.randomUUID();

    }


    return (
        Date.now().toString(36) +
        "-" +
        Math.random()
            .toString(36)
            .substring(2, 10)
    );

}


function esperar(milisegundos) {

    return new Promise(
        resolve => {
            window.setTimeout(
                resolve,
                milisegundos
            );
        }
    );

}


function obtenerMensajeError(error) {

    if (!error) {

        return "Ocurrió un error inesperado.";

    }


    if (
        error.code ===
        "permission-denied"
    ) {

        return (
            "No tienes permisos para realizar esta publicación."
        );

    }


    if (
        error.code ===
        "storage/unauthorized"
    ) {

        return (
            "No tienes permisos para subir las imágenes."
        );

    }


    if (
        error.code ===
        "storage/quota-exceeded"
    ) {

        return (
            "Se alcanzó el límite de almacenamiento."
        );

    }


    if (
        error.message &&
        error.message.length < 180
    ) {

        return error.message;

    }


    return (
        "No se pudo completar la publicación. " +
        "Inténtalo nuevamente."
    );

}


/* ============================================================
   LIMPIEZA
============================================================ */

window.addEventListener(
    "beforeunload",
    liberarUrlsPreview
);