// --- VARIABLES GLOBALES ---
let sintetizador = window.speechSynthesis;
let lecturaActiva = false;
let fontSizeActual = 100;

// --- 1. NARRADOR (MEJORADO) ---
function toggleNarrador() {
    lecturaActiva = !lecturaActiva;

    // Buscamos el botón por su ID o clase específica (ajusta el ID según tu HTML)
    const btn = document.getElementById('btnNarrador') || document.querySelector('.btn-narrador');

    if (lecturaActiva) {
        if (btn) {
            btn.style.backgroundColor = "var(--accent)";
            btn.style.color = "var(--primary)";
        }
        alert("Narrador activado. Pase el mouse sobre los textos para escuchar.");
        document.addEventListener('mouseover', hablarTexto);
    } else {
        if (btn) {
            btn.style.backgroundColor = "";
            btn.style.color = "";
        }
        sintetizador.cancel();
        document.removeEventListener('mouseover', hablarTexto);
    }
}

function hablarTexto(e) {
    if (!lecturaActiva) return;

    // .closest busca el tag relevante aunque el mouse esté sobre un elemento hijo (como un <i> o <b>)
    const elemento = e.target.closest('p, h1, h2, h3, span, a, li');

    if (elemento) {
        const texto = elemento.innerText.trim();
        if (texto.length > 0) {
            sintetizador.cancel();
            const mensaje = new SpeechSynthesisUtterance(texto);
            mensaje.lang = 'es-ES';
            mensaje.rate = 1; // Velocidad normal
            sintetizador.speak(mensaje);
        }
    }
}

// --- 2. MODOS DE VISIBILIDAD ---
function toggleDaltonismo(event) {
    if (event) event.preventDefault();

    const root = document.documentElement;
    const scrollActual = window.pageYOffset;

    // Rotación de clases
    if (!root.classList.contains('protanopia') && !root.classList.contains('deuteranopia') && !root.classList.contains('ceguera-total')) {
        root.classList.add('protanopia');
    } else if (root.classList.contains('protanopia')) {
        root.classList.replace('protanopia', 'deuteranopia');
    } else if (root.classList.contains('deuteranopia')) {
        root.classList.replace('deuteranopia', 'ceguera-total');
    } else {
        root.classList.remove('ceguera-total');
    }

    window.scrollTo(0, scrollActual);
}

// --- 3. TAMAÑO DE FUENTE ---
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

// --- 4. GESTIÓN DE SESIÓN ---
function cerrarSesion() {
    localStorage.clear();
    const path = window.location.pathname;
    window.location.href = path.includes('/public/') ? '../login.html' : 'login.html';
}

function actualizarBotonSesion() {
    const btnSesion = document.getElementById('btnSesion'); // Ahora es el <a>
    if (!btnSesion) return;

    const token = localStorage.getItem('token');
    const nombreUsuario = localStorage.getItem('nombre');

    if (token) {
        // Cambiamos el contenido del <a> completo
        btnSesion.innerHTML = `<i class="fas fa-user-circle"></i> ${nombreUsuario || "Mi Perfil"}`;

        // Ajustamos la ruta del link según dónde estemos
        const path = window.location.pathname;
        if (path.includes('/public/')) {
            btnSesion.href = '../perfil.html';
        } else {
            // Si estamos en el index de la raíz, el perfil está en public/
            btnSesion.href = 'public/perfil.html';
        }
    }
}

// --- 5. INICIALIZACIÓN (UNIFICADA) ---
document.addEventListener('DOMContentLoaded', () => {
    actualizarBotonSesion();

    const accessBtn = document.getElementById('accessBtn');
    const accessMenu = document.getElementById('accessMenu');

    if (accessBtn && accessMenu) {
        // Abrir/Cerrar menú
        accessBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            accessMenu.classList.toggle('active');
        });

        // Cerrar al hacer clic fuera
        document.addEventListener('click', (e) => {
            if (!accessMenu.contains(e.target) && !accessBtn.contains(e.target)) {
                accessMenu.classList.remove('active');
            }
        });
    }
});