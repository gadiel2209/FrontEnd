/**
 * LOANWARE - Mensajes de Contacto (Admin)
 * GET /api/contacto → lista todos los mensajes ordenados por fecha DESC
 */

const API = 'https://prestamos-xi.vercel.app/api'
const token = localStorage.getItem('token')

let todosMensajes = []
let mensajesFiltrados = []
let paginaActual = 1
const POR_PAGINA = 12

// ─── INICIALES ────────────────────────────────────────────────────
function getIniciales(nombre) {
    if (!nombre) return '?'
    return nombre.trim().split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
}

// ─── CARGA PRINCIPAL ──────────────────────────────────────────────
async function cargarMensajes() {
    const contenedor = document.getElementById('contenedorMensajes')
    contenedor.innerHTML = `
        <div class="msg-loading">
            <i class="fas fa-circle-notch fa-spin"></i>
            Cargando mensajes...
        </div>`

    try {
        const res = await fetch(`${API}/contacto`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
        if (!res.ok) throw new Error(`Error ${res.status}`)

        todosMensajes = await res.json()
        mensajesFiltrados = [...todosMensajes]
        paginaActual = 1

        // Actualizar contador hero
        const total = document.getElementById('totalMensajes')
        if (total) total.textContent = todosMensajes.length

        renderizarMensajes()
        renderizarPaginacion()

        // Búsqueda en vivo
        document.getElementById('inputBusqueda').addEventListener('input', aplicarBusqueda)

    } catch (error) {
        contenedor.innerHTML = `
            <div class="msg-empty">
                <div class="icon-wrap" style="background:#fee2e2;">
                    <i class="fas fa-triangle-exclamation" style="color:#ef4444;"></i>
                </div>
                <h3 style="color:#ef4444;">Error al cargar</h3>
                <p>${error.message}</p>
            </div>`
    }
}

// ─── BÚSQUEDA ─────────────────────────────────────────────────────
function aplicarBusqueda() {
    const busqueda = document.getElementById('inputBusqueda').value.toLowerCase()
    mensajesFiltrados = todosMensajes.filter(m =>
        (m.nombre || '').toLowerCase().includes(busqueda) ||
        (m.correo || '').toLowerCase().includes(busqueda) ||
        (m.asunto || '').toLowerCase().includes(busqueda) ||
        (m.mensaje || '').toLowerCase().includes(busqueda)
    )
    paginaActual = 1
    renderizarMensajes()
    renderizarPaginacion()
}

// ─── RENDER CARDS ─────────────────────────────────────────────────
function renderizarMensajes() {
    const contenedor = document.getElementById('contenedorMensajes')

    if (mensajesFiltrados.length === 0) {
        contenedor.innerHTML = `
            <div class="msg-empty">
                <div class="icon-wrap"><i class="fas fa-inbox"></i></div>
                <h3>Sin mensajes</h3>
                <p>No hay mensajes que coincidan con tu búsqueda.</p>
            </div>`
        actualizarInfo()
        return
    }

    const inicio = (paginaActual - 1) * POR_PAGINA
    const fin = inicio + POR_PAGINA
    const pagina = mensajesFiltrados.slice(inicio, fin)

    contenedor.innerHTML = `<div class="msg-grid">${pagina.map((m, i) => {
        const iniciales = getIniciales(m.nombre)
        const fecha = new Date(m.fecha).toLocaleDateString('es-MX', {
            day: '2-digit', month: 'short', year: 'numeric'
        })
        const hora = new Date(m.fecha).toLocaleTimeString('es-MX', {
            hour: '2-digit', minute: '2-digit'
        })

        return `
        <div class="msg-card" style="animation-delay:${i * 0.05}s" onclick="verMensaje(${m.id_contacto})">
            <div class="msg-card-header">
                <span class="asunto-badge">
                    <i class="fas fa-tag" style="margin-right:4px;"></i>${m.asunto || 'Sin asunto'}
                </span>
                <span class="fecha">${fecha} · ${hora}</span>
            </div>
            <div class="msg-card-body">
                <div class="remitente-row">
                    <div class="avatar-msg">${iniciales}</div>
                    <div class="remitente-info">
                        <p class="nombre">${m.nombre}</p>
                        <p class="correo">${m.correo}</p>
                    </div>
                </div>
                <p class="msg-preview">${m.mensaje}</p>
                <button class="btn-ver" onclick="event.stopPropagation(); verMensaje(${m.id_contacto})">
                    <i class="fas fa-eye"></i> Ver mensaje completo
                </button>
            </div>
        </div>`
    }).join('')}</div>`

    actualizarInfo()
}

// ─── VER MENSAJE (MODAL) ──────────────────────────────────────────
function verMensaje(id) {
    const m = todosMensajes.find(x => x.id_contacto === id)
    if (!m) return

    const fecha = new Date(m.fecha).toLocaleDateString('es-MX', {
        day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
    })

    document.getElementById('modalNombre').textContent = m.nombre
    document.getElementById('modalAsuntoTag').textContent = m.asunto || 'Sin asunto'
    document.getElementById('modalAvatar').textContent = getIniciales(m.nombre)
    document.getElementById('modalNombreBody').textContent = m.nombre
    document.getElementById('modalCorreo').textContent = m.correo
    document.getElementById('modalFecha').textContent = fecha
    document.getElementById('modalAsunto').textContent = m.asunto || 'Sin asunto'
    document.getElementById('modalId').textContent = `#${m.id_contacto}`
    document.getElementById('modalMensaje').textContent = m.mensaje

    document.getElementById('modalOverlay').classList.add('open')
    document.body.style.overflow = 'hidden'
}

function cerrarModal(e) {
    if (e.target === document.getElementById('modalOverlay')) cerrarModalDirecto()
}

function cerrarModalDirecto() {
    document.getElementById('modalOverlay').classList.remove('open')
    document.body.style.overflow = ''
}

// Cerrar con ESC
document.addEventListener('keydown', e => {
    if (e.key === 'Escape') cerrarModalDirecto()
})

// ─── PAGINACIÓN ───────────────────────────────────────────────────
function actualizarInfo() {
    const el = document.getElementById('paginacionInfo')
    if (!el) return
    const total = mensajesFiltrados.length
    const inicio = total === 0 ? 0 : (paginaActual - 1) * POR_PAGINA + 1
    const fin = Math.min(paginaActual * POR_PAGINA, total)
    el.textContent = `Mostrando ${inicio}–${fin} de ${total} mensaje${total !== 1 ? 's' : ''}`
}

function renderizarPaginacion() {
    const contenedor = document.getElementById('paginacionBotones')
    if (!contenedor) return
    const totalPaginas = Math.ceil(mensajesFiltrados.length / POR_PAGINA)

    if (totalPaginas <= 1) { contenedor.innerHTML = ''; return }

    let inicio = Math.max(1, paginaActual - 2)
    let fin = Math.min(totalPaginas, inicio + 4)
    if (fin - inicio < 4) inicio = Math.max(1, fin - 4)

    let html = ''

    html += `<button onclick="irAPagina(${paginaActual - 1})" ${paginaActual === 1 ? 'disabled' : ''} style="${btnStyle(false)}">
        <i class="fas fa-chevron-left"></i></button>`

    if (inicio > 1) {
        html += `<button onclick="irAPagina(1)" style="${btnStyle(false)}">1</button>`
        if (inicio > 2) html += `<span style="padding:0 6px; color:#94a3b8;">…</span>`
    }

    for (let i = inicio; i <= fin; i++) {
        html += `<button onclick="irAPagina(${i})" style="${btnStyle(i === paginaActual)}">${i}</button>`
    }

    if (fin < totalPaginas) {
        if (fin < totalPaginas - 1) html += `<span style="padding:0 6px; color:#94a3b8;">…</span>`
        html += `<button onclick="irAPagina(${totalPaginas})" style="${btnStyle(false)}">${totalPaginas}</button>`
    }

    html += `<button onclick="irAPagina(${paginaActual + 1})" ${paginaActual === totalPaginas ? 'disabled' : ''} style="${btnStyle(false)}">
        <i class="fas fa-chevron-right"></i></button>`

    contenedor.innerHTML = html
}

function btnStyle(activo) {
    return activo
        ? `background:#1a392a; color:white; border:none; width:36px; height:36px;
           border-radius:8px; cursor:pointer; font-weight:700; font-size:0.85rem;
           font-family:'Montserrat',sans-serif;`
        : `background:white; color:#1a392a; border:1px solid #e2e8f0; width:36px; height:36px;
           border-radius:8px; cursor:pointer; font-weight:600; font-size:0.85rem;
           font-family:'Montserrat',sans-serif;`
}

function irAPagina(pagina) {
    const totalPaginas = Math.ceil(mensajesFiltrados.length / POR_PAGINA)
    if (pagina < 1 || pagina > totalPaginas) return
    paginaActual = pagina
    renderizarMensajes()
    renderizarPaginacion()
    window.scrollTo({ top: 0, behavior: 'smooth' })
}

document.addEventListener('DOMContentLoaded', cargarMensajes)