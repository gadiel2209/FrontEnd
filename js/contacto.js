const API = 'https://prestamos-xi.vercel.app/api'

// ─── FORMULARIO PÚBLICO ───────────────────────────────────────────
async function enviarMensaje() {
    const btnEnviar = document.querySelector('button[onclick="enviarMensaje()"]')
    const mensajeExito = document.getElementById('mensajeExito')

    const nombre  = document.getElementById('nombre').value.trim()
    const correo  = document.getElementById('correo').value.trim()
    const asuntoEl = document.getElementById('asunto')
    const asunto  = asuntoEl?.options[asuntoEl.selectedIndex]?.text || 'General'
    const mensaje = document.getElementById('mensaje').value.trim()

    if (!nombre || !correo || !mensaje) {
        alert('Por favor completa todos los campos requeridos.')
        return
    }

    btnEnviar.disabled = true
    const original = btnEnviar.innerHTML
    btnEnviar.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> ENVIANDO...'

    try {
        const res = await fetch(`${API}/contacto`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombre, correo, asunto, mensaje })
        })

        const data = await res.json()

        if (res.ok) {
            mensajeExito.style.display = 'flex'
            mensajeExito.style.background = 'rgba(34,197,94,0.1)'
            mensajeExito.style.color = '#16a34a'
            mensajeExito.innerHTML = `<i class="fas fa-circle-check"></i> ${data.message || '¡Mensaje enviado correctamente!'}`
            document.getElementById('formContacto').reset()
            setTimeout(() => mensajeExito.style.display = 'none', 5000)
        } else {
            throw new Error(data.message || 'Error en el servidor')
        }

    } catch (error) {
        console.error('Error al enviar:', error)
        alert('No se pudo enviar el mensaje: ' + error.message)
    } finally {
        btnEnviar.disabled = false
        btnEnviar.innerHTML = original
    }
}

// ─── BUZÓN ADMIN ──────────────────────────────────────────────────
let mensajesBuzon = []
let mensajeActualId     = null
let mensajeActualEmail  = null
let mensajeActualNombre = null

function verificarAdmin() {
    const token = localStorage.getItem('token')
    const idRol = localStorage.getItem('id_rol')
    if (!token || idRol !== '1') {
        window.location.href = '../login.html'
    }
}

async function obtenerMensajesServidor() {
    const token = localStorage.getItem('token')
    const lista = document.getElementById('listaMensajes')
    if (!lista) return

    lista.innerHTML = `
        <div style="text-align:center; padding:40px; color:var(--primary);">
            <i class="fas fa-circle-notch fa-spin" style="font-size:2rem;"></i>
            <p style="margin-top:10px; font-weight:600;">Cargando mensajes...</p>
        </div>`

    try {
        const res = await fetch(`${API}/contacto`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
        const data = await res.json()

        if (!res.ok) throw new Error(data.message || 'Error al obtener mensajes')

        mensajesBuzon = Array.isArray(data) ? data : []
        renderizarLista()

    } catch (error) {
        console.error('Error API:', error)
        lista.innerHTML = `
            <div style="text-align:center; padding:20px; color:#ef4444;">
                <i class="fas fa-exclamation-triangle" style="font-size:2rem;"></i>
                <p style="margin-top:10px;">No se pudo conectar con el servidor.</p>
            </div>`
    }
}

function renderizarLista() {
    const lista = document.getElementById('listaMensajes')
    lista.innerHTML = ''

    if (mensajesBuzon.length === 0) {
        lista.innerHTML = `
            <div style="text-align:center; padding:40px; color:var(--text-muted);">
                <i class="fas fa-inbox" style="font-size:2.5rem; opacity:0.3; display:block; margin-bottom:12px;"></i>
                No hay mensajes en el buzón.
            </div>`
        return
    }

    const ordenados = [...mensajesBuzon].reverse()

    ordenados.forEach(m => {
        const item = document.createElement('div')
        const tieneRespuesta = m.respuesta && m.respuesta.trim() !== ''
        item.className = `msg-item ${m.leido ? '' : 'unread'}`

        const fecha = (m.fecha || m.createdAt)
            ? new Date(m.fecha || m.createdAt).toLocaleString('es-MX')
            : 'Sin fecha'

        item.innerHTML = `
            <h4 style="margin:0 0 4px; color:var(--primary);">${m.nombre}</h4>
            <p style="margin:0 0 4px; font-size:0.85rem; color:var(--text-muted);">
                <strong>Asunto:</strong> ${m.asunto || 'Sin asunto'}
            </p>
            <div style="display:flex; justify-content:space-between; align-items:center; margin-top:6px;">
                <span style="font-size:0.75rem; color:var(--text-muted);">
                    <i class="far fa-clock"></i> ${fecha}
                </span>
                <span style="font-size:0.7rem; font-weight:700; padding:2px 8px; border-radius:20px;
                    background:${tieneRespuesta ? '#dcfce7' : '#fef9c3'};
                    color:${tieneRespuesta ? '#15803d' : '#854d0e'};">
                    ${tieneRespuesta ? '✓ Respondido' : 'Pendiente'}
                </span>
            </div>`

        item.onclick = () => mostrarDetalle(m)
        lista.appendChild(item)
    })
}

function mostrarDetalle(m) {
    const visor = document.getElementById('visorMensaje')
    m.leido = true

    const fecha = (m.fecha || m.createdAt)
        ? new Date(m.fecha || m.createdAt).toLocaleString('es-MX')
        : 'Sin fecha'

    const id = m.id_contacto || m._id

    mensajeActualId     = id
    mensajeActualEmail  = m.correo
    mensajeActualNombre = m.nombre

    const respuestaPrevia = m.respuesta || ''

    visor.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:start; gap:15px; margin-bottom:20px;">
            <div>
                <h3 style="color:var(--primary); margin-bottom:10px; font-size:1.3rem;">
                    ${(m.asunto || 'Sin asunto').toUpperCase()}
                </h3>
                <p style="margin:0 0 4px;">
                    <strong>De:</strong> ${m.nombre}
                    <span style="color:var(--accent); font-weight:700;">&lt;${m.correo}&gt;</span>
                </p>
                <p style="font-size:0.8rem; color:var(--text-muted); margin-top:5px;">
                    <i class="far fa-clock"></i> Recibido: ${fecha}
                </p>
            </div>
            <button onclick="eliminarMensaje('${id}')"
                style="background:none; border:1.5px solid #ef4444; color:#ef4444;
                       padding:8px 12px; border-radius:8px; cursor:pointer;
                       font-family:'Montserrat',sans-serif; font-weight:700; font-size:0.82rem;">
                <i class="fas fa-trash"></i>
            </button>
        </div>

        <div style="padding:20px 0; min-height:150px; color:var(--text-dark);
                    line-height:1.8; border-top:1px solid #f1f5f9; border-bottom:1px solid #f1f5f9;">
            ${m.mensaje}
        </div>

        <!-- ─── RESPUESTA YA ENVIADA (si existe) ─── -->
        ${respuestaPrevia ? `
        <div style="margin-top:20px; background:#f0fdf4; border-left:4px solid var(--primary);
                    border-radius:0 12px 12px 0; padding:14px 18px;">
            <p style="font-size:0.75rem; font-weight:700; color:var(--primary);
                      text-transform:uppercase; margin:0 0 8px;">
                <i class="fas fa-reply"></i> Respuesta enviada
                ${m.fecha_respuesta
                    ? `<span style="font-weight:400; color:#6b7280; margin-left:8px;">
                           · ${new Date(m.fecha_respuesta).toLocaleString('es-MX')}
                       </span>`
                    : ''}
            </p>
            <p style="font-size:0.9rem; color:#166534; margin:0; line-height:1.7;">${respuestaPrevia}</p>
        </div>` : ''}

        <!-- ─── SECCIÓN DE RESPUESTA ─── -->
        <div style="margin-top:24px;">
            <p style="font-size:0.85rem; color:var(--text-muted); margin:0 0 10px;">
                <i class="fas fa-reply"></i>
                ${respuestaPrevia ? 'Actualizar respuesta a:' : 'Responder a:'}
                <span style="color:var(--accent); font-weight:700;">${m.correo}</span>
            </p>

            <textarea id="campoRespuesta"
                placeholder="Escribe tu respuesta aquí..."
                rows="5"
                style="width:100%; box-sizing:border-box; resize:vertical;
                       border:1.5px solid #e2e8f0; border-radius:10px;
                       padding:14px; font-family:'Montserrat',sans-serif;
                       font-size:0.9rem; outline:none; transition:border-color 0.2s;
                       color:var(--text-dark);"
                onfocus="this.style.borderColor='var(--accent)'"
                onblur="this.style.borderColor='#e2e8f0'">${respuestaPrevia}</textarea>

            <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:12px;">
                <button onclick="document.getElementById('campoRespuesta').value=''; document.getElementById('estadoRespuesta').style.display='none';"
                    style="background:none; border:1.5px solid #cbd5e1; color:var(--text-muted);
                           padding:8px 18px; border-radius:8px; cursor:pointer;
                           font-family:'Montserrat',sans-serif; font-weight:600; font-size:0.82rem;">
                    Limpiar
                </button>
                <button onclick="enviarRespuesta()"
                    style="background:var(--primary); border:none; color:white;
                           padding:8px 20px; border-radius:8px; cursor:pointer;
                           font-family:'Montserrat',sans-serif; font-weight:700; font-size:0.82rem;
                           display:flex; align-items:center; gap:7px;">
                    <i class="fas fa-paper-plane"></i>
                    ${respuestaPrevia ? 'Actualizar respuesta' : 'Enviar respuesta'}
                </button>
            </div>

            <p id="estadoRespuesta"
               style="display:none; text-align:right; font-size:0.83rem;
                      margin-top:8px; font-weight:600;"></p>
        </div>`

    renderizarLista()
}

async function enviarRespuesta() {
    const token  = localStorage.getItem('token')
    const texto  = document.getElementById('campoRespuesta')?.value.trim()
    const estado = document.getElementById('estadoRespuesta')

    if (!texto) {
        alert('Escribe un mensaje antes de enviar.')
        return
    }

    estado.style.display = 'block'
    estado.style.color   = 'var(--primary)'
    estado.innerHTML     = '<i class="fas fa-circle-notch fa-spin"></i> Enviando...'

    try {
        // ✅ PUT /contacto/:id/responder — método y URL correctos
        const res = await fetch(`${API}/contacto/${mensajeActualId}/responder`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ respuesta: texto })
        })

        const data = await res.json()

        if (res.ok) {
            estado.style.color = '#16a34a'
            estado.innerHTML   = '<i class="fas fa-circle-check"></i> Respuesta enviada correctamente.'
            // Actualizar en memoria para que el badge cambie sin recargar
            const idx = mensajesBuzon.findIndex(m => (m.id_contacto || m._id) == mensajeActualId)
            if (idx !== -1) mensajesBuzon[idx].respuesta = texto
            renderizarLista()
        } else {
            throw new Error(data.message || 'Error en el servidor')
        }

    } catch (error) {
        console.error('Error al responder:', error)
        estado.style.color = '#ef4444'
        estado.innerHTML   = '<i class="fas fa-exclamation-triangle"></i> Error al enviar: ' + error.message
    }
}

async function eliminarMensaje(id) {
    const token = localStorage.getItem('token')

    if (!confirm('¿Eliminar este mensaje permanentemente?')) return

    try {
        const res = await fetch(`${API}/contacto/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        })

        if (res.ok) {
            mensajesBuzon      = mensajesBuzon.filter(m => (m.id_contacto || m._id) != id)
            mensajeActualId    = null
            mensajeActualEmail = null
            document.getElementById('visorMensaje').innerHTML = `
                <div style="text-align:center; margin-top:80px; color:var(--text-muted);">
                    <i class="fas fa-check-circle" style="font-size:3rem; color:var(--accent);
                       opacity:0.5; display:block; margin-bottom:12px;"></i>
                    Mensaje eliminado correctamente.
                </div>`
            renderizarLista()
        } else {
            alert('No se pudo eliminar el mensaje.')
        }
    } catch (error) {
        console.error('Error al borrar:', error)
        alert('Error de conexión al intentar borrar.')
    }
}

// ─── ARRANQUE ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    const esBuzon = document.getElementById('listaMensajes') !== null
    if (esBuzon) {
        verificarAdmin()
        obtenerMensajesServidor()
    }
})