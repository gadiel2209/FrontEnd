const API   = 'https://prestamos-xi.vercel.app/api'
const token = localStorage.getItem('token')

let todasLasSolicitudes = []

async function cargarHistorial() {
    const tbody = document.getElementById('listaHistorial')
    try {
        const res = await fetch(`${API}/solicitudes`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
        if (!res.ok) throw new Error(`Error ${res.status}`)

        todasLasSolicitudes = await res.json()
        renderizarHistorial(todasLasSolicitudes)

        // Eventos de filtro
        document.getElementById('selectFiltro').addEventListener('change', aplicarFiltros)
        document.getElementById('inputBusqueda').addEventListener('input', aplicarFiltros)

    } catch (error) {
        tbody.innerHTML = `<tr><td colspan="6" style="padding:40px; text-align:center; color:#ef4444;">
            <i class="fas fa-triangle-exclamation"></i> Error: ${error.message}
        </td></tr>`
    }
}

function aplicarFiltros() {
    const estado   = document.getElementById('selectFiltro').value
    const busqueda = document.getElementById('inputBusqueda').value.toLowerCase()

    const filtradas = todasLasSolicitudes.filter(s => {
        const coincideEstado   = estado === 'todos' || s.estado === estado
        const coincideBusqueda = !busqueda ||
            (s.usuario_nombre || '').toLowerCase().includes(busqueda) ||
            (s.matricula      || '').toLowerCase().includes(busqueda) ||
            (s.equipo_nombre  || '').toLowerCase().includes(busqueda)
        return coincideEstado && coincideBusqueda
    })

    renderizarHistorial(filtradas)
}

function renderizarHistorial(solicitudes) {
    const tbody = document.getElementById('listaHistorial')

    if (solicitudes.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="padding:50px; text-align:center; color:var(--text-muted);">
            <i class="fas fa-inbox" style="font-size:2rem; opacity:0.3; display:block; margin-bottom:12px;"></i>
            No hay registros.
        </td></tr>`
        return
    }

    const colores = {
        aprobada:  { color: '#22c55e', label: 'Préstamo'    },
        devuelta:  { color: '#6366f1', label: 'Devolución'  },
        rechazada: { color: '#ef4444', label: 'Rechazada'   },
        pendiente: { color: '#f59e0b', label: 'Pendiente'   },
    }

    tbody.innerHTML = solicitudes.map(s => {
        const cfg   = colores[s.estado] || { color: '#94a3b8', label: s.estado }
        const fecha = new Date(s.fecha_solicitud).toLocaleDateString('es-MX', {
            day: '2-digit', month: 'short', year: 'numeric'
        })
        return `
        <tr style="border-bottom:1px solid #f1f5f9;" 
            onmouseover="this.style.background='#f8fafc'" 
            onmouseout="this.style.background=''">
            <td style="padding:14px 15px; color:var(--text-muted); font-weight:700;">#${s.id_solicitud}</td>
            <td style="padding:14px 15px; color:var(--text-muted);">${fecha}</td>
            <td style="padding:14px 15px;">
                <p style="margin:0; font-weight:700;">${s.usuario_nombre || '—'}</p>
                <p style="margin:2px 0 0; font-size:0.75rem; color:var(--text-muted);">${s.matricula || ''}</p>
            </td>
            <td style="padding:14px 15px; font-weight:600;">${s.equipo_nombre || '—'}</td>
            <td style="padding:14px 15px;">
                <span style="background:${cfg.color}22; color:${cfg.color};
                    padding:4px 12px; border-radius:20px; font-size:0.78rem; font-weight:700;">
                    ${cfg.label}
                </span>
            </td>
            <td style="padding:14px 15px; text-align:center;">
                <span style="color:var(--text-muted); font-size:0.8rem;">#${s.id_solicitud}</span>
            </td>
        </tr>`
    }).join('')
}

document.addEventListener('DOMContentLoaded', cargarHistorial)