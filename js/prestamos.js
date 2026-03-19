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
        
        // Mantenemos las llamadas a ejecutarAccion tal cual las tenías originalmente
        let botones = "";

        if (tipo === 'solicitud') {
            botones = `
                <div style="display: flex; gap: 10px;">
                    <button onclick="ejecutarAccion(${sol.id_solicitud}, 'aprobar')" 
                        style="background-color: #059669; color: white; border: none; padding: 8px 15px; border-radius: 6px; cursor: pointer; font-weight: bold;">
                        Aceptar
                    </button>
                    <button onclick="ejecutarAccion(${sol.id_solicitud}, 'rechazar')" 
                        style="background-color: #dc2626; color: white; border: none; padding: 8px 15px; border-radius: 6px; cursor: pointer; font-weight: bold;">
                        Rechazar
                    </button>
                </div>
            `;
        } else {
            botones = `
                <button onclick="ejecutarAccion(${sol.id_solicitud}, 'devolver')" 
                    style="background-color: #6366f1; color: white; border: none; padding: 8px 15px; border-radius: 6px; cursor: pointer; font-weight: bold;">
                    <i class="fas fa-undo-alt"></i> Devolver
                </button>
            `;
        }

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

    if (accion === 'aprobar') {
        const confirmar = confirm("¿Estás seguro de que deseas AUTORIZAR este préstamo?");
        if (!confirmar) return; // Si el admin cancela, no hace nada
    }
    
    if (accion === 'devolver') {
        const confirmar = confirm("¿Confirmas que el equipo ha sido devuelto?");
        if (!confirmar) return;
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