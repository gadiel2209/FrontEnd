const API = 'https://prestamos-xi.vercel.app/api'
const token = localStorage.getItem('token')

// ─── CARGAR STATS DEL DASHBOARD ───────────────────────────────────
async function cargarDashboard() {
    try {
        const [resDash, resSols] = await Promise.all([
            fetch(`${API}/reportes/dashboard`, {
                headers: { 'Authorization': `Bearer ${token}` }
            }),
            fetch(`${API}/solicitudes`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
        ])

        const dash = await resDash.json()
        const sols = await resSols.json()

        // Tarjetas
        const resumen = dash?.resumen ?? {}
        document.getElementById('num-pendientes').textContent = resumen.pendientes ?? 0
        document.getElementById('num-prestamos').textContent = resumen.prestados ?? 0

        // Devoluciones vencidas (aprobadas con más de 7 días)
        const hoy = new Date()
        const vencidas = sols.filter(s => {
            if (s.estado !== 'aprobada') return false
            const dias = (hoy - new Date(s.fecha_solicitud)) / (1000 * 60 * 60 * 24)
            return dias > 7
        })
        document.getElementById('num-vencidas').textContent = vencidas.length

        // Gráficas
        graficaEstados(sols)
        graficaEquipos(dash.top_equipos)
        graficaMeses(dash.por_mes)

    } catch (error) {
        console.error('Error cargando dashboard:', error)
    }
}

// ─── GRÁFICA DONA: Estados ────────────────────────────────────────
function graficaEstados(solicitudes) {
    const conteo = { pendiente: 0, aprobada: 0, rechazada: 0, devuelta: 0 }
    solicitudes.forEach(s => {
        if (conteo[s.estado] !== undefined) conteo[s.estado]++
    })

    new Chart(document.getElementById('graficaEstados'), {
        type: 'doughnut',
        data: {
            labels: ['Pendientes', 'Aprobadas', 'Rechazadas', 'Devueltas'],
            datasets: [{
                data: [conteo.pendiente, conteo.aprobada, conteo.rechazada, conteo.devuelta],
                backgroundColor: ['#f59e0b', '#22c55e', '#ef4444', '#6366f1'],
                borderWidth: 0,
                hoverOffset: 8
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'bottom', labels: { padding: 16, font: { size: 12 } } }
            },
            cutout: '65%'
        }
    })
}

// ─── GRÁFICA BARRAS: Top equipos ──────────────────────────────────
function graficaEquipos(topEquipos) {
    new Chart(document.getElementById('graficaEquipos'), {
        type: 'bar',
        data: {
            labels: topEquipos.map(e => e.nombre),
            datasets: [{
                label: 'Solicitudes',
                data: topEquipos.map(e => e.total),
                backgroundColor: '#1a392a',
                borderRadius: 8,
                hoverBackgroundColor: '#84cc16'
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: false } },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { stepSize: 1 },
                    grid: { color: '#f1f5f9' }
                },
                x: { grid: { display: false } }
            }
        }
    })
}

// ─── GRÁFICA LÍNEA: Por mes ───────────────────────────────────────
function graficaMeses(porMes) {
    new Chart(document.getElementById('graficaMeses'), {
        type: 'line',
        data: {
            labels: porMes.map(m => m.mes),
            datasets: [{
                label: 'Solicitudes',
                data: porMes.map(m => m.total),
                borderColor: '#1a392a',
                backgroundColor: 'rgba(26,57,42,0.08)',
                borderWidth: 2,
                pointBackgroundColor: '#84cc16',
                pointRadius: 5,
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: false } },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { stepSize: 1 },
                    grid: { color: '#f1f5f9' }
                },
                x: { grid: { display: false } }
            }
        }
    })
}

document.addEventListener('DOMContentLoaded', cargarDashboard)