const API = 'https://prestamos-xi.vercel.app/api'

// ── ESTADÍSTICAS PÚBLICAS — solo endpoints sin token ──────────────
async function cargarEstadisticas() {
    try {
        const [equiposRes, categoriasRes] = await Promise.all([
            fetch(`${API}/equipos`),
            fetch(`${API}/categorias`)
        ])

        if (!equiposRes.ok || !categoriasRes.ok) return

        const equipos    = await equiposRes.json()
        const categorias = await categoriasRes.json()

        const disponibles     = Array.isArray(equipos)    ? equipos.filter(e => e.estado === 'disponible').length : 0
        const totalCategorias = Array.isArray(categorias) ? categorias.length : 0
        const totalEquipos    = Array.isArray(equipos)    ? equipos.length    : 0

        animarNumero('statEquipos',    disponibles)
        animarNumero('statCategorias', totalCategorias)
        animarNumero('statPrestamos',  totalEquipos)

    } catch {
        // Falla silenciosamente — las tarjetas se quedan en "—"
    }
}

// ── ANIMACIÓN DE CONTADOR ──────────────────────────────────────────
function animarNumero(id, objetivo) {
    const el = document.getElementById(id)
    if (!el || objetivo === 0) { if (el) el.textContent = objetivo; return }
    let actual = 0
    const paso = Math.ceil(objetivo / 30)
    const intervalo = setInterval(() => {
        actual += paso
        if (actual >= objetivo) { actual = objetivo; clearInterval(intervalo) }
        el.textContent = actual
    }, 40)
}

// ── MOSTRAR/OCULTAR CONTRASEÑA ─────────────────────────────────────
document.getElementById('togglePassword').addEventListener('click', () => {
    const input  = document.getElementById('password')
    const icono  = document.getElementById('iconoPassword')
    const visible = input.type === 'password'
    input.type      = visible ? 'text' : 'password'
    icono.className = visible ? 'fas fa-eye-slash' : 'fas fa-eye'
})

// ── MOSTRAR ERROR ──────────────────────────────────────────────────
function mostrarError(mensaje) {
    const alerta = document.getElementById('alertaError')
    document.getElementById('mensajeError').textContent = mensaje
    alerta.classList.remove('hidden')
    alerta.classList.add('flex')
    setTimeout(() => {
        alerta.classList.add('hidden')
        alerta.classList.remove('flex')
    }, 4000)
}

// ── ESTADO DEL BOTÓN ───────────────────────────────────────────────
function setLoading(loading) {
    const btn   = document.getElementById('btnLogin')
    const texto = document.getElementById('textoBtn')
    btn.disabled      = loading
    texto.textContent = loading ? 'Verificando...' : 'Entrar al Sistema'
    btn.style.opacity = loading ? '0.6' : '1'
}

// ── REDIRIGIR SEGÚN ROL ───────────────────────────────────────────
function redirigir(id_rol) {
    // Ajusta estas rutas según donde estén tus archivos en GitHub Pages
    window.location.href = id_rol === 1 ? 'adminDashboard.html' : 'public/home.html'
}

// ── LOGIN PRINCIPAL ────────────────────────────────────────────────
async function iniciarSesion() {
    const correo   = document.getElementById('correo').value.trim()
    const password = document.getElementById('password').value

    if (!correo || !password) {
        mostrarError('Por favor completa todos los campos.')
        return
    }

    setLoading(true)

    try {
        const res = await fetch(`${API}/auth/login`, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ correo, password })
        })

        const contentType = res.headers.get('content-type')
        if (!contentType || !contentType.includes('application/json')) {
            throw new Error('El servidor no respondió con JSON.')
        }

        const data = await res.json()

        if (!res.ok) {
            mostrarError(data.message || 'Credenciales inválidas.')
            return
        }

        if (!data.usuario) {
            mostrarError('Error: el servidor no envió los datos del usuario.')
            return
        }

        localStorage.setItem('token',      data.token)
        localStorage.setItem('id_usuario', data.usuario.id)
        localStorage.setItem('nombre',     data.usuario.nombre)
        localStorage.setItem('usuario',    data.usuario.usuario)
        localStorage.setItem('id_rol',     data.usuario.id_rol)

        redirigir(data.usuario.id_rol)

    } catch (err) {
        console.error(err)
        mostrarError('Error de conexión o error interno del servidor.')
    } finally {
        setLoading(false)
    }
}

// ── ENTER PARA ENVIAR ──────────────────────────────────────────────
document.getElementById('correo').addEventListener('keydown',   e => { if (e.key === 'Enter') iniciarSesion() })
document.getElementById('password').addEventListener('keydown', e => { if (e.key === 'Enter') iniciarSesion() })

// ── SI YA HAY SESIÓN ACTIVA, REDIRIGIR ────────────────────────────
const token = localStorage.getItem('token')
if (token) {
    redirigir(parseInt(localStorage.getItem('id_rol')))
}

// ── CARGAR STATS ───────────────────────────────────────────────────
cargarEstadisticas()