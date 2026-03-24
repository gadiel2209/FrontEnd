/**
 * LOANWARE - Historial de Movimientos (Admin)
 * GET /api/solicitudes → lista completa con filtros y paginación (20 por página)
 */

const API = 'https://prestamos-xi.vercel.app/api'
const token = localStorage.getItem('token')

let todasLasSolicitudes = []
let solicitudesFiltradas = []
let paginaActual = 1
const POR_PAGINA = 20

// ─── CARGA PRINCIPAL ──────────────────────────────────────────────
async function cargarHistorial() {
    const tbody = document.getElementById('listaHistorial')
    try {
        const res = await fetch(`${API}/solicitudes`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
        if (!res.ok) throw new Error(`Error ${res.status}`)

        todasLasSolicitudes = await res.json()
        solicitudesFiltradas = [...todasLasSolicitudes]
        paginaActual = 1

        renderizarHistorial()
        renderizarPaginacion()
        iniciarModeloPredictivo()

        document.getElementById('selectFiltro').addEventListener('change', aplicarFiltros)
        document.getElementById('inputBusqueda').addEventListener('input', aplicarFiltros)

    } catch (error) {
        tbody.innerHTML = `<tr><td colspan="6" style="padding:40px; text-align:center; color:#ef4444;">
            <i class="fas fa-triangle-exclamation"></i> Error: ${error.message}
        </td></tr>`
    }
}

// ─── FILTROS ──────────────────────────────────────────────────────
function aplicarFiltros() {
    const estado = document.getElementById('selectFiltro').value
    const busqueda = document.getElementById('inputBusqueda').value.toLowerCase()

    solicitudesFiltradas = todasLasSolicitudes.filter(s => {
        const coincideEstado = estado === 'todos' || s.estado === estado
        const coincideBusqueda = !busqueda ||
            (s.usuario_nombre || '').toLowerCase().includes(busqueda) ||
            (s.matricula || '').toLowerCase().includes(busqueda) ||
            (s.equipo_nombre || '').toLowerCase().includes(busqueda)
        return coincideEstado && coincideBusqueda
    })

    paginaActual = 1
    renderizarHistorial()
    renderizarPaginacion()
}

// ─── RENDER TABLA ─────────────────────────────────────────────────
function renderizarHistorial() {
    const tbody = document.getElementById('listaHistorial')

    if (solicitudesFiltradas.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="padding:50px; text-align:center; color:var(--text-muted);">
            <i class="fas fa-inbox" style="font-size:2rem; opacity:0.3; display:block; margin-bottom:12px;"></i>
            No hay registros.
        </td></tr>`
        actualizarInfo()
        return
    }

    const inicio = (paginaActual - 1) * POR_PAGINA
    const fin = inicio + POR_PAGINA
    const pagina = solicitudesFiltradas.slice(inicio, fin)

    const colores = {
        aprobada: { color: '#22c55e', label: 'Préstamo' },
        devuelta: { color: '#6366f1', label: 'Devolución' },
        rechazada: { color: '#ef4444', label: 'Rechazada' },
        pendiente: { color: '#f59e0b', label: 'Pendiente' },
    }

    tbody.innerHTML = pagina.map(s => {
        const cfg = colores[s.estado] || { color: '#94a3b8', label: s.estado }
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
            <td style="padding:14px 15px; text-align:center; color:var(--text-muted); font-size:0.8rem;">
                #${s.id_solicitud}
            </td>
        </tr>`
    }).join('')

    actualizarInfo()
}

// ─── INFO DE PAGINACIÓN ───────────────────────────────────────────
function actualizarInfo() {
    const el = document.getElementById('paginacionInfo')
    if (!el) return
    const total = solicitudesFiltradas.length
    const inicio = total === 0 ? 0 : (paginaActual - 1) * POR_PAGINA + 1
    const fin = Math.min(paginaActual * POR_PAGINA, total)
    el.textContent = `Mostrando ${inicio}–${fin} de ${total} registro${total !== 1 ? 's' : ''}`
}

// ─── RENDER PAGINACIÓN ────────────────────────────────────────────
function renderizarPaginacion() {
    const contenedor = document.getElementById('paginacionBotones')
    if (!contenedor) return

    const totalPaginas = Math.ceil(solicitudesFiltradas.length / POR_PAGINA)

    if (totalPaginas <= 1) {
        contenedor.innerHTML = ''
        return
    }

    // Calcular rango de páginas visibles (máx 5)
    let inicio = Math.max(1, paginaActual - 2)
    let fin = Math.min(totalPaginas, inicio + 4)
    if (fin - inicio < 4) inicio = Math.max(1, fin - 4)

    let html = ''

    // Botón anterior
    html += `<button onclick="irAPagina(${paginaActual - 1})"
        ${paginaActual === 1 ? 'disabled' : ''}
        style="${btnStyle(false)}">
        <i class="fas fa-chevron-left"></i>
    </button>`

    // Primera página + ellipsis
    if (inicio > 1) {
        html += `<button onclick="irAPagina(1)" style="${btnStyle(false)}">1</button>`
        if (inicio > 2) html += `<span style="padding:0 6px; color:#94a3b8;">…</span>`
    }

    // Páginas del rango
    for (let i = inicio; i <= fin; i++) {
        html += `<button onclick="irAPagina(${i})" style="${btnStyle(i === paginaActual)}">${i}</button>`
    }

    // Última página + ellipsis
    if (fin < totalPaginas) {
        if (fin < totalPaginas - 1) html += `<span style="padding:0 6px; color:#94a3b8;">…</span>`
        html += `<button onclick="irAPagina(${totalPaginas})" style="${btnStyle(false)}">${totalPaginas}</button>`
    }

    // Botón siguiente
    html += `<button onclick="irAPagina(${paginaActual + 1})"
        ${paginaActual === totalPaginas ? 'disabled' : ''}
        style="${btnStyle(false)}">
        <i class="fas fa-chevron-right"></i>
    </button>`

    contenedor.innerHTML = html
}

function btnStyle(activo) {
    return activo
        ? `background:#1a392a; color:white; border:none; width:36px; height:36px;
           border-radius:8px; cursor:pointer; font-weight:700; font-size:0.85rem;
           font-family:'Montserrat',sans-serif; transition:all 0.2s;`
        : `background:white; color:#1a392a; border:1px solid #e2e8f0; width:36px; height:36px;
           border-radius:8px; cursor:pointer; font-weight:600; font-size:0.85rem;
           font-family:'Montserrat',sans-serif; transition:all 0.2s;`
}

function irAPagina(pagina) {
    const totalPaginas = Math.ceil(solicitudesFiltradas.length / POR_PAGINA)
    if (pagina < 1 || pagina > totalPaginas) return
    paginaActual = pagina
    renderizarHistorial()
    renderizarPaginacion()
    // Scroll suave al inicio de la tabla
    document.getElementById('listaHistorial')?.closest('table')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

// ─── MODELO PREDICTIVO ────────────────────────────────────────────
function iniciarModeloPredictivo() {
    const P0 = todasLasSolicitudes.length
    if (P0 < 2) return

    const factorMes1 = 1.349
    const P1h = Math.round(P0 * factorMes1)
    const k = Math.log(P1h / P0)

    const q1 = Math.round(P0 * Math.exp(k * 1))
    const q4 = Math.round(P0 * Math.exp(k * 4))

    const el = id => document.getElementById(id)
    if (el('predCardP0')) el('predCardP0').textContent = P0
    if (el('predCardQ1')) el('predCardQ1').textContent = q1
    if (el('predCardQ2')) el('predCardQ2').textContent = q4
    if (el('predKLabel')) el('predKLabel').textContent = 'k = ' + k.toFixed(4)
    if (el('predFormulaLabel'))
        el('predFormulaLabel').textContent = `P(t) = ${P0} · e^(${k.toFixed(4)}·t)`

    // ── Esperar a que el canvas exista y Chart.js esté disponible ──
    const canvas = el('predChart')
    if (!canvas) { console.warn('predChart no encontrado'); return }
    if (!window.Chart) { console.warn('Chart.js no cargado'); return }

    // Destruir instancia previa si existe (evita error de canvas en uso)
    if (canvas._chartInstance) canvas._chartInstance.destroy()

    const curveData = []
    for (let i = 0; i <= 80; i++) {
        const t = parseFloat(((i / 80) * 5).toFixed(3))
        curveData.push({ x: t, y: Math.round(P0 * Math.exp(k * t)) })
    }

    canvas._chartInstance = new Chart(canvas, {
        type: 'scatter',
        data: {
            datasets: [
                {
                    label: 'P(t)',
                    data: curveData,
                    type: 'line',
                    borderColor: '#2d5a3d',
                    backgroundColor: 'rgba(45,90,61,0.07)',
                    borderWidth: 2.5,
                    pointRadius: 0,
                    tension: 0.4,
                    fill: true,
                    order: 3
                },
                {
                    label: 'P₀ inicial',
                    data: [{ x: 0, y: P0 }],
                    pointRadius: 7,
                    pointBackgroundColor: '#1a392a',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    showLine: false,
                    order: 1
                },
                {
                    label: 'Pregunta 1 — t=1',
                    data: [{ x: 1, y: q1 }],
                    pointRadius: 10,
                    pointBackgroundColor: '#059669',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2.5,
                    showLine: false,
                    order: 1
                },
                {
                    label: 'Pregunta 2 — t=4',
                    data: [{ x: 4, y: q4 }],
                    pointRadius: 10,
                    pointBackgroundColor: '#84cc16',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2.5,
                    showLine: false,
                    order: 1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: ctx => {
                            const etiquetas = [
                                ` P(${ctx.parsed.x.toFixed(2)}) = ${ctx.parsed.y} préstamos`,
                                ` P₀ = ${ctx.parsed.y} préstamos (inicio)`,
                                ` Pregunta 1 — P(1) = ${ctx.parsed.y} préstamos`,
                                ` Pregunta 2 — P(4) = ${ctx.parsed.y} préstamos`
                            ]
                            return etiquetas[ctx.datasetIndex] || ''
                        }
                    },
                    backgroundColor: '#1a392a',
                    titleColor: '#84cc16',
                    bodyColor: 'rgba(255,255,255,0.85)',
                    padding: 12,
                    cornerRadius: 10
                }
            },
            scales: {
                x: {
                    type: 'linear',
                    min: 0, max: 5,
                    title: {
                        display: true,
                        text: 'Tiempo t (meses)',
                        color: '#64748b',
                        font: { size: 12, weight: '600' }
                    },
                    ticks: {
                        stepSize: 1,
                        callback: v => v + (v === 1 ? ' mes' : ' meses'),
                        color: '#94a3b8',
                        font: { size: 11 }
                    },
                    grid: { color: 'rgba(0,0,0,0.05)' }
                },
                y: {
                    min: 0,
                    title: {
                        display: true,
                        text: 'Préstamos P(t)',
                        color: '#64748b',
                        font: { size: 12, weight: '600' }
                    },
                    ticks: { color: '#94a3b8', font: { size: 11 } },
                    grid: { color: 'rgba(0,0,0,0.05)' }
                }
            }
        }
    })
}

document.addEventListener('DOMContentLoaded', cargarHistorial)