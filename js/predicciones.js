const API_PREDICCION = 'https://prestamos-xi.vercel.app/api'
const token = localStorage.getItem('token')

const COLORES_CAT = {
    'Monitor':   '#3b82f6',
    'Mouse':     '#8b5cf6',
    'Teclado':   '#ec4899',
    'Audífonos': '#f59e0b',
    'Cables':    '#14b8a6',
    'Bocinas':   '#f97316',
    'Proyector': '#6366f1',
}
const COLOR_DEFAULT = '#64748b'

// ─── MODELO EXPONENCIAL ───────────────────────────────────────────
function modelar(P0) {
    if (P0 < 1) return { k: 0, q1: 0, q4: 0, curva: [] }
    const P1h = Math.max(P0 + 1, Math.round(P0 * 1.349))
    const k = Math.log(P1h / P0)
    const q1 = Math.round(P0 * Math.exp(k * 1))
    const q4 = Math.round(P0 * Math.exp(k * 4))
    const curva = []
    for (let i = 0; i <= 40; i++) {
        const t = (i / 40) * 5
        curva.push({ x: parseFloat(t.toFixed(2)), y: Math.round(P0 * Math.exp(k * t)) })
    }
    return { k, q1, q4, curva }
}

// ─── TARJETA INDIVIDUAL POR EQUIPO ───────────────────────────────
function renderEquipoCard(equipo, solicitudesEquipo) {
    const P0 = solicitudesEquipo.length
    const { k, q1, q4 } = modelar(P0)
    const color = COLORES_CAT[equipo.categoria] || COLOR_DEFAULT
    const chartId = `chart_eq_${equipo.id_equipo}`

    const card = document.createElement('div')
    card.className = 'equipo-card'
    card.innerHTML = `
        <div class="equipo-card-header">
            <img src="${equipo.ruta_imagen}" alt="${equipo.nombre}" class="equipo-img"
                onerror="this.style.display='none'">
            <div class="eq-info">
                <div class="eq-nombre">${equipo.nombre}</div>
                <div class="eq-cat">${equipo.categoria}</div>
            </div>
        </div>
        <div class="equipo-card-stats">
            <div class="eq-stat">
                <div class="val">${P0}</div>
                <div class="lbl">P₀ actual</div>
            </div>
            <div class="eq-stat highlight">
                <div class="val">${q1}</div>
                <div class="lbl">1 mes</div>
            </div>
            <div class="eq-stat highlight2">
                <div class="val">${q4}</div>
                <div class="lbl">Cuatrimestre</div>
            </div>
        </div>
        <div class="equipo-chart-wrap">
            <div class="eq-chart-title">Curva exponencial · k = ${k.toFixed(4)} mes⁻¹</div>
            <div style="position:relative; width:100%; height:160px;">
                <canvas id="${chartId}"></canvas>
            </div>
        </div>
    `
    document.getElementById('equiposGrid').appendChild(card)

    setTimeout(() => {
        const ctx = document.getElementById(chartId)
        if (!ctx) return
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['P₀ (actual)', 'P(1) 1 mes', 'P(4) Cuatrimestre'],
                datasets: [{
                    data: [P0, q1, q4],
                    backgroundColor: [color + '33', '#05966933', '#84cc1633'],
                    borderColor:     [color, '#059669', '#84cc16'],
                    borderWidth: 2,
                    borderRadius: 8,
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: { label: c => ` ${c.parsed.y} préstamos proyectados` },
                        backgroundColor: '#1a392a',
                        bodyColor: 'rgba(255,255,255,0.85)',
                        padding: 10, cornerRadius: 8
                    }
                },
                scales: {
                    x: { ticks: { color: '#94a3b8', font: { size: 10 } }, grid: { display: false } },
                    y: { min: 0, ticks: { color: '#94a3b8', font: { size: 10 }, stepSize: 1 }, grid: { color: 'rgba(0,0,0,0.04)' } }
                }
            }
        })
    }, 50)
}

// ─── GRÁFICA GENERAL ─────────────────────────────────────────────
function renderGeneralChart(equipos, solicitudes) {
    const nombres = [], datosP0 = [], datosQ1 = [], datosQ4 = []

    equipos.forEach(eq => {
        const sols = solicitudes.filter(s =>
            (s.equipo_nombre || '').toLowerCase() === eq.nombre.toLowerCase()
        )
        const P0 = sols.length
        if (P0 === 0) return
        const { q1, q4 } = modelar(P0)
        nombres.push(eq.nombre.length > 18 ? eq.nombre.substring(0, 16) + '…' : eq.nombre)
        datosP0.push(P0)
        datosQ1.push(q1)
        datosQ4.push(q4)
    })

    const wrap   = document.getElementById('generalChartWrap')
    const canvas = document.getElementById('generalChart')
    document.getElementById('generalLoading').style.display = 'none'
    canvas.style.display = 'block'
    wrap.style.height = Math.max(300, nombres.length * 52 + 80) + 'px'

    new Chart(canvas, {
        type: 'bar',
        data: {
            labels: nombres,
            datasets: [
                { label: 'P₀ actual',          data: datosP0, backgroundColor: '#1a392a55', borderColor: '#1a392a', borderWidth: 2, borderRadius: 6 },
                { label: 'Pred. 1 mes',         data: datosQ1, backgroundColor: '#05966955', borderColor: '#059669', borderWidth: 2, borderRadius: 6 },
                { label: 'Pred. cuatrimestre',  data: datosQ4, backgroundColor: '#84cc1655', borderColor: '#84cc16', borderWidth: 2, borderRadius: 6 },
            ]
        },
        options: {
            indexAxis: 'y',
            responsive: true, maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: { label: c => ` ${c.dataset.label}: ${c.parsed.x} solicitudes` },
                    backgroundColor: '#1a392a', titleColor: '#84cc16',
                    bodyColor: 'rgba(255,255,255,0.85)', padding: 12, cornerRadius: 10
                }
            },
            scales: {
                x: {
                    min: 0,
                    ticks: { color: '#94a3b8', font: { size: 11 }, stepSize: 1 },
                    grid: { color: 'rgba(0,0,0,0.04)' },
                    title: { display: true, text: 'Número de solicitudes', color: '#64748b', font: { size: 11 } }
                },
                y: { ticks: { color: '#475569', font: { size: 12, weight: '600' } }, grid: { display: false } }
            }
        }
    })
}

// ─── CARGA PRINCIPAL ─────────────────────────────────────────────
async function cargarPredicciones() {
    try {
        const [resEquipos, resSolicitudes] = await Promise.all([
            fetch(`${API_PREDICCION}/equipos`,     { headers: { Authorization: `Bearer ${token}` } }),
            fetch(`${API_PREDICCION}/solicitudes`, { headers: { Authorization: `Bearer ${token}` } })
        ])

        const equipos     = await resEquipos.json()
        const solicitudes = await resSolicitudes.json()

        // Hero badges
        const P0Global = solicitudes.length
        const { k: kG, q1: q1G, q4: q4G } = modelar(P0Global)
        document.getElementById('heroTotalEquipos').textContent    = equipos.length
        document.getElementById('heroTotalSolicitudes').textContent = P0Global
        document.getElementById('heroPredMes').textContent          = q1G
        document.getElementById('heroPredCuat').textContent         = q4G

        // Tarjetas resumen
        document.getElementById('kGlobalLabel').textContent = `k = ${kG.toFixed(4)}`
        document.getElementById('rcP0').textContent = P0Global
        document.getElementById('rcQ1').textContent = q1G
        document.getElementById('rcQ4').textContent = q4G
        document.getElementById('rcEquiposActivos').textContent = equipos.filter(eq =>
            solicitudes.some(s => (s.equipo_nombre || '').toLowerCase() === eq.nombre.toLowerCase())
        ).length

        // Gráfica general
        renderGeneralChart(equipos, solicitudes)

        // Tarjetas individuales
        document.getElementById('equiposGrid').innerHTML = ''
        equipos.forEach(eq => {
            const sols = solicitudes.filter(s =>
                (s.equipo_nombre || '').toLowerCase() === eq.nombre.toLowerCase()
            )
            renderEquipoCard(eq, sols)
        })

    } catch (err) {
        console.error(err)
        document.getElementById('equiposGrid').innerHTML = `
            <div class="loading-state" style="grid-column:1/-1; color:#ef4444;">
                <i class="fas fa-triangle-exclamation"></i>
                Error al cargar datos: ${err.message}
            </div>`
    }
}

document.addEventListener('DOMContentLoaded', cargarPredicciones)