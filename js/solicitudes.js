const API = 'https://prestamos-xi.vercel.app/api';
const token = localStorage.getItem('token');

// 1. Extraer el ID del administrador desde el token JWT
function getAdminId() {
    if (!token) return null;
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.id_usuario || payload.id;
    } catch (e) {
        console.error("Error al decodificar token", e);
        return null;
    }
}

// 2. Cargar y filtrar solicitudes
async function cargarSolicitudesAdmin() {
    const tbody = document.getElementById('listaSolicitudesAdmin');
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:20px;">Cargando solicitudes activas...</td></tr>';

    try {
        const res = await fetch(`${API}/solicitudes`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!res.ok) throw new Error('No se pudo conectar con el servidor');
        
        const data = await res.json();
        // Según tu controlador, 'data' es el array directo de getAllSolicitudes
        const solicitudes = Array.isArray(data) ? data : [];

        // FILTRO: Solo Pendientes y Aprobadas (Equipos que están prestados actualmente)
        const activas = solicitudes.filter(s => s.estado === 'pendiente' || s.estado === 'aprobada');

        renderizarTabla(activas);
    } catch (error) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:20px; color:red;">${error.message}</td></tr>`;
    }
}

// 3. Dibujar la tabla
function renderizarTabla(solicitudes) {
    const tbody = document.getElementById('listaSolicitudesAdmin');
    tbody.innerHTML = '';

    if (solicitudes.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:20px;">No hay solicitudes pendientes ni préstamos activos.</td></tr>';
        return;
    }

    solicitudes.forEach(sol => {
        const usuario = sol.usuario_nombre || sol.matricula || "N/A";
        const equipo = sol.equipo_nombre || "N/A";
        const fecha = new Date(sol.fecha_solicitud).toLocaleDateString();
        
        // Estilo de badge: Naranja para pendiente, Verde para aprobada (en préstamo)
        const esPendiente = sol.estado === 'pendiente';
        const badgeStyle = esPendiente 
            ? "background: #fef3c7; color: #92400e;" 
            : "background: #dcfce7; color: #166534;";

        const tr = document.createElement('tr');
        tr.style.borderBottom = "1px solid #eee";
        tr.innerHTML = `
            <td style="padding: 15px 20px; font-weight: 600;">${usuario}</td>
            <td style="padding: 15px 20px;">${equipo}</td>
            <td style="padding: 15px 20px;">${fecha}</td>
            <td style="padding: 15px 20px;">${sol.motivo || 'N/A'}</td>
            <td style="padding: 15px 20px;">
                <span style="${badgeStyle} padding: 4px 12px; border-radius: 20px; font-size: 0.75rem; font-weight: 700;">
                    ${esPendiente ? 'PENDIENTE' : 'EN PRÉSTAMO'}
                </span>
            </td>
            <td style="padding: 15px 20px;">
                ${esPendiente ? `
                    <button onclick="ejecutarAccion(${sol.id_solicitud}, 'aprobar')" style="color:#059669; border:none; background:none; cursor:pointer; font-size:1.2rem; margin-right:8px;"><i class="fas fa-check-circle"></i></button>
                    <button onclick="ejecutarAccion(${sol.id_solicitud}, 'rechazar')" style="color:#dc2626; border:none; background:none; cursor:pointer; font-size:1.2rem; margin-right:8px;"><i class="fas fa-times-circle"></i></button>
                ` : `
                    <button onclick="ejecutarAccion(${sol.id_solicitud}, 'devolver')" style="color:#6366f1; border:none; background:none; cursor:pointer; font-size:1.2rem; margin-right:8px;" title="Marcar Devolución"><i class="fas fa-undo-alt"></i></button>
                `}
                <button style="color:#94a3b8; border:none; background:none; cursor:pointer; font-size:1rem;"><i class="fas fa-eye"></i></button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// 4. Función unificada para acciones (Aprobar, Rechazar, Devolver)
async function ejecutarAccion(id, accion) {
    const id_admin = getAdminId();
    if (!id_admin) return alert("Sesión expirada o inválida");

    if (!confirm(`¿Estás seguro de que deseas ${accion} esta solicitud?`)) return;

    // Construcción de la URL basada en tu Router: /aprobar/:id, /rechazar/:id, /devolver/:id
    const url = `${API}/solicitudes/${accion}/${id}`;
    let datosBody = { id_admin };

    if (accion === 'rechazar') {
        const motivo = prompt("Indique el motivo del rechazo:");
        if (!motivo) return; // Cancelar si no hay motivo
        datosBody.motivo = motivo;
    }

    try {
        const res = await fetch(url, {
            method: 'PUT', // Coincide con tu router.put
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(datosBody)
        });

        const data = await res.json();

        if (res.ok) {
            alert(data.message || "Operación exitosa");
            cargarSolicitudesAdmin(); // Recargar tabla
        } else {
            alert("Error: " + (data.message || "No se pudo completar la acción"));
        }
    } catch (e) {
        console.error("Error en la petición:", e);
        alert("Error de conexión con el servidor");
    }
}

document.addEventListener('DOMContentLoaded', cargarSolicitudesAdmin);