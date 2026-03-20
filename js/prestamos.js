/**
 * LOANWARE - Solicitudes Pendientes (Admin)
 * GET /api/solicitudes              → filtramos por estado='pendiente'
 * PUT /api/solicitudes/aprobar/:id  → SP AprobarSolicitud
 * PUT /api/solicitudes/rechazar/:id → SP RechazarSolicitud
 */

const API = 'https://prestamos-xi.vercel.app/api'
const token = localStorage.getItem('token')

function getAdminId() {
    if (!token) return null
    try {
        const payload = JSON.parse(atob(token.split('.')[1]))
        return payload.id_usuario || payload.id
    } catch { return null }
}

// ─── CARGAR SOLICITUDES PENDIENTES ───────────────────────────────
async function cargarPrestamos() {
    const tbody = document.getElementById('listaSolicitudesAdmin')
    if (!tbody) return

    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:50px; color:var(--text-muted);">
        <i class="fas fa-circle-notch fa-spin" style="font-size:1.5rem; color:var(--primary); display:block; margin-bottom:10px;"></i>
        Cargando solicitudes...
    </td></tr>`

    try {
        const res = await fetch(`${API}/solicitudes`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
        if (!res.ok) throw new Error(`Error ${res.status}`)

        const solicitudes = await res.json()
        const pendientes = solicitudes.filter(s => s.estado === 'pendiente')

        // Actualizar contadores
        const numHero = document.getElementById('numPendientes')
        const contador = document.getElementById('contadorPendientes')
        if (numHero) numHero.textContent = pendientes.length
        if (contador) {
            contador.textContent = pendientes.length === 0
                ? 'Sin solicitudes pendientes'
                : `${pendientes.length} solicitud${pendientes.length !== 1 ? 'es' : ''} pendiente${pendientes.length !== 1 ? 's' : ''}`
        }

        renderizarTabla(pendientes, tbody)

    } catch (error) {
        tbody.innerHTML = `<tr><td colspan="6" style="color:#ef4444; text-align:center; padding:40px;">
            <i class="fas fa-triangle-exclamation" style="font-size:1.5rem; display:block; margin-bottom:10px;"></i>
            Error al cargar: ${error.message}
        </td></tr>`
    }
}

// ─── RENDER ───────────────────────────────────────────────────────
function renderizarTabla(datos, tbody) {
    if (datos.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:60px; color:var(--text-muted);">
            <i class="fas fa-inbox" style="font-size:2.5rem; opacity:0.3; display:block; margin-bottom:12px;"></i>
            No hay solicitudes pendientes por revisar.
        </td></tr>`
        return
    }

    tbody.innerHTML = datos.map((sol, i) => {
        const nombreUsuario = sol.usuario_nombre || sol.nombre || '—'
        const matricula = sol.matricula || sol.usuario || '—'
        const nombreEquipo = sol.equipo_nombre || sol.equipo || '—'
        const imagen = sol.ruta_imagen || 'https://placehold.co/44x44?text=?'
        const fecha = new Date(sol.fecha_solicitud).toLocaleDateString('es-MX', {
            day: '2-digit', month: 'short', year: 'numeric'
        })

        return `
        <tr style="animation-delay:${i * 0.05}s">
            <td style="color:var(--text-muted); font-weight:700;">#${sol.id_solicitud}</td>
            <td>
                <p style="margin:0; font-weight:700; color:var(--text-dark);">${nombreUsuario}</p>
                <p style="margin:3px 0 0; font-size:0.75rem; color:var(--text-muted);">
                    <i class="fas fa-id-badge" style="color:var(--accent);"></i> ${matricula}
                </p>
            </td>
            <td>
                <div style="display:flex; align-items:center; gap:12px;">
                    <img src="${imagen}" alt="${nombreEquipo}"
                        style="width:44px; height:44px; object-fit:contain; border-radius:8px;
                               background:#f1f5f9; padding:4px; flex-shrink:0;"
                        onerror="this.src='https://placehold.co/44x44?text=?'">
                    <span style="font-weight:600; color:var(--text-dark);">${nombreEquipo}</span>
                </div>
            </td>
            <td style="color:var(--text-muted);">${fecha}</td>
            <td>
                <span class="badge-pendiente">
                    <i class="fas fa-clock"></i> Pendiente
                </span>
            </td>
            <td style="text-align:center;">
                <div style="display:flex; gap:8px; justify-content:center;">
                    <button class="btn-aprobar"
                        onclick="ejecutarAccion(${sol.id_solicitud}, 'aprobar', this)">
                        <i class="fas fa-check"></i> Aprobar
                    </button>
                    <button class="btn-rechazar"
                        onclick="ejecutarAccion(${sol.id_solicitud}, 'rechazar', this)">
                        <i class="fas fa-times"></i> Rechazar
                    </button>
                </div>
            </td>
        </tr>`
    }).join('')
}

// ─── EJECUTAR ACCIÓN ──────────────────────────────────────────────
async function ejecutarAccion(id_solicitud, accion, btnClicked) {
    const id_admin = getAdminId()
    if (!id_admin) { alert('Sesión expirada.'); return }

    let datosBody = { id_admin }
    let motivo = null

    if (accion === 'rechazar') {
        motivo = prompt('Motivo del rechazo:')
        if (!motivo || motivo.trim() === '') return
        datosBody.motivo = motivo.trim()
    }

    const fila = btnClicked.closest('tr')
    fila.querySelectorAll('button').forEach(b => {
        b.disabled = true
        b.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i>'
    })

    try {
        const res = await fetch(`${API}/solicitudes/${accion}/${id_solicitud}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(datosBody)
        })

        const data = await res.json()
        if (!res.ok) throw new Error(data.message || `Error ${res.status}`)

        await enviarNotificacion(id_solicitud, accion, motivo)

        // Animación salida de fila
        fila.style.transition = 'all 0.3s ease'
        fila.style.opacity = '0'
        fila.style.transform = 'translateX(20px)'
        setTimeout(() => cargarPrestamos(), 320)

    } catch (e) {
        alert('Error: ' + e.message)
        fila.querySelectorAll('button').forEach(b => b.disabled = false)
        cargarPrestamos()
    }
}

// ─── ENVIAR NOTIFICACIÓN ──────────────────────────────────────────
async function enviarNotificacion(id_solicitud, accion, motivo = null) {
    try {
        const res = await fetch(`${API}/solicitudes/${id_solicitud}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
        if (!res.ok) return

        const sol = await res.json()

        const nombre_usuario = sol.nombre || sol.usuario_nombre || 'Usuario'
        const correo_usuario = sol.correo || null
        const nombre_equipo = sol.equipo || sol.equipo_nombre || 'Equipo'

        if (!correo_usuario) {
            console.warn('No se encontró correo del usuario')
            return
        }

        if (accion === 'aprobar') {
            await enviarCorreoAprobacion({ correo_usuario, nombre_usuario, nombre_equipo, id_solicitud })
        } else {
            await enviarCorreoRechazo({ correo_usuario, nombre_usuario, nombre_equipo, id_solicitud, motivo })
        }

    } catch (err) {
        console.error('Error enviando notificación:', err)
    }
}

document.addEventListener('DOMContentLoaded', cargarPrestamos)