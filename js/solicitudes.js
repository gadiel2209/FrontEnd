const API = 'https://prestamos-xi.vercel.app/api';
let todasLasSolicitudes = [];

async function cargarHistorialAdmin() {
    const tbody = document.getElementById('listaHistorial');
    const token = localStorage.getItem('token');

    try {
        const res = await fetch(`${API}/solicitudes`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const data = await res.json();
        // Basado en getAllSolicitudes del modelo
        todasLasSolicitudes = Array.isArray(data) ? data : (data.solicitudes || []);

        if (todasLasSolicitudes.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:30px;">No hay movimientos.</td></tr>`;
            return;
        }

        renderizarTabla(todasLasSolicitudes);

    } catch (error) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:red;">Error de conexión.</td></tr>`;
    }
}

function renderizarTabla(datos) {
    const tbody = document.getElementById('listaHistorial');
    if (!tbody) return;

    tbody.innerHTML = datos.map(s => {
        // Estilos de badge según tu ENUM de base de datos
        let badgeStyle = "background: #f3f4f6; color: #374151;";
        let textoTipo = s.estado.toUpperCase();

        if (s.estado === 'aprobada') {
            badgeStyle = "background: rgba(5, 150, 105, 0.1); color: #059669;";
            textoTipo = "PRÉSTAMO";
        } else if (s.estado === 'devuelta') {
            badgeStyle = "background: rgba(37, 99, 235, 0.1); color: #2563eb;";
            textoTipo = "DEVOLUCIÓN";
        } else if (s.estado === 'rechazada') {
            badgeStyle = "background: rgba(220, 38, 38, 0.1); color: #dc2626;";
        }

        // Formatear Fecha
        const fecha = new Date(s.fecha_solicitud).toLocaleString('es-MX', {
            day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
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
                    <span style="padding: 5px 12px; border-radius: 20px; font-size: 0.7rem; font-weight: 700; ${badgeStyle}">
                        ${textoTipo}
                    </span>
                </td>
                <td style="padding: 15px; text-align: center;">
                    <button onclick="imprimirTicket(${s.id_solicitud})" style="border:none; background:none; color: var(--primary); cursor:pointer;">
                        <i class="fas fa-file-pdf" style="font-size: 1.2rem;"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

// Filtro de texto (Nombre o Matrícula)
document.getElementById('inputBusqueda')?.addEventListener('input', (e) => {
    const val = e.target.value.toLowerCase();
    const filtradas = todasLasSolicitudes.filter(s => 
        s.usuario_nombre.toLowerCase().includes(val) || 
        s.matricula.toLowerCase().includes(val) ||
        s.equipo_nombre.toLowerCase().includes(val)
    );
    renderizarTabla(filtradas);
});

// Filtro por Estado
document.getElementById('selectFiltro')?.addEventListener('change', (e) => {
    const estado = e.target.value;
    const filtradas = estado === 'todos' 
        ? todasLasSolicitudes 
        : todasLasSolicitudes.filter(s => s.estado === estado);
    renderizarTabla(filtradas);
});

document.addEventListener('DOMContentLoaded', cargarHistorialAdmin);

function imprimirTicket(id) {
    alert("Generando ticket para la solicitud #" + id);
}