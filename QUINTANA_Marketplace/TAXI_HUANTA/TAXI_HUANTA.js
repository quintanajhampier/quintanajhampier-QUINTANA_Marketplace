const chatBox = document.getElementById('chat-box');
const inputTexto = document.getElementById('input-texto');
const btnEnviar = document.getElementById('btn-enviar');
const btnFoto = document.getElementById('btn-foto');
const inputFoto = document.getElementById('input-foto');
const btnAudio = document.getElementById('btn-audio');
const inputAudio = document.getElementById('input-audio');

// Conectar botones visuales con los inputs ocultos
btnFoto.addEventListener('click', () => inputFoto.click());
btnAudio.addEventListener('click', () => inputAudio.click());

// Función principal para dibujar los mensajes en pantalla
function agregarMensaje(contenido, tipo = 'text') {
    const divMensaje = document.createElement('div');
    divMensaje.className = 'msg own';

    if (tipo === 'text') {
        divMensaje.textContent = contenido;
    } else if (tipo === 'image') {
        const img = document.createElement('img');
        img.src = contenido;
        divMensaje.appendChild(img);
    } else if (tipo === 'audio') {
        const audio = document.createElement('audio');
        audio.controls = true;
        audio.src = contenido;
        divMensaje.appendChild(audio);
    }

    chatBox.appendChild(divMensaje);
    // Bajar el scroll automáticamente al último mensaje
    chatBox.scrollTop = chatBox.scrollHeight;
}

// 1. Enviar texto
function enviarTexto() {
    const texto = inputTexto.value.trim();
    if (texto !== '') {
        agregarMensaje(texto, 'text');
        inputTexto.value = ''; // Limpiar la caja
    }
}

btnEnviar.addEventListener('click', enviarTexto);
inputTexto.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') enviarTexto();
});

// 2. Procesar fotos
inputFoto.addEventListener('change', (e) => {
    const archivo = e.target.files[0];
    if (archivo) {
        const lector = new FileReader();
        lector.onload = (evento) => agregarMensaje(evento.target.result, 'image');
        lector.readAsDataURL(archivo);
    }
});

// 3. Procesar audios
inputAudio.addEventListener('change', (e) => {
    const archivo = e.target.files[0];
    if (archivo) {
        const lector = new FileReader();
        lector.onload = (evento) => agregarMensaje(evento.target.result, 'audio');
        lector.readAsDataURL(archivo);
    }
});