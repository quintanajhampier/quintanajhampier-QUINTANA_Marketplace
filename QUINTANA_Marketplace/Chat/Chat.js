const formChat = document.getElementById('form-chat');
const inputMensaje = document.getElementById('input-mensaje');
const inputArchivo = document.getElementById('input-archivo');
const infoArchivo = document.getElementById('info-archivo');
const contenedorMensajes = document.getElementById('chat-mensajes');

const nombreUsuario = "Vecino Huantino"; 

// Mensaje inicial del sistema
mostrarComentario("Sistema Huanta", "⚠️ Bienvenidos al tablón de Huanta. Todas las publicaciones se eliminarán automáticamente en 48 horas.", true, null, null);

// Mostrar el nombre del archivo cuando se selecciona
inputArchivo.addEventListener('change', () => {
    if (inputArchivo.files.length > 0) {
        infoArchivo.textContent = `📎 Archivo adjunto: ${inputArchivo.files[0].name}`;
        infoArchivo.style.display = 'block';
    } else {
        infoArchivo.style.display = 'none';
    }
});

formChat.addEventListener('submit', (evento) => {
    evento.preventDefault();
    
    const texto = inputMensaje.value.trim();
    const archivo = inputArchivo.files[0];

    // Evitar enviar un comentario completamente vacío
    if (texto === '' && !archivo) return;

    let urlArchivoTemporal = null;
    let tipoArchivo = null;

    // Si hay archivo, creamos una vista previa temporal
    if (archivo) {
        urlArchivoTemporal = URL.createObjectURL(archivo);
        tipoArchivo = archivo.type; // Esto nos dirá si es image, video o audio
    }

    mostrarComentario(nombreUsuario, texto, false, urlArchivoTemporal, tipoArchivo);

    // Limpiar el formulario después de enviar
    inputMensaje.value = '';
    inputArchivo.value = '';
    infoArchivo.style.display = 'none';
    inputMensaje.focus();
});

function mostrarComentario(autor, texto, esSistema, urlArchivo, tipoArchivo) {
    const divComentario = document.createElement('div');
    divComentario.classList.add('comentario');
    
    if (esSistema) {
        divComentario.style.borderLeftColor = '#eab308';
        divComentario.style.backgroundColor = '#fefce8';
    }

    const ahora = new Date();
    const horas = ahora.getHours().toString().padStart(2, '0');
    const minutos = ahora.getMinutes().toString().padStart(2, '0');
    const horaStr = `${horas}:${minutos}`;

    let htmlContenido = `
        <div class="comentario-header">
            <span class="autor">${autor}</span>
            <span class="hora">${horaStr}</span>
        </div>
        <p class="texto">${texto}</p>
    `;

    // Si hay un archivo, incrustamos el reproductor o la imagen según su tipo
    if (urlArchivo && tipoArchivo) {
        let mediaHtml = '';
        if (tipoArchivo.startsWith('image/')) {
            mediaHtml = `<img src="${urlArchivo}" alt="Imagen compartida">`;
        } else if (tipoArchivo.startsWith('video/')) {
            mediaHtml = `<video src="${urlArchivo}" controls preload="metadata"></video>`;
        } else if (tipoArchivo.startsWith('audio/')) {
            mediaHtml = `<audio src="${urlArchivo}" controls></audio>`;
        }
        
        htmlContenido += `<div class="multimedia-comentario">${mediaHtml}</div>`;
    }

    divComentario.innerHTML = htmlContenido;

    contenedorMensajes.appendChild(divComentario);
    contenedorMensajes.scrollTop = contenedorMensajes.scrollHeight;
}