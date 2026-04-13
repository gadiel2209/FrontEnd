const API = 'https://prestamos-xi.vercel.app/api'

let mensajesUsuario = []

// ─── ARRANQUE ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    verificarSesion()
    obtenerMensajesUsuario()
})

// ─── VERIFICAR SESIÓN ─────────────────────────────────────────────
function verificarSesion() {
    const token = localStorage.getItem('token')
    if (!token) {
        window.location.href = '../login.html'
    }
}

// ─── OBTENER MENSAJES DEL USUARIO ────────────────────────────────
async function obtenerMensajesUsuario() {
    const token  = localStorage.getItem('token')
    const correo = localStorage.getItem('correo') // correo guardado al iniciar sesión
    const lista  = document.getElementById('listaMensajesUsuario')

    lista.innerHTML = `
        <div style="text-align:center; padding:40px; color:var(--primary);">
            <i class="fas fa-circle-notch fa-spin" style="font-size:2rem;"></i>
            <p style="margin-top:10px; font-weight:600; font-size:0.88rem;">Cargando mensajes...</p>
        </div>`

    try {
        // El endpoint filtra por el correo/id del usuario autenticado
        const res = await fetch(`${API}/contacto/mis-mensajes`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
        const data = await res.json()

        if (!res.ok) throw new Error(data.message || 'Error al obtener mensajes')

        mensajesUsuario = Array.isArray(data) ? data : []
        renderizarListaUsuario()

    } catch (error) {
        console.error('Error API:', error)
        lista.innerHTML = `
            <div style="text-align:center; padding:20px; color:#ef4444;">
                <i class="fas fa-exclamation-triangle" style="font-size:2rem;"></i>
                <p style="margin-top:10px; font-size:0.85rem;">No se pudo conectar con el servidor.</p>
            </div>`
    }
}

// ─── RENDERIZAR LISTA ─────────────────────────────────────────────
function renderizarListaUsuario() {
    const lista = document.getElementById('listaMensajesUsuario')
    lista.innerHTML = ''

    if (mensajesUsuario.length === 0) {
        lista.innerHTML = `
            <div class="lista-empty">
                <i class="fas fa-inbox"></i>
                <p>Aún no has enviado ningún mensaje.</p>
                <p style="margin-top:6px; font-size:0.8rem;">Usa el botón <strong>Nuevo mensaje</strong> para contactar al administrador.</p>
            </div>`
        return
    }

    const ordenados = [...mensajesUsuario].reverse()

    ordenados.forEach(m => {
        const item = document.createElement('div')
        const id   = m.id_contacto || m._id
        const fecha = (m.fecha || m.createdAt)
            ? new Date(m.fecha || m.createdAt).toLocaleString('es-MX')
            : 'Sin fecha'

        // Estado: si tiene respuesta del admin → respondido, si no → enviado/pendiente
        const tieneRespuesta = m.respuesta && m.respuesta.trim() !== ''
        const badgeClass  = tieneRespuesta ? 'badge-respondido' : 'badge-pendiente'
        const badgeTexto  = tieneRespuesta ? 'Respondido' : 'Pendiente'
        const badgeIcon   = tieneRespuesta ? 'fa-circle-check' : 'fa-clock'

        item.className = 'msg-item'
        item.dataset.id = id
        item.innerHTML = `
            <span class="msg-badge ${badgeClass}">
                <i class="fas ${badgeIcon}"></i> ${badgeTexto}
            </span>
            <h4 style="margin:0 0 4px; color:var(--primary); font-size:0.92rem;">
                ${m.asunto || 'Sin asunto'}
            </h4>
            <p style="margin:0; font-size:0.78rem; color:var(--text-muted);
                      white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:260px;">
                ${m.mensaje || ''}
            </p>
            <span style="font-size:0.72rem; color:var(--text-muted); display:block; margin-top:8px;">
                <i class="far fa-clock"></i> ${fecha}
            </span>`

        item.onclick = () => {
            document.querySelectorAll('.msg-item').forEach(i => i.classList.remove('activo'))
            item.classList.add('activo')
            mostrarDetalleUsuario(m)
        }

        lista.appendChild(item)
    })
}

// ─── MOSTRAR DETALLE ──────────────────────────────────────────────
function mostrarDetalleUsuario(m) {
    const placeholder = document.getElementById('visorPlaceholder')
    const contenido   = document.getElementById('visorContenidoUsuario')

    placeholder.style.display = 'none'
    contenido.style.display   = 'flex'

    const fecha = (m.fecha || m.createdAt)
        ? new Date(m.fecha || m.createdAt).toLocaleString('es-MX')
        : 'Sin fecha'

    const tieneRespuesta = m.respuesta && m.respuesta.trim() !== ''

    const bloqueRespuesta = tieneRespuesta
        ? `<div class="respuesta-admin">
               <div class="resp-label">
                   <i class="fas fa-reply"></i> Respuesta del administrador
               </div>
               <div class="resp-texto">${m.respuesta}</div>
               ${m.fecha_respuesta
                   ? `<p style="font-size:0.72rem; color:#86efac; margin:8px 0 0;">
                          <i class="far fa-clock"></i>
                          ${new Date(m.fecha_respuesta).toLocaleString('es-MX')}
                      </p>`
                   : ''}
           </div>`
        : `<div style="margin-top:24px; background:#fefce8; border-left:4px solid #facc15;
                       border-radius:0 12px 12px 0; padding:14px 18px;">
               <p style="font-size:0.83rem; color:#854d0e; margin:0; display:flex; align-items:center; gap:8px;">
                   <i class="fas fa-hourglass-half"></i>
                   Tu mensaje está siendo revisado. Recibirás una respuesta pronto.
               </p>
           </div>`

    contenido.innerHTML = `
        <div class="visor-header">
            <h3 class="visor-asunto">${(m.asunto || 'Sin asunto').toUpperCase()}</h3>
            <div class="visor-meta">
                <span><i class="far fa-clock"></i> Enviado: ${fecha}</span>
                <span>
                    ${tieneRespuesta
                        ? '<span style="color:#16a34a; font-weight:700;"><i class="fas fa-circle-check"></i> Respondido</span>'
                        : '<span style="color:#b45309; font-weight:700;"><i class="fas fa-clock"></i> Pendiente de respuesta</span>'}
                </span>
            </div>
        </div>

        <div class="visor-cuerpo">${m.mensaje}</div>

        ${bloqueRespuesta}`
}

// ─── MODAL NUEVO MENSAJE ──────────────────────────────────────────
function abrirModal() {
    document.getElementById('modalNuevo').classList.add('activo')
    document.getElementById('modalAsunto').value  = ''
    document.getElementById('modalMensaje').value = ''
    const est = document.getElementById('estadoModal')
    est.style.display = 'none'
    est.textContent   = ''
}

function cerrarModal() {
    document.getElementById('modalNuevo').classList.remove('activo')
}

// Cerrar al hacer clic fuera del modal
document.getElementById('modalNuevo').addEventListener('click', function(e) {
    if (e.target === this) cerrarModal()
})

// ─── ENVIAR NUEVO MENSAJE ─────────────────────────────────────────
async function enviarNuevoMensaje() {
    const token   = localStorage.getItem('token')
    const nombre  = localStorage.getItem('nombre')  || ''
    const correo  = localStorage.getItem('correo')  || ''

    const asuntoEl = document.getElementById('modalAsunto')
    const asunto   = asuntoEl.options[asuntoEl.selectedIndex]?.text || 'General'
    const mensaje  = document.getElementById('modalMensaje').value.trim()

    const estado = document.getElementById('estadoModal')

    if (!mensaje) {
        alert('Por favor escribe un mensaje antes de enviar.')
        return
    }

    estado.style.display = 'block'
    estado.style.color   = 'var(--primary)'
    estado.innerHTML     = '<i class="fas fa-circle-notch fa-spin"></i> Enviando...'

    try {
        const res = await fetch(`${API}/contacto`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ nombre, correo, asunto, mensaje })
        })

        const data = await res.json()

        if (res.ok) {
            estado.style.color = '#16a34a'
            estado.innerHTML   = '<i class="fas fa-circle-check"></i> Mensaje enviado correctamente.'
            document.getElementById('modalAsunto').value  = ''
            document.getElementById('modalMensaje').value = ''

            // Recargar lista después de 1.5s y cerrar modal
            setTimeout(() => {
                cerrarModal()
                obtenerMensajesUsuario()
            }, 1500)
        } else {
            throw new Error(data.message || 'Error en el servidor')
        }

    } catch (error) {
        console.error('Error al enviar:', error)
        estado.style.color = '#ef4444'
        estado.innerHTML   = '<i class="fas fa-exclamation-triangle"></i> Error: ' + error.message
    }
}