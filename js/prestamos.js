/**
 * LOANWARE - Gestión de Préstamos (Admin)
 * Muestra solicitudes en estado 'pendiente' y permite aprobar o rechazar.
 *
 * Rutas que usa:
 *   GET /api/solicitudes              → lista completa, filtramos por estado='pendiente'
 *   PUT /api/solicitudes/aprobar/:id  → SP AprobarSolicitud
 *                                       ⚡ trigger tg_auditoria_solicitudes
 *                                       ⚡ trigger AuditoriaCambioEquipo
 *   PUT /api/solicitudes/rechazar/:id → SP RechazarSolicitud
 *                                       ⚡ trigger tg_auditoria_solicitudes
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
async function cargarPrestamos() {
    const tbody = document.getElementById('listaSolicitudesAdmin');
    if (!tbody) return;

    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:20px;">Cargando...</td></tr>`;

    try {
        const res = await fetch(`${API}/solicitudes`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!res.ok) throw new Error(`Error ${res.status}`);

        const solicitudes = await res.json();
        const pendientes  = solicitudes.filter(s => s.estado === 'pendiente');

        renderizarTabla(pendientes, tbody);

    } catch (error) {
        tbody.innerHTML = `<tr><td colspan="5" style="color:red; text-align:center; padding:20px;">
            Error al cargar: ${error.message}</td></tr>`;
    }
}

// ─── RENDER ───────────────────────────────────────────────────────
function renderizarTabla(datos, tbody) {
    if (datos.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:20px;">
            Sin solicitudes pendientes.</td></tr>`;
        return;
    }

    tbody.innerHTML = datos.map(sol => `
        <tr style="border-bottom: 1px solid #eee;">
            <td style="padding: 15px;">
                <b>${sol.usuario_nombre}</b>
                <div style="font-size:0.75rem; color:#666;">Mat: ${sol.matricula}</div>
            </td>
            <td style="padding: 15px;">
                <div style="display:flex; align-items:center; gap:10px;">
                    <img src="${sol.ruta_imagen || 'https://placehold.co/40x40?text=?'}"
                         alt="${sol.equipo_nombre}"
                         style="width:40px; height:40px; object-fit:contain; border-radius:6px;
                                background:#f1f5f9; padding:3px;"
                         onerror="this.src='https://placehold.co/40x40?text=?'">
                    <span style="font-weight:600;">${sol.equipo_nombre}</span>
                </div>
            </td>
            <td style="padding: 15px;">${new Date(sol.fecha_solicitud).toLocaleDateString('es-MX')}</td>
            <td style="padding: 15px;">
                <span style="background:rgba(245,158,11,0.1); color:#d97706; padding:5px 12px;
                             border-radius:20px; font-size:0.78rem; font-weight:700;">
                    PENDIENTE
                </span>
            </td>
            <td style="padding: 15px;">
                <div style="display: flex; gap: 10px;">
                    <button onclick="ejecutarAccion(${sol.id_solicitud}, 'aprobar')"
                        style="background:#059669; color:white; border:none; padding:8px 15px;
                               border-radius:6px; cursor:pointer; font-weight:bold;">
                        <i class="fas fa-check"></i> Aceptar
                    </button>
                    <button onclick="ejecutarAccion(${sol.id_solicitud}, 'rechazar')"
                        style="background:#dc2626; color:white; border:none; padding:8px 15px;
                               border-radius:6px; cursor:pointer; font-weight:bold;">
                        <i class="fas fa-times"></i> Rechazar
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// ─── ACCIÓN ───────────────────────────────────────────────────────
async function ejecutarAccion(id, accion) {
    const id_admin = getAdminId();
    if (!id_admin) return alert('Sesión expirada.');

    let datosBody = { id_admin };

    if (accion === 'rechazar') {
        const motivo = prompt('Motivo del rechazo:');
        if (!motivo || motivo.trim() === '') return;
        datosBody.motivo = motivo.trim();
    }

    try {
        const res = await fetch(`${API}/solicitudes/${accion}/${id}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(datosBody)
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.message || `Error ${res.status}`);

        const msg = accion === 'aprobar'
            ? '✅ Solicitud aprobada. El equipo quedó en estado "prestado".'
            : '❌ Solicitud rechazada. El motivo fue guardado en el historial.';
        alert(msg);

        cargarPrestamos(); // refrescar tabla

    } catch (e) {
        alert('Error: ' + e.message);
    }
}

document.addEventListener('DOMContentLoaded', cargarPrestamos);