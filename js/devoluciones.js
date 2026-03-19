/**
 * LOANWARE - Gestión de Devoluciones (Admin)
 * Muestra solicitudes en estado 'aprobada' (equipo en manos del usuario) y permite marcar devolución.
 *
 * Rutas que usa:
 *   GET /api/solicitudes              → lista completa, filtramos por estado='aprobada'
 *   PUT /api/solicitudes/devolver/:id → SP MarcarDevuelta
 *                                       ⚡ trigger ActualizarEquipoDevuelto → equipo vuelve a 'disponible'
 *                                       ⚡ trigger tg_auditoria_solicitudes
 *                                       ⚡ trigger AuditoriaCambioEquipo
 *
 * Campos que llegan en cada objeto:
 *   id_solicitud, estado, fecha_solicitud,
 *   usuario_nombre, matricula, equipo_nombre, ruta_imagen
 */

const API   = 'https://prestamos-xi.vercel.app/api';
const token = localStorage.getItem('token');

function getAdminId() {
    if (!token) return null;
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.id_usuario || payload.id;
    } catch (e) { return null; }
}

// ─── CARGA ────────────────────────────────────────────────────────
async function cargarDevoluciones() {
    const tbody = document.getElementById('listaDevolucionesAdmin');
    if (!tbody) return;

    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:20px;">Cargando préstamos activos...</td></tr>`;

    try {
        const res = await fetch(`${API}/solicitudes`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!res.ok) throw new Error(`Error ${res.status}`);

        const solicitudes = await res.json();
        const activos     = solicitudes.filter(s => s.estado === 'aprobada');

        renderizarTabla(activos, tbody);

    } catch (error) {
        tbody.innerHTML = `<tr><td colspan="6" style="color:red; text-align:center; padding:20px;">
            Error al cargar: ${error.message}</td></tr>`;
    }
}

// ─── RENDER ───────────────────────────────────────────────────────
function renderizarTabla(datos, tbody) {
    if (datos.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:20px;">
            No hay equipos pendientes de devolución.</td></tr>`;
        return;
    }

    tbody.innerHTML = datos.map(sol => `
        <tr style="border-bottom: 1px solid #eee;">
            <td style="padding: 15px 20px; font-weight: 600;">
                ${sol.usuario_nombre}
                <div style="font-size:0.75rem; color:#666;">Mat: ${sol.matricula}</div>
            </td>
            <td style="padding: 15px 20px;">
                <div style="display:flex; align-items:center; gap:10px;">
                    <img src="${sol.ruta_imagen || 'https://placehold.co/40x40?text=?'}"
                         alt="${sol.equipo_nombre}"
                         style="width:40px; height:40px; object-fit:contain; border-radius:6px;
                                background:#f1f5f9; padding:3px;"
                         onerror="this.src='https://placehold.co/40x40?text=?'">
                    <span style="font-weight:600;">${sol.equipo_nombre}</span>
                </div>
            </td>
            <td style="padding: 15px 20px;">
                ${new Date(sol.fecha_solicitud).toLocaleDateString('es-MX')}
            </td>
            <td style="padding: 15px 20px;">
                <span style="background:#dcfce7; color:#166534; padding:5px 10px;
                             border-radius:15px; font-size:0.78rem; font-weight:700;">
                    EN PRÉSTAMO
                </span>
            </td>
            <td style="padding: 15px 20px;">
                <button onclick="confirmarDevolucion(${sol.id_solicitud})"
                    style="background:#6366f1; color:white; border:none; padding:8px 15px;
                           border-radius:6px; cursor:pointer; font-weight:bold;">
                    <i class="fas fa-undo-alt"></i> Recibir Equipo
                </button>
            </td>
        </tr>
    `).join('');
}

// ─── DEVOLVER ─────────────────────────────────────────────────────
// Llama al SP MarcarDevuelta → dispara trigger ActualizarEquipoDevuelto
// que pone el equipo en 'disponible' automáticamente en la BD
async function confirmarDevolucion(id) {
    const id_admin = getAdminId();
    if (!id_admin) return alert('Sesión expirada.');
    if (!confirm('¿Confirma que el equipo ha sido devuelto físicamente?')) return;

    try {
        const res = await fetch(`${API}/solicitudes/devolver/${id}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ id_admin })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.message || `Error ${res.status}`);

        alert('📦 Devolución registrada. El equipo ya está disponible nuevamente.');
        cargarDevoluciones(); // refrescar tabla

    } catch (e) {
        alert('Error al procesar devolución: ' + e.message);
    }
}

document.addEventListener('DOMContentLoaded', cargarDevoluciones);