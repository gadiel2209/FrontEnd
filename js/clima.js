const WEATHER_KEY  = '18fbf2aa72872b46e4ab578593749b44'
const WEATHER_CITY = 'Huejutla de Reyes'
const WEATHER_URL  = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(WEATHER_CITY)},MX&appid=${WEATHER_KEY}&units=metric&lang=es`

// ── ICONO SEGÚN CÓDIGO DE CLIMA ───────────────────────────────────
function getClimaIcono(codigo) {
    const id = parseInt(codigo)
    if (id >= 200 && id < 300) return '<i class="fas fa-cloud-bolt" style="color:#6366f1;"></i>'   // Tormenta
    if (id >= 300 && id < 400) return '<i class="fas fa-cloud-drizzle" style="color:#60a5fa;"></i>' // Llovizna
    if (id >= 500 && id < 600) return '<i class="fas fa-cloud-rain" style="color:#3b82f6;"></i>'    // Lluvia
    if (id >= 600 && id < 700) return '<i class="fas fa-snowflake" style="color:#93c5fd;"></i>'     // Nieve
    if (id >= 700 && id < 800) return '<i class="fas fa-smog" style="color:#94a3b8;"></i>'          // Neblina
    if (id === 800)             return '<i class="fas fa-sun" style="color:#f59e0b;"></i>'           // Despejado
    if (id > 800)               return '<i class="fas fa-cloud-sun" style="color:#fbbf24;"></i>'     // Nublado
    return '<i class="fas fa-cloud" style="color:#94a3b8;"></i>'
}

// ── CARGAR CLIMA ──────────────────────────────────────────────────
async function cargarClima() {
    try {
        const res  = await fetch(WEATHER_URL)
        if (!res.ok) throw new Error('Error al obtener clima')
        const data = await res.json()

        const temp      = Math.round(data.main.temp)
        const sensacion = Math.round(data.main.feels_like)
        const humedad   = data.main.humidity
        const viento    = (data.wind.speed * 3.6).toFixed(1) // m/s → km/h
        const desc      = data.weather[0].description
        const codigo    = data.weather[0].id

        document.getElementById('climaIcono').innerHTML    = getClimaIcono(codigo)
        document.getElementById('climaTemp').textContent   = `${temp}°C`
        document.getElementById('climaDesc').textContent   = desc
        document.getElementById('climaHumedad').textContent = `${humedad}%`
        document.getElementById('climaViento').textContent  = `${viento} km/h`
        document.getElementById('climaSensacion').textContent = `${sensacion}°C`

    } catch {
        document.getElementById('climaDesc').textContent  = 'No disponible'
        document.getElementById('climaIcono').innerHTML   = '<i class="fas fa-triangle-exclamation" style="color:#94a3b8;"></i>'
    }
}

// ── SESIÓN — ajustar botón del header ────────────────────────────
const token = localStorage.getItem('token')
if (token) {
    const nombre    = localStorage.getItem('nombre') || 'Mi Perfil'
    const btnSesion = document.getElementById('btnSesion')
    if (btnSesion) {
        btnSesion.innerHTML = `<i class="fas fa-user-circle"></i> ${nombre}`
        btnSesion.href      = 'perfil.html'
    }
}

// ── INICIAR ───────────────────────────────────────────────────────
cargarClima()
// Actualizar el clima cada 10 minutos
setInterval(cargarClima, 10 * 60 * 1000)