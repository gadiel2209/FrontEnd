const API = 'https://prestamos-xi.vercel.app/api'

// ── MOSTRAR/OCULTAR CONTRASEÑA ─────────────────────────────────────
function togglePass(inputId, iconoId) {
    const input  = document.getElementById(inputId)
    const icono  = document.getElementById(iconoId)
    const visible = input.type === 'password'
    input.type      = visible ? 'text' : 'password'
    icono.className = visible ? 'fas fa-eye-slash' : 'fas fa-eye'
}

// ── MOSTRAR ALERTAS ────────────────────────────────────────────────
function mostrarError(mensaje) {
    const alerta = document.getElementById('alertaError')
    document.getElementById('mensajeError').textContent = mensaje
    alerta.style.display = 'flex'
    document.getElementById('alertaExito').style.display = 'none'
    setTimeout(() => alerta.style.display = 'none', 5000)
}

function mostrarExito() {
    document.getElementById('alertaError').style.display = 'none'
    document.getElementById('alertaExito').style.display = 'flex'
}

// ── ESTADO DEL BOTÓN ───────────────────────────────────────────────
function setLoading(loading) {
    const btn = document.getElementById('btnRegistro')
    btn.disabled = loading
    btn.innerHTML = loading
        ? '<i class="fas fa-circle-notch fa-spin"></i> Registrando...'
        : '<i class="fas fa-user-plus"></i> REGISTRARSE AHORA'
    btn.style.opacity = loading ? '0.6' : '1'
}

// ── VALIDACIONES ───────────────────────────────────────────────────
function validar(datos) {
    const { nombre, ap_paterno, ap_materno, usuario, correo, password, confirmar } = datos

    if (!nombre || !ap_paterno || !ap_materno || !usuario || !correo || !password || !confirmar)
        return 'Todos los campos son obligatorios.'

    if (password.length < 6)
        return 'La contraseña debe tener al menos 6 caracteres.'

    if (password !== confirmar)
        return 'Las contraseñas no coinciden.'

    // Solo correos institucionales @uthh.edu.mx
    const emailInstitucional = /^[^\s@]+@uthh\.edu\.mx$/.test(correo)
    if (!emailInstitucional)
        return 'Solo se permiten correos institucionales (@uthh.edu.mx).'

    return null // sin errores
}

// ── REGISTRO PRINCIPAL ─────────────────────────────────────────────
async function registrarse() {
    const datos = {
        nombre:      document.getElementById('nombre').value.trim(),
        ap_paterno:  document.getElementById('ap_paterno').value.trim(),
        ap_materno:  document.getElementById('ap_materno').value.trim(),
        usuario:     document.getElementById('usuario').value.trim(),
        correo:      document.getElementById('correo').value.trim(),
        password:    document.getElementById('password').value,
        confirmar:   document.getElementById('confirmar').value,
    }

    const error = validar(datos)
    if (error) {
        mostrarError(error)
        return
    }

    setLoading(true)

    try {
        const res  = await fetch(`${API}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                nombre:     datos.nombre,
                ap_paterno: datos.ap_paterno,
                ap_materno: datos.ap_materno,
                usuario:    datos.usuario,
                correo:     datos.correo,
                password:   datos.password,
                id_rol:     2   // Usuario normal por defecto
            })
        })

        const data = await res.json()

        if (!res.ok) {
            mostrarError(data.message || 'Error al crear la cuenta.')
            return
        }

        mostrarExito()
        document.getElementById('formRegistro').reset()

        // Redirigir al login después de 2 segundos
        setTimeout(() => {
            window.location.href = 'login.html'
        }, 2000)

    } catch (error) {
        mostrarError('Error de conexión. Verifica que el servidor esté activo.')
    } finally {
        setLoading(false)
    }
}