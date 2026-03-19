/**
 * LOANWARE - Gestión de Devoluciones (Equipos en Préstamo)
 */
const API = 'https://prestamos-xi.vercel.app/api';
const token = localStorage.getItem('token');

function getAdminId() {
    if (!token) return null;
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.id_usuario || payload.id; // ← puede no coincidir con tu JWT
    } catch (e) { return null; }
}

async function cargarPrestamosActivos() {
    const tbody = document.getElementById('listaDevolucionesAdmin');
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:20px;">Cargando préstamos activos...</td></tr>';

    try {
        const res = await fetch(`${API}/solicitudes`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        // Solo los que están aprobados (en manos del usuario)
        const activos = data.filter(s => s.estado === 'aprobada');

        renderizarTablaDevoluciones(activos, tbody);
    } catch (error) {
        tbody.innerHTML = `<tr><td colspan="6" style="color:red; text-align:center;">Error al cargar datos</td></tr>`;
    }
}

function renderizarTablaDevoluciones(datos, tbody) {
    tbody.innerHTML = '';
    if (datos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:20px;">No hay equipos pendientes de devolución.</td></tr>';
        return;
    }

    datos.forEach(sol => {
        const tr = document.createElement('tr');
        tr.style.borderBottom = "1px solid #eee";
        tr.innerHTML = `
            <td style="padding:15px 20px; font-weight:600;">${sol.usuario_nombre || sol.id_usuario}</td>
            <td style="padding:15px 20px;">${sol.equipo_nombre}</td>
            <td style="padding:15px 20px;">${new Date(sol.fecha_solicitud).toLocaleDateString()}</td>
            <td style="padding:15px 20px;">${sol.motivo || 'N/A'}</td>
            <td style="padding:15px 20px;"><span class="badge" style="background:#dcfce7; color:#166534; padding:5px 10px; border-radius:15px;">EN PRÉSTAMO</span></td>
            <td style="padding:15px 20px;">
                <button onclick="confirmarDevolucion(${sol.id_solicitud})" style="color:#6366f1; border:none; background:none; cursor:pointer; font-size:1.2rem;" title="Registrar Devolución">
                    <i class="fas fa-undo-alt"></i> Recibir Equipo
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

async function confirmarDevolucion(id) {
    const id_admin = getAdminId();
    
    // AGREGA ESTA VERIFICACIÓN
    if (!id_admin) {
        alert("No se pudo obtener el ID del administrador. Vuelve a iniciar sesión.");
        return;
    }
    
    if (!confirm("¿Confirma que el equipo ha sido devuelto físicamente?")) return;

    try {
        const res = await fetch(`${API}/solicitudes/devolver/${id}`, {
            method: 'PUT',
            headers: { 
                'Authorization': `Bearer ${token}`, 
                'Content-Type': 'application/json' 
            },
            body: JSON.stringify({ id_admin })
        });

        // AGREGA ESTO PARA VER EL ERROR EXACTO
        const data = await res.json();
        console.log('Respuesta del servidor:', data);

        if (res.ok) {
            alert("Devolución registrada con éxito");
            cargarPrestamosActivos();
        } else {
            alert("Error: " + data.message);
        }
    } catch (e) { 
        alert("Error al procesar devolución: " + e.message); 
    }
}
document.addEventListener('DOMContentLoaded', cargarPrestamosActivos);