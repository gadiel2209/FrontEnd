/**
 * LOANWARE - Admin Operations Script
 * Gestiona Solicitudes, Devoluciones y Acciones de Administrador
 */

const API = 'https://prestamos-xi.vercel.app/api';
const token = localStorage.getItem('token');

// 1. Utilidad: Extraer el ID del administrador desde el token JWT
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

// 2. Función para cargar SOLICITUDES (Estado: Pendiente)
async function cargarSoloSolicitudes() {
    const tbody = document.getElementById('listaSolicitudesAdmin');
    if (!tbody) return; // No estamos en la página de solicitudes

    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:20px;">Buscando nuevas solicitudes...</td></tr>';

    try {
        const res = await fetch(`${API}/solicitudes`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!res.ok) throw new Error('Error al obtener datos del servidor');
        
        const data = await res.json();
        const solicitudes = Array.isArray(data) ? data : [];

        // Filtramos solo las que esperan aprobación
        const pendientes = solicitudes.filter(s => s.estado === 'pendiente');

        renderizarTablaGeneral(pendientes, 'solicitud');
    } catch (error) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:20px; color:red;">${error.message}</td></tr>`;
    }
}

// 3. Función para cargar DEVOLUCIONES (Estado: Aprobada/En Préstamo)
async function cargarSoloDevoluciones() {
    const tbody = document.getElementById('listaDevolucionesAdmin');
    if (!tbody) return; // No estamos en la página de devoluciones

    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:20px;">Cargando equipos en préstamo...</td></tr>';

    try {
        const res = await fetch(`${API}/solicitudes`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!res.ok) throw new Error('Error al obtener datos del servidor');

        const data = await res.json();
        const solicitudes = Array.isArray(data) ? data : [];

        // Filtramos equipos que están actualmente prestados
        const prestados = solicitudes.filter(s => s.estado === 'aprobada');

        renderizarTablaGeneral(prestados, 'devolucion');
    } catch (error) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:20px; color:red;">${error.message}</td></tr>`;
    }
}

// 4. Renderizador Universal de Tablas
function renderizarTablaGeneral(datos, tipoVista) {
    const targetId = tipoVista === 'solicitud' ? 'listaSolicitudesAdmin' : 'listaDevolucionesAdmin';
    const tbody = document.getElementById(targetId);
    
    tbody.innerHTML = '';

    if (datos.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:30px; color: var(--text-muted);">No hay registros en esta sección.</td></tr>`;
        return;
    }

    datos.forEach(sol => {
        const usuario = sol.usuario_nombre || sol.matricula || "N/A";
        const equipo = sol.equipo_nombre || "N/A";
        const fecha = new Date(sol.fecha_solicitud).toLocaleDateString();
        
        const tr = document.createElement('tr');
        tr.style.borderBottom = "1px solid #eee";
        
        // Configuración de botones y estilos según la vista
        let botonesHTML = '';
        let badgeHTML = '';

        if (tipoVista === 'solicitud') {
            badgeHTML = `<span style="background: #fef3c7; color: #92400e; padding: 4px 12px; border-radius: 20px; font-size: 0.75rem; font-weight: 700;">PENDIENTE</span>`;
            botonesHTML = `
                <button onclick="ejecutarAccion(${sol.id_solicitud}, 'aprobar')" style="color:#059669; border:none; background:none; cursor:pointer; font-size:1.2rem; margin-right:8px;" title="Aprobar"><i class="fas fa-check-circle"></i></button>
                <button onclick="ejecutarAccion(${sol.id_solicitud}, 'rechazar')" style="color:#dc2626; border:none; background:none; cursor:pointer; font-size:1.2rem; margin-right:8px;" title="Rechazar"><i class="fas fa-times-circle"></i></button>
            `;
        } else {
            badgeHTML = `<span style="background: #dcfce7; color: #166534; padding: 4px 12px; border-radius: 20px; font-size: 0.75rem; font-weight: 700;">EN PRÉSTAMO</span>`;
            botonesHTML = `
                <button onclick="ejecutarAccion(${sol.id_solicitud}, 'devolver')" style="color:#6366f1; border:none; background:none; cursor:pointer; font-size:1.2rem; margin-right:8px;" title="Marcar Devolución"><i class="fas fa-undo-alt"></i></button>
            `;
        }

        tr.innerHTML = `
            <td style="padding: 15px 20px; font-weight: 600;">${usuario}</td>
            <td style="padding: 15px 20px;">${equipo}</td>
            <td style="padding: 15px 20px;">${fecha}</td>
            <td style="padding: 15px 20px;">${sol.motivo || 'N/A'}</td>
            <td style="padding: 15px 20px;">${badgeHTML}</td>
            <td style="padding: 15px 20px;">
                ${botonesHTML}
                <button style="color:#94a3b8; border:none; background:none; cursor:pointer; font-size:1rem;" title="Ver Detalles"><i class="fas fa-eye"></i></button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// 5. Función de Ejecución de Acciones (Aprobar, Rechazar, Devolver)
async function ejecutarAccion(id, accion) {
    const id_admin = getAdminId();
    if (!id_admin) return alert("Sesión inválida. Por favor, inicia sesión de nuevo.");

    const confirmacion = confirm(`¿Estás seguro de que deseas realizar esta acción: ${accion.toUpperCase()}?`);
    if (!confirmacion) return;

    const url = `${API}/solicitudes/${accion}/${id}`;
    let datosBody = { id_admin };

    if (accion === 'rechazar') {
        const motivo = prompt("Escribe el motivo del rechazo:");
        if (!motivo) return alert("El motivo es obligatorio para rechazar.");
        datosBody.motivo = motivo;
    }

    try {
        const res = await fetch(url, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(datosBody)
        });

        const data = await res.json();

        if (res.ok) {
            alert(data.message || "Operación realizada correctamente.");
            // Recargar la vista actual
            if (document.getElementById('listaSolicitudesAdmin')) cargarSoloSolicitudes();
            if (document.getElementById('listaDevolucionesAdmin')) cargarSoloDevoluciones();
        } else {
            alert("Error: " + (data.message || "No se pudo procesar la solicitud"));
        }
    } catch (e) {
        console.error("Error en la petición:", e);
        alert("Error de conexión con el servidor.");
    }
}

// 6. Inicialización al cargar el DOM
document.addEventListener('DOMContentLoaded', () => {
    cargarSoloSolicitudes();
    cargarSoloDevoluciones();
});