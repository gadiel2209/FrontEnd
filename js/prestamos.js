const API = 'https://prestamos-xi.vercel.app/api';
const token = localStorage.getItem('token');

function getAdminId() {
    const token = localStorage.getItem('token');
    if (!token) return null;
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        // Asegúrate de usar la clave exacta que viene en tu token (id o id_usuario)
        return payload.id || payload.id_usuario; 
    } catch (e) {
        return null;
    }
}

async function cargarGestionAdmin() {
    try {
        const res = await fetch(`${API}/solicitudes`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) return;

        const solicitudes = await res.json();
        const pendientes = solicitudes.filter(s => s.estado === 'pendiente');
        const aprobadas = solicitudes.filter(s => s.estado === 'aprobada');

        renderizarTablaAdmin(pendientes, 'listaSolicitudesAdmin', 'solicitud');
        // Si tienes una tabla de devoluciones, usa esta línea:
        // renderizarTablaAdmin(aprobadas, 'listaDevolucionesAdmin', 'devolucion');
    } catch (e) { console.error("Error al cargar:", e); }
}

function renderizarTablaAdmin(datos, targetId, tipo) {
    const tbody = document.getElementById(targetId);
    if (!tbody) return;
    tbody.innerHTML = '';

    if (datos.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align:center; padding:50px; background-color: #f9fafb;">
                    <i class="fas fa-check-circle" style="font-size: 2rem; color: #9ca3af; display: block; margin-bottom: 10px;"></i>
                    <p style="color: #6b7280; font-weight: 500;">No hay ${tipo === 'solicitud' ? 'solicitudes' : 'préstamos'} pendientes.</p>
                </td>
            </tr>`;
        return;
    }

    datos.forEach(sol => {
        const tr = document.createElement('tr');
        let botones = tipo === 'solicitud' ? `
            <div style="display: flex; gap: 10px;">
                <button onclick="ejecutarAccion(${sol.id_solicitud}, 'aprobar')" style="background-color: #059669; color: white; border: none; padding: 8px 15px; border-radius: 6px; cursor: pointer;">Aceptar</button>
                <button onclick="ejecutarAccion(${sol.id_solicitud}, 'rechazar')" style="background-color: #dc2626; color: white; border: none; padding: 8px 15px; border-radius: 6px; cursor: pointer;">Rechazar</button>
            </div>` : 
            `<button onclick="ejecutarAccion(${sol.id_solicitud}, 'devolver')" style="background-color: #6366f1; color: white; border: none; padding: 8px 15px; border-radius: 6px; cursor: pointer;">Devolver</button>`;

        tr.innerHTML = `
            <td style="padding: 15px;"><b>${sol.usuario_nombre || sol.matricula}</b></td>
            <td style="padding: 15px;">${sol.equipo_nombre}</td>
            <td style="padding: 15px;">${new Date(sol.fecha_solicitud).toLocaleDateString()}</td>
            <td style="padding: 15px;">${sol.estado.toUpperCase()}</td>
            <td style="padding: 15px;">${botones}</td>
        `;
        tbody.appendChild(tr);
    });
}

async function ejecutarAccion(id, accion) {
    const id_admin = getAdminId(); // Esto saca el "5" de tu token
    if (!id_admin) return alert("Sesión expirada");

    try {
        const res = await fetch(`${API}/solicitudes/${accion}/${id}`, {
            method: 'PUT',
            headers: { 
                'Authorization': `Bearer ${token}`, 
                'Content-Type': 'application/json' 
            },
            body: JSON.stringify({ id_admin }) // Enviamos el ID 5 al servidor
        });

        if (res.ok) {
            // ¡ESTO ES LO MÁS IMPORTANTE!
            // Si la API responde OK, volvemos a cargar la lista para que la fila desaparezca
            await cargarGestionAdmin(); 
        } else {
            const errorData = await res.json();
            alert("Error: " + errorData.message);
        }
    } catch (e) {
        console.error("Error de conexión:", e);
    }
}

document.addEventListener('DOMContentLoaded', cargarGestionAdmin);