const API = 'https://prestamos-xi.vercel.app/api'
const token = localStorage.getItem('token')

// ─── ENVIAR MENSAJE — público, sin sesión requerida ───────────────
async function enviarMensaje() {
    const btnEnviar = document.querySelector('button[onclick="enviarMensaje()"]')
    const mensajeExito = document.getElementById('mensajeExito')

    const nombre = document.getElementById('nombre').value.trim()
    const correo = document.getElementById('correo').value.trim()
    const asuntoEl = document.getElementById('asunto')
    const asunto = asuntoEl?.options[asuntoEl.selectedIndex]?.text || 'General'
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
        alert('No se pudo enviar el mensaje: ' + error.message)
    } finally {
        btnEnviar.disabled = false
        btnEnviar.innerHTML = original
    }
}

// ─── BUZÓN ADMIN ──────────────────────────────────────────────────
let mensajesBuzon = []

async function obtenerMensajesServidor() {
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
        if (!res.ok) throw new Error(data.message)

        mensajesBuzon = Array.isArray(data) ? data : []
        renderizarLista()

    } catch (error) {
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

    [...mensajesBuzon].reverse().forEach(m => {
        const item = document.createElement('div')
        item.className = `msg-item ${m.leido ? '' : 'unread'}`
        const fecha = m.fecha || m.createdAt
            ? new Date(m.fecha || m.createdAt).toLocaleString('es-MX')
            : 'Sin fecha'

        item.innerHTML = `
            <h4 style="margin:0 0 4px; color:var(--primary);">${m.nombre}</h4>
            <p style="margin:0 0 4px; font-size:0.85rem; color:var(--text-muted);">
                <strong>Asunto:</strong> ${m.asunto || 'Sin asunto'}
            </p>
            <span style="font-size:0.75rem; color:var(--text-muted);">
                <i class="far fa-clock"></i> ${fecha}
            </span>`

        item.onclick = () => mostrarDetalle(m)
        lista.appendChild(item)
    })
}

function mostrarDetalle(m) {
    const visor = document.getElementById('visorMensaje')
    m.leido = true
    const id = m.id_contacto || m._id
    const fecha = m.fecha || m.createdAt
        ? new Date(m.fecha || m.createdAt).toLocaleString('es-MX')
        : 'Sin fecha'

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
        <div style="padding:20px 0; min-height:200px; color:var(--text-dark);
                    line-height:1.8; border-top:1px solid #f1f5f9;">
            ${m.mensaje}
        </div>`

    renderizarLista()
}

async function eliminarMensaje(id) {
    if (!confirm('¿Eliminar este mensaje permanentemente?')) return

    try {
        const res = await fetch(`${API}/contacto/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        })

        if (res.ok) {
            mensajesBuzon = mensajesBuzon.filter(m => (m.id_contacto || m._id) != id)
            document.getElementById('visorMensaje').innerHTML = `
                <div style="text-align:center; margin-top:80px; color:var(--text-muted);">
                    <i class="fas fa-check-circle" style="font-size:3rem; color:var(--accent); opacity:0.5; display:block; margin-bottom:12px;"></i>
                    Mensaje eliminado correctamente.
                </div>`
            renderizarLista()
        } else {
            alert('No se pudo eliminar el mensaje.')
        }
    } catch (error) {
        alert('Error de conexión al intentar borrar.')
    }
}

// ─── ARRANQUE — detecta en qué página está ────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    const hayBuzon = !!document.getElementById('listaMensajes')
    const hayFormulario = !!document.getElementById('formContacto')

    if (hayBuzon) {
        // Estamos en la página del buzón admin — requiere sesión
        const idRol = localStorage.getItem('id_rol')
        if (!token || idRol !== '1') {
            window.location.href = '../login.html'
            return
        }
        obtenerMensajesServidor()
    }

    // Si hay formulario (pública o admin), no hace nada extra
    // enviarMensaje() se llama desde el onclick del botón
})