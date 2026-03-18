/**
 * LOANWARE - User Requests Script
 * Vista para el usuario común: Consulta de sus propias solicitudes
 */

const API = 'https://prestamos-xi.vercel.app/api';
const token = localStorage.getItem('token');

// Cargar solicitudes del usuario logueado
async function cargarMisSolicitudes() {
    const tbody = document.getElementById('listaSolicitudesUsuario');
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:20px;">Cargando tus solicitudes...</td></tr>';

    try {
        const res = await fetch(`${API}/solicitudes`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!res.ok) throw new Error('Error al obtener tus datos');
        
        const data = await res.json();
        const solicitudes = Array.isArray(data) ? data : [];

        renderizarTablaUsuario(solicitudes);
    } catch (error) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:20px; color:red;">${error.message}</td></tr>`;
    }
}

function renderizarTablaUsuario(datos) {
    const tbody = document.getElementById('listaSolicitudesUsuario');
    tbody.innerHTML = '';

    if (datos.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:30px;">No tienes solicitudes registradas.</td></tr>`;
        return;
    }

    datos.forEach(sol => {
        const equipo = sol.equipo_nombre || "N/A";
        const fecha = new Date(sol.fecha_solicitud).toLocaleDateString();
        
        // Estilo de badge según estado
        let color = sol.estado === 'pendiente' ? '#92400e' : (sol.estado === 'aprobada' ? '#166534' : '#dc2626');
        let bg = sol.estado === 'pendiente' ? '#fef3c7' : (sol.estado === 'aprobada' ? '#dcfce7' : '#fee2e2');

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="padding: 15px;">${equipo}</td>
            <td style="padding: 15px;">${fecha}</td>
            <td style="padding: 15px;">${sol.motivo || 'N/A'}</td>
            <td style="padding: 15px;">
                <span style="background: ${bg}; color: ${color}; padding: 4px 12px; border-radius: 20px; font-size: 0.75rem; font-weight: 700;">
                    ${sol.estado.toUpperCase()}
                </span>
            </td>
            <td style="padding: 15px; color: #64748b;">${sol.comentario_admin || '-'}</td>
        `;
        tbody.appendChild(tr);
    });
}

document.addEventListener('DOMContentLoaded', cargarMisSolicitudes);