// --- CONFIGURACIÓN DE ACCESIBILIDAD LOANWARE ---

// 1. NARRADOR DE VOZ (TALKBACK/SCREEN READER)
let sintetizador = window.speechSynthesis;
let lecturaActiva = false;

function toggleNarrador() {
    lecturaActiva = !lecturaActiva;
    const btn = document.querySelector('[onclick="toggleNarrador()"]');
    
    if (lecturaActiva) {
        btn.style.backgroundColor = "var(--accent)";
        btn.style.color = "var(--primary)";
        alert("Narrador activado. Pase el mouse sobre los textos para escuchar.");
        
        // Escuchar eventos de mouse en toda la página
        document.addEventListener('mouseover', hablarTexto);
    } else {
        btn.style.backgroundColor = "";
        btn.style.color = "";
        sintetizador.cancel();
        document.removeEventListener('mouseover', hablarTexto);
    }
}

function hablarTexto(e) {
    if (!lecturaActiva) return;
    
    // Solo leer si es un texto relevante
    const texto = e.target.innerText;
    if (texto && (e.target.tagName === 'P' || e.target.tagName === 'H1' || e.target.tagName === 'H2' || e.target.tagName === 'SPAN' || e.target.tagName === 'A')) {
        sintetizador.cancel(); // Detener lectura anterior
        const mensaje = new SpeechSynthesisUtterance(texto);
        mensaje.lang = 'es-ES';
        sintetizador.speak(mensaje);
    }
}

// 2. MODOS PARA DALTONISMO Y CEGUERA (CONTRASTE)
function toggleDaltonismo(event) {
    if (event) event.preventDefault();
    
    // Cambiamos document.body por document.documentElement (que es la etiqueta <html>)
    const root = document.documentElement; 
    const scrollActual = window.pageYOffset; 

    if (!root.classList.contains('protanopia') && !root.classList.contains('deuteranopia') && !root.classList.contains('ceguera-total')) {
        root.classList.add('protanopia');
    } else if (root.classList.contains('protanopia')) {
        root.classList.replace('protanopia', 'deuteranopia');
    } else if (root.classList.contains('deuteranopia')) {
        root.classList.replace('deuteranopia', 'ceguera-total');
    } else {
        root.classList.remove('ceguera-total');
    }

    // Restaurar scroll por si el navegador intenta saltar
    window.scrollTo(0, scrollActual);
}

// 3. TAMAÑO DE LETRA (ZOOM DE TEXTO)
let fontSizeActual = 100;
function cambiarFontSize(accion) {
    const body = document.body;
    if (accion === 'increase' && fontSizeActual < 150) {
        fontSizeActual += 10;
    } else if (accion === 'decrease' && fontSizeActual > 80) {
        fontSizeActual -= 10;
    } else if (accion === 'reset') {
        fontSizeActual = 100;
    }
    body.style.fontSize = fontSizeActual + "%";
}

// --- LÓGICA DE LA BURBUJA (DRAGGABLE Y TOGGLE) ---
const accessBtn = document.getElementById('accessBtn');
const accessMenu = document.getElementById('accessMenu');

if (accessBtn) {
    accessBtn.addEventListener('click', () => {
        accessMenu.classList.toggle('active');
    });
}

// Cerrar si se hace clic fuera
document.addEventListener('click', (e) => {
    if (accessMenu && !accessMenu.contains(e.target) && !accessBtn.contains(e.target)) {
        accessMenu.classList.remove('active');
    }
});


function actualizarBotonSesion() {
    // Buscamos el botón por ID (asegúrate de ponerle id="btnSesion" en el HTML)
    const btnSesion = document.getElementById('btnSesion');
    const token = localStorage.getItem('token');
    const nombreUsuario = localStorage.getItem('nombre');

    if (token && btnSesion) {
        // SI HAY SESIÓN:
        // 1. Cambiamos el texto y el icono
        btnSesion.innerHTML = `<i class="fas fa-user-circle"></i> ${nombreUsuario || 'Mi Perfil'}`;
        
        // 2. Apuntamos al perfil (está en la misma carpeta 'public')
        btnSesion.href = 'perfil.html';
        
        // 3. Estilo visual de "Sesión Activa" (Opcional)
        btnSesion.style.background = 'var(--accent)';
        btnSesion.style.color = 'var(--primary)';
    } else if (btnSesion) {
        // SI NO HAY SESIÓN:
        // El login está afuera de la carpeta 'public'
        btnSesion.href = '../login.html';
        btnSesion.innerHTML = `<i class="fas fa-right-to-bracket"></i> Iniciar Sesión`;
    }
}

// ─── INICIALIZACIÓN ───────────────────────────────────────────────
// Ejecutamos la función de sesión cuando cargue el documento
document.addEventListener('DOMContentLoaded', () => {
    actualizarBotonSesion();
});