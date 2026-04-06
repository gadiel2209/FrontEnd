const API = 'https://prestamos-xi.vercel.app/api'
const token = localStorage.getItem('token')

// ─── VERIFICAR PERMISOS ───────────────────────────────────────────
function verificarAccesoAdmin() {
    const id_rol = localStorage.getItem('id_rol');
    if (!token || id_rol !== "1") {
        window.location.href = '../login.html'; // Asegúrate que apunte a tu login correcto
    }
} 

// ─── CARGAR FORMULARIO (Ruta pública: /api/ajustes) ───────────────
async function cargarAjustes() {
    try {
        const res = await fetch(`${API}/ajustes`);
        if (res.ok) {
            const settings = await res.json();
            if (document.getElementById('email'))     document.getElementById('email').value     = settings.email     || '';
            if (document.getElementById('telefono'))  document.getElementById('telefono').value  = settings.telefono  || '';
            if (document.getElementById('copyright')) document.getElementById('copyright').value = settings.copyright || '';
        }
    } catch (error) {
        console.error("Error al cargar ajustes:", error);
    }
} 

// ─── GUARDAR CAMBIOS (Rutas admin: /api/ajustes/admin) ────────────
async function guardarCambios(e) {
    e.preventDefault();

    const btn = e.target.querySelector('button[type="submit"]');
    const originalHTML = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Guardando...';

    const registros = [
        { clave: 'email',     valor: document.getElementById('email').value.trim(),     descripcion: 'Correo de contacto principal' },
        { clave: 'telefono',  valor: document.getElementById('telefono').value.trim(),  descripcion: 'Teléfono de atención al cliente' },
        { clave: 'copyright', valor: document.getElementById('copyright').value.trim(), descripcion: 'Texto legal del pie de página' }
    ];

    try {
        const promesas = registros.map(async (reg) => {
            // URL corregida a /ajustes/admin/:clave
            const urlPut = `${API}/ajustes/admin/${reg.clave}`;
            console.log(`PUT ${urlPut}`, reg.valor);

            let res = await fetch(urlPut, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ valor: reg.valor })
            });

            console.log(`PUT ${reg.clave} → status: ${res.status}`);

            if (res.status === 404) {
                console.log(`${reg.clave} no existe, creando con POST...`);
                // URL corregida a /ajustes/admin
                res = await fetch(`${API}/ajustes/admin`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(reg)
                });
                console.log(`POST ${reg.clave} → status: ${res.status}`);
            }

            return res;
        });

        const respuestas = await Promise.all(promesas);
        const todoOk = respuestas.every(res => res.ok);

        if (todoOk) {
            mostrarToast("Ajustes guardados correctamente", "success");
            setTimeout(() => location.reload(), 2000);
        } else {
            mostrarToast("Algunos ajustes no se pudieron guardar", "error");
            btn.disabled = false;
            btn.innerHTML = originalHTML;
        }

    } catch (error) {
        console.error("Error:", error);
        mostrarToast("Error de conexión", "error");
        btn.disabled = false;
        btn.innerHTML = originalHTML;
    }
} 

// ─── TOAST ────────────────────────────────────────────────────────
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

const form = document.querySelector('form');
if (form) form.addEventListener('submit', guardarCambios);