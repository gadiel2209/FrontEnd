const API_EQUIPOSINV = 'https://prestamos-xi.vercel.app/api'

let todosLosEquipos = []
let equiposFiltrados = []
let categoriaActiva = null
let paginaActual = 1
const POR_PAGINA = 9

// ─── SESIÓN ───────────────────────────────────────────────────────
const token = localStorage.getItem('token')
const haySession = !!token

function verificarSesion() {
    const banner   = document.getElementById('bannerGuest')
    const btnSesion = document.getElementById('btnSesion')

    if (haySession) {
        if (banner) banner.style.display = 'none'
        if (btnSesion) {
            const nombre = localStorage.getItem('nombre') || 'Mi Perfil'
            btnSesion.innerHTML = `<i class="fas fa-user-circle"></i> ${nombre}`
            btnSesion.href = 'public/perfil.html'
        }
    } else {
        if (btnSesion) {
            // Equipos está en la raíz → login también está en la raíz
            btnSesion.href = 'login.html'
        }
    }
}

// ─── MODAL INVITADO ───────────────────────────────────────────────
function mostrarModalInvitado() {
    document.getElementById('modalInvitado').style.display = 'flex'
}

function cerrarModalInvitado() {
    document.getElementById('modalInvitado').style.display = 'none'
}

function irAlLogin() {
    window.location.href = 'login.html'
}

// Cerrar modal al hacer clic en el backdrop
document.addEventListener('click', (e) => {
    if (e.target.id === 'modalInvitado') cerrarModalInvitado()
})

// ─── COLORES POR ESTADO ───────────────────────────────────────────
function getBadgeColor(estado) {
    const colores = {
        disponible:   '#22c55e',
        prestado:     '#f59e0b',
        dañado:       '#ef4444',
        mantenimiento:'#6366f1'
    }
    return colores[estado] || '#94a3b8'
}

// ─── BOTÓN SOLICITAR ──────────────────────────────────────────────
async function solicitarEquipo(id_equipo, nombre, btn) {
    // Si no hay sesión → modal de confirmación
    if (!haySession) {
        mostrarModalInvitado()
        return
    }

    const id_usuario = parseInt(localStorage.getItem('id_usuario'))
    const contenidoOriginal = '<i class="fas fa-hand-holding"></i> Solicitar'

    btn.disabled = true
    btn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Solicitando...'

    try {
        const res = await fetch(`${API_EQUIPOSINV}/solicitudes`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ id_usuario, id_equipo })
        })

        const data = await res.json()

        if (res.ok) {
            mostrarToast(`Solicitud enviada para "${nombre}"`, 'success')

            const indexTodos = todosLosEquipos.findIndex(e => e.id_equipo === id_equipo)
            if (indexTodos !== -1) todosLosEquipos[indexTodos].estado = 'prestado'

            const indexFiltrados = equiposFiltrados.findIndex(e => e.id_equipo === id_equipo)
            if (indexFiltrados !== -1) equiposFiltrados[indexFiltrados].estado = 'prestado'

            renderizarEquipos(equiposFiltrados)
            cargarCategorias()
        } else {
            mostrarToast(data.message || 'Error al enviar solicitud', 'error')
            btn.disabled = false
            btn.innerHTML = contenidoOriginal
        }
    } catch {
        mostrarToast('Error de conexión', 'error')
        btn.disabled = false
        btn.innerHTML = contenidoOriginal
    }
}

// ─── TOAST ────────────────────────────────────────────────────────
function mostrarToast(mensaje, tipo = 'success') {
    const toast = document.createElement('div')
    toast.style.cssText = `
        position:fixed; bottom:30px; left:50%; transform:translateX(-50%);
        background:${tipo === 'success' ? '#1a392a' : '#ef4444'};
        color:white; padding:14px 28px; border-radius:12px;
        font-size:0.88rem; font-weight:600; z-index:9999;
        box-shadow:0 8px 20px rgba(0,0,0,0.2);`
    toast.textContent = mensaje
    document.body.appendChild(toast)
    setTimeout(() => toast.remove(), 3500)
}

// ─── RENDERIZAR EQUIPOS ───────────────────────────────────────────
function renderizarEquipos(equipos) {
    const contenedor = document.getElementById('contenedorEquipos')
    const subtitulo  = document.getElementById('subtituloSeccion')

    equiposFiltrados = equipos
    const totalPags = Math.ceil(equipos.length / POR_PAGINA)
    if (paginaActual > totalPags) paginaActual = 1

    const inicio = (paginaActual - 1) * POR_PAGINA
    const pagina = equipos.slice(inicio, inicio + POR_PAGINA)

    subtitulo.textContent = `${equipos.length} equipo${equipos.length !== 1 ? 's' : ''} — página ${paginaActual} de ${totalPags || 1}`

    if (equipos.length === 0) {
        contenedor.innerHTML = `
            <div class="sin-resultados">
                <i class="fas fa-box-open"></i>
                <p>No hay equipos en esta categoría.</p>
            </div>`
        renderizarPaginacion(0, 0)
        return
    }

    contenedor.innerHTML = pagina.map(equipo => {
        const disponible = equipo.estado === 'disponible'
        let boton = ''

        if (disponible) {
            // Tanto usuario con sesión como invitado usan el mismo botón
            // — el invitado verá el modal de confirmación al hacer clic
            boton = `
                <button onclick="solicitarEquipo(${equipo.id_equipo}, '${equipo.nombre.replace(/'/g, "\\'")}', this)"
                    style="margin-top:12px; width:100%; padding:10px; border:none;
                    background:var(--primary); color:white; border-radius:10px; font-weight:700;
                    font-size:0.85rem; cursor:pointer; font-family:'Montserrat',sans-serif; transition:0.2s;">
                    <i class="fas fa-hand-holding"></i> Solicitar
                </button>`
        } else {
            boton = `
                <button disabled
                    style="margin-top:12px; width:100%; padding:10px; border:none;
                    background:#e2e8f0; color:#94a3b8; border-radius:10px; font-weight:700;
                    font-size:0.85rem; cursor:not-allowed; font-family:'Montserrat',sans-serif;">
                    <i class="fas fa-ban"></i> No disponible
                </button>`
        }

        return `
        <div class="card-noticia" style="display:flex; flex-direction:column;">
            <div style="position:relative; background:#fff; border-radius:12px; overflow:hidden;">
                <img src="${equipo.ruta_imagen || 'https://placehold.co/300x180?text=Sin+imagen'}"
                    alt="${equipo.nombre}"
                    style="width:100%; height:180px; object-fit:contain; padding:10px;"
                    onerror="this.src='https://placehold.co/300x180?text=Sin+imagen'">
                <span style="position:absolute; top:10px; right:10px;
                    background:${getBadgeColor(equipo.estado)}; color:white;
                    padding:3px 10px; border-radius:20px; font-size:0.72rem; font-weight:700;">
                    ${equipo.estado}
                </span>
            </div>
            <div style="padding:15px 0; flex:1; display:flex; flex-direction:column;">
                <h3 style="margin:8px 0 5px; font-size:1rem;">${equipo.nombre}</h3>
                <p style="color:var(--text-muted); font-size:0.85rem; flex:1; line-height:1.5;">
                    ${equipo.descripcion || 'Sin descripción'}
                </p>
                <p style="color:var(--primary); font-size:0.82rem; margin-top:8px;">
                    <i class="fas fa-tag"></i> ${equipo.categoria}
                </p>
                ${boton}
            </div>
        </div>`
    }).join('')

    renderizarPaginacion(totalPags, paginaActual)
}

// ─── PAGINACIÓN ───────────────────────────────────────────────────
function renderizarPaginacion(totalPags, actual) {
    let paginador = document.getElementById('paginador')
    if (!paginador) {
        paginador = document.createElement('div')
        paginador.id = 'paginador'
        paginador.style.cssText = `
            display:flex; justify-content:center; align-items:center;
            gap:8px; margin-top:40px; flex-wrap:wrap; width:100%;`
        document.getElementById('contenedorEquipos').parentElement.appendChild(paginador)
    }

    if (totalPags <= 1) { paginador.innerHTML = ''; return }

    let html = `<button onclick="cambiarPagina(${actual - 1})" ${actual === 1 ? 'disabled' : ''} class="btn-pag"> &lt; </button>`
    for (let i = 1; i <= totalPags; i++) {
        html += `<button onclick="cambiarPagina(${i})"
            style="background:${i === actual ? 'var(--primary)' : 'white'}; color:${i === actual ? 'white' : 'var(--primary)'}"
            class="btn-pag">${i}</button>`
    }
    html += `<button onclick="cambiarPagina(${actual + 1})" ${actual === totalPags ? 'disabled' : ''} class="btn-pag"> &gt; </button>`
    paginador.innerHTML = html
}

function cambiarPagina(pagina) {
    const totalPags = Math.ceil(equiposFiltrados.length / POR_PAGINA)
    if (pagina < 1 || pagina > totalPags) return
    paginaActual = pagina
    renderizarEquipos(equiposFiltrados)
    window.scrollTo({ top: 0, behavior: 'smooth' })
}

// ─── FILTROS ──────────────────────────────────────────────────────
function seleccionarCategoria(nombreCategoria, elemento) {
    document.querySelectorAll('.categoria-item').forEach(el => el.classList.remove('activa'))
    if (elemento) elemento.classList.add('activa')

    categoriaActiva = nombreCategoria
    document.getElementById('tituloSeccion').textContent = nombreCategoria || 'Catálogo de Equipos'

    const filtrados = nombreCategoria
        ? todosLosEquipos.filter(e => e.categoria.trim().toLowerCase() === nombreCategoria.trim().toLowerCase())
        : todosLosEquipos

    paginaActual = 1
    renderizarEquipos(filtrados)
}

function filtrarCategorias() {
    const query = document.getElementById('buscador')?.value.toLowerCase() || ''
    document.querySelectorAll('#listaCategorias .categoria-item[data-nombre]').forEach(item => {
        const nombre = item.dataset.nombre?.toLowerCase() || ''
        item.parentElement.style.display = nombre.includes(query) ? '' : 'none'
    })
}

// ─── CARGAR DATOS ─────────────────────────────────────────────────
async function cargarCategorias() {
    try {
        const res = await fetch(`${API_EQUIPOSINV}/categorias`)
        const categorias = await res.json()
        const lista = document.getElementById('listaCategorias')
        if (!lista) return

        const itemTodos = lista.firstElementChild
        lista.innerHTML = ''
        lista.appendChild(itemTodos)

        categorias.forEach(cat => {
            const count = todosLosEquipos.filter(e =>
                e.categoria.trim().toLowerCase() === cat.nombre.trim().toLowerCase()
            ).length
            if (count === 0) return

            const li = document.createElement('li')
            li.innerHTML = `
                <a class="categoria-item" data-nombre="${cat.nombre}"
                    onclick="seleccionarCategoria('${cat.nombre}', this)">
                    <i class="fas fa-tag"></i>
                    <span>${cat.nombre}</span>
                    <span class="badge-count">${count}</span>
                </a>`
            lista.appendChild(li)
        })

        const badgeTodos = document.getElementById('badge-todos')
        if (badgeTodos) badgeTodos.textContent = todosLosEquipos.length

        document.getElementById('cargandoCategorias')?.remove()
    } catch (err) {
        console.error('Error cargando categorías:', err)
    }
}

async function cargarEquipos() {
    try {
        const res = await fetch(`${API_EQUIPOSINV}/equipos`)
        const data = await res.json()
        todosLosEquipos = data
        renderizarEquipos(todosLosEquipos)
        await cargarCategorias()
    } catch (err) {
        console.error('Error cargando equipos:', err)
        document.getElementById('contenedorEquipos').innerHTML = `
            <div class="sin-resultados">
                <i class="fas fa-exclamation-triangle"></i>
                <p>No se pudo conectar con el servidor.</p>
            </div>`
    }
}

// ─── INICIO ───────────────────────────────────────────────────────
verificarSesion()
cargarEquipos()