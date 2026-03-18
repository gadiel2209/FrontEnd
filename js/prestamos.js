/**
 * LOANWARE - Admin Loans & Management
 * Gestión de préstamos activos y acciones de administración
 */

const API = 'https://prestamos-xi.vercel.app/api';
const token = localStorage.getItem('token');

function getAdminId() {
    if (!token) return null;
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.id_usuario || payload.id;
    } catch (e) { return null; }
}

// Carga tanto solicitudes pendientes como equipos prestados
async function cargarGestionAdmin() {
    const res = await fetch(`${API}/solicitudes`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) return;

    const solicitudes = await res.json();
    
    // Separar lógica por contenedores de ID en el HTML
    const pendientes = solicitudes.filter(s => s.estado === 'pendiente');
    const aprobadas = solicitudes.filter(s => s.estado === 'aprobada');

    renderizarTablaAdmin(pendientes, 'listaSolicitudesAdmin', 'solicitud');
    renderizarTablaAdmin(aprobadas, 'listaDevolucionesAdmin', 'devolucion');
}

function renderizarTablaAdmin(datos, targetId, tipo) {
    const tbody = document.getElementById(targetId);
    if (!tbody) return;

    tbody.innerHTML = datos.length === 0 ? '<tr><td colspan="6" style="text-align:center; padding:20px;">Sin registros.</td></tr>' : '';

    datos.forEach(sol => {
        const tr = document.createElement('tr');
        const botones = tipo === 'solicitud' 
            ? `<button onclick="ejecutarAccion(${sol.id_solicitud}, 'aprobar')" style="color:#059669; border:none; background:none; cursor:pointer;"><i class="fas fa-check-circle"></i></button>
               <button onclick="ejecutarAccion(${sol.id_solicitud}, 'rechazar')" style="color:#dc2626; border:none; background:none; cursor:pointer;"><i class="fas fa-times-circle"></i></button>`
            : `<button onclick="ejecutarAccion(${sol.id_solicitud}, 'devolver')" style="color:#6366f1; border:none; background:none; cursor:pointer;"><i class="fas fa-undo-alt"></i> Devolver</button>`;

        tr.innerHTML = `
            <td style="padding: 15px;"><b>${sol.usuario_nombre || sol.matricula}</b></td>
            <td style="padding: 15px;">${sol.equipo_nombre}</td>
            <td style="padding: 15px;">${new Date(sol.fecha_solicitud).toLocaleDateString()}</td>
            <td style="padding: 15px;">${sol.motivo || 'N/A'}</td>
            <td style="padding: 15px;">${botones}</td>
        `;
        tbody.appendChild(tr);
    });
}

async function ejecutarAccion(id, accion) {
    const id_admin = getAdminId();
    if (!id_admin) return alert("Sesión expirada.");

    let datosBody = { id_admin };
    if (accion === 'rechazar') {
        const motivo = prompt("Motivo del rechazo:");
        if (!motivo) return;
        datosBody.motivo = motivo;
    }

    try {
        const res = await fetch(`${API}/solicitudes/${accion}/${id}`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(datosBody)
        });

        if (res.ok) {
            alert("Éxito al procesar " + accion);
            cargarGestionAdmin();
        }
    } catch (e) { console.error(e); }
}

document.addEventListener('DOMContentLoaded', cargarGestionAdmin);