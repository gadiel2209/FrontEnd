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

// --- GESTIÓN DE SESIÓN (CORREGIDA) ---
// --- GESTIÓN DE SESIÓN MEJORADA ---
function cerrarSesion() {
    console.log("Cerrando sesión...");
    localStorage.clear(); // Limpia token, nombre y rol
    
    // Al cerrar sesión, siempre mandamos al login de la raíz
    const path = window.location.pathname;
    if (path.includes('/public/')) {
        window.location.href = '../login.html';
    } else {
        window.location.href = 'login.html';
    }
}

function actualizarBotonSesion() {
    const btnSesion = document.getElementById('btnSesion');
    const token = localStorage.getItem('token');
    const nombreUsuario = localStorage.getItem('nombre');
    const rol = localStorage.getItem('rol'); // Obtenemos el rol guardado

    if (token && btnSesion) {
        btnSesion.innerHTML = `<i class="fas fa-user-circle"></i> ${nombreUsuario || 'Mi Perfil'}`;
        
        // --- LÓGICA DE REDIRECCIÓN SEGÚN ROL ---
        // Si el rol es 1 (Administrador según tu BD), va a la raíz
        // Si es otro, va a la carpeta public
        if (rol == "1") {
            // Si estamos en public, subimos un nivel para ir al perfil de raíz
            const path = window.location.pathname;
            btnSesion.href = path.includes('/public/') ? '../perfil.html' : 'perfil.html';
        } else {
            // Para usuarios normales, va al perfil dentro de public
            const path = window.location.pathname;
            btnSesion.href = path.includes('/public/') ? 'perfil.html' : 'public/perfil.html';
        }

        btnSesion.style.background = 'var(--accent)';
        btnSesion.style.color = 'var(--primary)';
    } else if (btnSesion) {
        // Configuración para cuando NO hay sesión
        const path = window.location.pathname;
        btnSesion.href = path.includes('/public/') ? '../login.html' : 'login.html';
        btnSesion.innerHTML = `<i class="fas fa-right-to-bracket"></i> Iniciar Sesión`;
    }
}



// --- LÓGICA DE BURBUJA ---
document.addEventListener('DOMContentLoaded', () => {
    actualizarBotonSesion();

    const accessBtn = document.getElementById('accessBtn');
    const accessMenu = document.getElementById('accessMenu');

    if (accessBtn && accessMenu) {
        accessBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            accessMenu.classList.toggle('active');
        });

        document.addEventListener('click', (e) => {
            if (!accessMenu.contains(e.target)) accessMenu.classList.remove('active');
        });
    }
});