/**
 * LOANWARE - Historial de movimientos (Admin)
 * GET /api/solicitudes  →  getAllSolicitudes del modelo
 * Campos que llegan: id_solicitud, estado, fecha_solicitud,
 *                    usuario_nombre, matricula, equipo_nombre, ruta_imagen
 */

const API = 'https://prestamos-xi.vercel.app/api';
const token = localStorage.getItem('token');
let todasLasSolicitudes = [];

// ─── CARGA INICIAL ────────────────────────────────────────────────
async function cargarHistorialAdmin() {
    const tbody = document.getElementById('listaHistorial');

    try {
        const res = await fetch(`${API}/solicitudes`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!res.ok) throw new Error(`Error ${res.status}`);

        // La ruta GET /solicitudes devuelve un array directo (getAllSolicitudes)
        const data = await res.json();
        todasLasSolicitudes = Array.isArray(data) ? data : [];

        if (todasLasSolicitudes.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:30px;">No hay movimientos.</td></tr>`;
            return;
        }

        renderizarTabla(todasLasSolicitudes);

    } catch (error) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:red;">Error de conexión: ${error.message}</td></tr>`;
    }
}

// ─── RENDERIZADO ──────────────────────────────────────────────────
function renderizarTabla(datos) {
    const tbody = document.getElementById('listaHistorial');
    if (!tbody) return;

    tbody.innerHTML = datos.map(s => {
        // Estilos de badge según ENUM: pendiente | aprobada | rechazada | entregada | devuelta
        const badgeMap = {
            pendiente: { bg: 'rgba(245,158,11,0.1)',  color: '#d97706', label: 'PENDIENTE'  },
            aprobada:  { bg: 'rgba(5,150,105,0.1)',   color: '#059669', label: 'PRÉSTAMO'   },
            rechazada: { bg: 'rgba(220,38,38,0.1)',   color: '#dc2626', label: 'RECHAZADA'  },
            devuelta:  { bg: 'rgba(37,99,235,0.1)',   color: '#2563eb', label: 'DEVOLUCIÓN' },
            entregada: { bg: 'rgba(14,165,233,0.1)',  color: '#0ea5e9', label: 'ENTREGADA'  },
        };
        const badge = badgeMap[s.estado] || { bg: '#f3f4f6', color: '#374151', label: s.estado.toUpperCase() };

        const fecha = new Date(s.fecha_solicitud).toLocaleString('es-MX', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });

        return `
            <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 15px;">#${s.id_solicitud}</td>
                <td style="padding: 15px;">${fecha}</td>
                <td style="padding: 15px;">
                    <div style="font-weight: 700;">${s.usuario_nombre}</div>
                    <div style="font-size: 0.75rem; color: #666;">Matrícula: ${s.matricula}</div>
                </td>
                <td style="padding: 15px; font-weight: 600;">${s.equipo_nombre}</td>
                <td style="padding: 15px;">
                    <span style="padding: 5px 12px; border-radius: 20px; font-size: 0.7rem;
                                 font-weight: 700; background:${badge.bg}; color:${badge.color};">
                        ${badge.label}
                    </span>
                </td>
                <td style="padding: 15px; text-align: center;">
                    <button onclick="imprimirTicket(${s.id_solicitud})"
                        style="border:none; background:none; color: var(--primary); cursor:pointer;">
                        <i class="fas fa-file-pdf" style="font-size: 1.2rem;"></i>
                    </button>
                </td>
            </tr>`;
    }).join('');
}

// ─── FILTROS ──────────────────────────────────────────────────────
document.getElementById('inputBusqueda')?.addEventListener('input', (e) => {
    const val = e.target.value.toLowerCase();
    const filtradas = todasLasSolicitudes.filter(s =>
        s.usuario_nombre.toLowerCase().includes(val) ||
        s.matricula.toLowerCase().includes(val) ||
        s.equipo_nombre.toLowerCase().includes(val)
    );
    renderizarTabla(filtradas);
});

document.getElementById('selectFiltro')?.addEventListener('change', (e) => {
    const estado = e.target.value;
    const filtradas = estado === 'todos'
        ? todasLasSolicitudes
        : todasLasSolicitudes.filter(s => s.estado === estado);
    renderizarTabla(filtradas);
});

// ─── TICKET ───────────────────────────────────────────────────────
function imprimirTicket(id) {
    alert("Generando ticket para la solicitud #" + id);
}

document.addEventListener('DOMContentLoaded', cargarHistorialAdmin);