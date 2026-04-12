const API_USUARIOS = 'https://prestamos-xi.vercel.app/api';
let todosLosUsuarios = [];

const token = localStorage.getItem('token');
const id_rol = localStorage.getItem('id_rol');

// ─── SEGURIDAD ────────────────────────────────────────────────────
function verificarAcceso() {
    if (!token || id_rol !== "1") {
        window.location.href = "../login.html";
        return;
    }
    const btnSesion = document.getElementById('btnSesion');
    if (btnSesion) {
        const nombre = localStorage.getItem('nombre') || 'Usuario Admin';
        btnSesion.innerHTML = `<i class="fas fa-user-circle"></i> ${nombre.toLowerCase()}`;
    }
}

// ─── CARGAR USUARIOS ──────────────────────────────────────────────
async function cargarUsuarios() {
    const tbody = document.getElementById('tbodyUsuarios');
    tbody.innerHTML = `<tr><td colspan="7" style="padding:30px; text-align:center; color:#888;">
        <i class="fas fa-circle-notch fa-spin"></i> Cargando usuarios...
    </td></tr>`;

    try {
        const res = await fetch(`${API_USUARIOS}/usuario`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error();
        todosLosUsuarios = await res.json();
        renderizarTabla(todosLosUsuarios);
    } catch {
        tbody.innerHTML = `<tr><td colspan="7" style="padding:30px; text-align:center; color:#ef4444;">
            <i class="fas fa-exclamation-triangle"></i> No se pudo conectar con el servidor.
        </td></tr>`;
    }
}

// ─── RENDERIZAR TABLA ─────────────────────────────────────────────
function renderizarTabla(usuarios) {
    const tbody = document.getElementById('tbodyUsuarios');
    tbody.innerHTML = '';

    if (usuarios.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="padding:30px; text-align:center; color:#888;">Sin resultados encontrados.</td></tr>`;
        return;
    }

    const miId = Number(localStorage.getItem('id_usuario'));

    usuarios.forEach(u => {
        const tr = document.createElement('tr');
        tr.style.borderBottom = "1px solid #edf2f7";

        const fecha = u.fecha_registro
            ? new Date(u.fecha_registro).toLocaleDateString('es-MX')
            : '---';

        const esAdmin = u.id_rol === 1;
        const bgBadge  = esAdmin ? '#e2e8f0' : '#dcfce7';
        const colorText = esAdmin ? '#475569' : '#166834';
        const textoRol  = esAdmin ? 'ADMINISTRADOR' : 'ESTUDIANTE';
        const nombreCompleto = `${u.nombre} ${u.ap_paterno || ''}`.trim();

        // No permitir que el admin se elimine a sí mismo
        const esYo = u.id_usuario === miId;
        const btnEliminar = esYo
            ? `<span title="No puedes eliminarte a ti mismo"
                   style="color:#cbd5e1; font-size:1.1rem; cursor:not-allowed;">
                   <i class="fas fa-trash-alt"></i>
               </span>`
            : `<button
                   onclick="confirmarEliminar(${u.id_usuario}, '${nombreCompleto.replace(/'/g, "\\'")}')"
                   title="Eliminar usuario"
                   style="background:none; border:none; color:#94a3b8; cursor:pointer;
                          font-size:1.1rem; transition:color .2s;"
                   onmouseover="this.style.color='#ef4444'"
                   onmouseout="this.style.color='#94a3b8'">
                   <i class="fas fa-trash-alt"></i>
               </button>`;

        tr.innerHTML = `
            <td style="padding:15px; font-size:.8rem; color:#94a3b8;">${u.id_usuario.toString().padStart(3,'0')}</td>
            <td style="padding:15px; font-weight:700;">${u.usuario}</td>
            <td style="padding:15px;">${nombreCompleto}</td>
            <td style="padding:15px; color:#64748b;">${u.correo}</td>
            <td style="padding:15px;">
                <span style="background:${bgBadge}; color:${colorText};
                      padding:4px 12px; border-radius:20px; font-size:.68rem; font-weight:800; letter-spacing:.04em;">
                    ${textoRol}
                </span>
            </td>
            <td style="padding:15px; color:#64748b;">${fecha}</td>
            <td style="padding:15px; text-align:center;">${btnEliminar}</td>
        `;
        tbody.appendChild(tr);
    });
}

// ─── BÚSQUEDA ─────────────────────────────────────────────────────
function buscarUsuario() { filtrarUsuarios(); }

function filtrarUsuarios() {
    const query = document.getElementById('inputBuscar').value.toLowerCase().trim();
    const filtrados = todosLosUsuarios.filter(u =>
        (u.nombre    || '').toLowerCase().includes(query) ||
        (u.usuario   || '').toLowerCase().includes(query) ||
        (u.correo    || '').toLowerCase().includes(query)
    );
    renderizarTabla(filtrados);
}

// ─── MODAL ELIMINAR ───────────────────────────────────────────────
function confirmarEliminar(id, nombre) {
    document.getElementById('eliminarNombreUsuario').textContent = nombre;
    document.getElementById('btnConfirmarEliminarUsuario').onclick = () => eliminarUsuario(id);
    abrirModal('modalEliminarUsuario');
}

async function eliminarUsuario(id) {
    const btn = document.getElementById('btnConfirmarEliminarUsuario');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin" style="margin-right:6px;"></i> Eliminando...';

    try {
        const res = await fetch(`${API_USUARIOS}/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data.message || 'Error al eliminar');
        }

        mostrarToast('Usuario y todos sus registros fueron eliminados.', 'success');
        cerrarModal('modalEliminarUsuario');
        await cargarUsuarios();

    } catch (err) {
        mostrarToast(err.message || 'Ocurrió un error al eliminar.', 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-trash-alt" style="margin-right:6px;"></i> Sí, eliminar todo';
    }
}

// ─── HELPERS MODAL ────────────────────────────────────────────────
function abrirModal(id) {
    document.getElementById(id).style.display = 'flex';
    document.body.style.overflow = 'hidden';
}
function cerrarModal(id) {
    document.getElementById(id).style.display = 'none';
    document.body.style.overflow = '';
}

document.addEventListener('click', (e) => {
    const modal = document.getElementById('modalEliminarUsuario');
    if (e.target === modal) cerrarModal('modalEliminarUsuario');
});

// ─── TOAST ────────────────────────────────────────────────────────
function mostrarToast(mensaje, tipo = 'success') {
    let toast = document.getElementById('toastUsuarios');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toastUsuarios';
        document.body.appendChild(toast);
    }
    const bg = tipo === 'success' ? '#22c55e' : '#ef4444';
    const icon = tipo === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle';
    toast.style.cssText = `
        position:fixed; bottom:24px; right:24px; z-index:9999;
        background:${bg}; color:white; padding:12px 20px;
        border-radius:10px; font-family:'Montserrat',sans-serif;
        font-weight:600; font-size:.85rem; display:flex;
        align-items:center; gap:10px; box-shadow:0 8px 24px rgba(0,0,0,.15);
        transition:opacity .3s; opacity:1;
    `;
    toast.innerHTML = `<i class="fas ${icon}"></i> ${mensaje}`;
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => { toast.style.opacity = '0'; }, 3000);
}

// ─── INIT ─────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    verificarAcceso();
    cargarUsuarios();
    document.getElementById('inputBuscar').addEventListener('input', filtrarUsuarios);
});