const API = 'https://prestamos-xi.vercel.app/api';

// ─── FUNCIONES DE APOYO ───────────────────────────────────────
function getUsuarioFromToken() {
    const token = localStorage.getItem('token');
    if (!token) return null;
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        return JSON.parse(window.atob(base64));
    } catch (e) { return null; }
}

// ─── CARGAR SOLICITUDES ADMIN ──────────────────────────────────
async function cargarSolicitudesAdmin() {
    const tabla = document.getElementById('listaSolicitudesAdmin');
    if (!tabla) return; 

    const token = localStorage.getItem('token');
    if (!token) {
        console.error("No hay token de sesión");
        return;
    }

    try {
        const res = await fetch(`${API}/solicitudes`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();

        if (!res.ok) throw new Error(data.message || "Error en servidor");

        const solicitudes = data.solicitudes || [];
        tabla.innerHTML = ''; 

        if (solicitudes.length === 0) {
            tabla.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:20px;">No hay solicitudes pendientes.</td></tr>`;
            return;
        }

        solicitudes.forEach(s => {
            const fecha = s.fecha_solicitud ? new Date(s.fecha_solicitud).toLocaleDateString('es-MX') : 'S/F';
            
            // Colores según tu diseño original
            let badgeStyle = "background: rgba(26, 57, 42, 0.1); color: var(--primary);"; 
            if (s.estado === 'aprobada') badgeStyle = "background: rgba(9, 255, 0, 0.2); color: #047857;";
            if (s.estado === 'rechazada') badgeStyle = "background: rgba(220, 38, 38, 0.1); color: #dc2626;";
            if (s.estado === 'devuelta') badgeStyle = "background: rgba(99, 102, 241, 0.1); color: #6366f1;";

            const acciones = s.estado === 'pendiente' 
                ? `<button onclick="gestionarSolicitud(${s.id_solicitud}, 'aprobar')" style="border: none; background: none; color: #059669; cursor: pointer; font-size: 1.1rem; margin-right: 10px;"><i class="fas fa-check-circle"></i></button>
                   <button onclick="gestionarSolicitud(${s.id_solicitud}, 'rechazar')" style="border: none; background: none; color: #dc2626; cursor: pointer; font-size: 1.1rem; margin-right: 10px;"><i class="fas fa-times-circle"></i></button>`
                : `<i class="fas fa-lock" style="color: #ccc; margin-right:10px;"></i>`;

            // IMPORTANTE: Ajustamos s.nombre_usuario y s.nombre_equipo según lo que devuelve tu JOIN en SQL
            tabla.innerHTML += `
                <tr style="border-bottom: 1px solid #eee;">
                    <td style="padding: 15px 20px; font-weight: 600;">${s.matricula || s.nombre_usuario || s.id_usuario}</td>
                    <td style="padding: 15px 20px;">${s.nombre_equipo || s.equipo || 'Equipo Desconocido'}</td>
                    <td style="padding: 15px 20px;">${fecha}</td>
                    <td style="padding: 15px 20px;">${s.motivo || 'N/A'}</td>
                    <td style="padding: 15px 20px;">
                        <span class="badge" style="${badgeStyle} padding: 5px 10px; border-radius: 12px; font-size: 0.75rem; font-weight: bold;">
                            ${s.estado.toUpperCase()}
                        </span>
                    </td>
                    <td style="padding: 15px 20px;">
                        ${acciones}
                        <button style="border: none; background: none; color: var(--text-muted); cursor: pointer; font-size: 1.1rem;"><i class="fas fa-eye"></i></button>
                    </td>
                </tr>
            `;
        });

    } catch (error) {
        console.error("Error:", error);
        tabla.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:20px; color:red;">Error al cargar: ${error.message}</td></tr>`;
    }
}

// ─── GESTIONAR SOLICITUD ───────────────────────────────────────
async function gestionarSolicitud(id, accion) {
    const token = localStorage.getItem('token');
    const usuario = getUsuarioFromToken();
    const id_admin = usuario?.id_usuario || usuario?.id;

    let motivo = "";
    if (accion === 'rechazar') {
        motivo = prompt("Escriba el motivo del rechazo:");
        if (motivo === null) return;
    }

    if (!confirm(`¿Estás seguro de que deseas ${accion} esta solicitud?`)) return;

    try {
        const res = await fetch(`${API}/solicitudes/${accion}/${id}`, {
            method: 'PUT',
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ id_admin, motivo })
        });

        if (res.ok) {
            alert(`Solicitud ${accion === 'aprobar' ? 'aprobada' : 'rechazada'} correctamente`);
            cargarSolicitudesAdmin(); 
        } else {
            const err = await res.json();
            alert(`Error: ${err.message}`);
        }
    } catch (err) {
        alert("Error de conexión con el servidor");
    }
}

// ─── CARGAR SOLICITUDES USUARIO (Si aplica) ─────────────────────
async function cargarSolicitudesUsuario() {
    const contenedor = document.getElementById('contenedorSolicitudes');
    if (!contenedor) return; 

    const usuario = getUsuarioFromToken();
    const token = localStorage.getItem('token');
    const idFinal = usuario?.id_usuario || usuario?.id;

    try {
        const res = await fetch(`${API}/solicitudes/usuario/${idFinal}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok) {
            // Aquí llamarías a tu función de renderizado de usuario
            console.log("Datos de usuario cargados");
        }
    } catch (error) { console.error(error); }
}

// ─── ÚNICA INICIALIZACIÓN ───────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    cargarSolicitudesAdmin();
    cargarSolicitudesUsuario();
});