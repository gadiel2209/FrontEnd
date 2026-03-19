const API = 'https://prestamos-xi.vercel.app/api';
const token = localStorage.getItem('token');

// ─── VERIFICAR PERMISOS (Igual que en tu header) ──────────────────
function verificarAccesoAdmin() {
    const id_rol = localStorage.getItem('id_rol');
    if (!token || id_rol !== "1") {
        // Si no es admin, lo sacamos por seguridad
        window.location.href = '../login.html';
    }
}



// ─── CARGAR DATOS ─────────────────────────────────────────────────
async function cargarAjustes() {
    try {
        const res = await fetch(`${API}/ajustes`); // GET /api/ajustes
        if (res.ok) {
            const settings = await res.json();
            // Tu controlador reduce las filas a un objeto { clave: valor }
            // Asegúrate que las 'claves' en tu DB sean: email, telefono, copyright
            if (document.getElementById('email')) document.getElementById('email').value = settings.email || '';
            if (document.getElementById('telefono')) document.getElementById('telefono').value = settings.telefono || '';
            if (document.getElementById('copyright')) document.getElementById('copyright').value = settings.copyright || '';
        }
    } catch (error) {
        console.error("Error:", error);
    }
}

// ─── GUARDAR CAMBIOS ──────────────────────────────────────────────
// Función para guardar basada en tu estructura de controlador
async function guardarCambios(e) {
    e.preventDefault();
    
    const btn = e.target.querySelector('button[type="submit"]');
    const originalHTML = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Creando...';

    // Definimos los nuevos ajustes a registrar
    // Nota: Si la clave ya existe, tu API devolverá error 409 (Conflicto)
    const nuevosRegistros = [
        { 
            clave: 'email', 
            valor: document.getElementById('email').value.trim(),
            descripcion: 'Correo de contacto principal' 
        },
        { 
            clave: 'telefono', 
            valor: document.getElementById('telefono').value.trim(),
            descripcion: 'Teléfono de atención al cliente' 
        },
        { 
            clave: 'copyright', 
            valor: document.getElementById('copyright').value.trim(),
            descripcion: 'Texto legal del pie de página' 
        }
    ];

    try {
        const promesas = nuevosRegistros.map(reg => 
            fetch(`${API}/ajustes`, { // Usamos la ruta base para POST
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(reg) // Enviamos clave, valor y descripcion
            })
        );

        const respuestas = await Promise.all(promesas);
        
        // Verificamos si todos se crearon (status 201)
        const todosCreados = respuestas.every(res => res.status === 201);

        if (todosCreados) {
            mostrarToast("✅ Nuevos ajustes creados con éxito", "success");
            setTimeout(() => location.reload(), 2000);
        } else {
            // Si sale 409, es porque la clave ya existe en la DB
            mostrarToast("Aviso: Algunos ajustes ya existen o hubo un error", "error");
            btn.disabled = false;
            btn.innerHTML = originalHTML;
        }
    } catch (error) {
        console.error(error);
        mostrarToast("Error de conexión", "error");
        btn.disabled = false;
        btn.innerHTML = originalHTML;
    }
}
// ─── TOAST (Tu función estilizada) ────────────────────────────────
function mostrarToast(mensaje, tipo = 'success') {
    const toast = document.createElement('div');
    toast.style.cssText = `
        position:fixed; bottom:30px; left:50%; transform:translateX(-50%);
        background:${tipo === 'success' ? '#1a392a' : '#ef4444'};
        color:white; padding:14px 28px; border-radius:12px;
        font-size:0.88rem; font-weight:600; z-index:9999;
        box-shadow:0 8px 20px rgba(0,0,0,0.2);`;
    toast.textContent = mensaje;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3500);
}

// ─── ARRANQUE ─────────────────────────────────────────────────────
verificarAccesoAdmin();
cargarAjustes();

// Escuchamos el evento submit del formulario
const form = document.querySelector('form');
if (form) form.addEventListener('submit', guardarCambios);