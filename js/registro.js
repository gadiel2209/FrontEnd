const API = 'https://prestamos-xi.vercel.app/api'

// ── ABSTRACT API KEY ───────────────────────────────────────────────
const ABSTRACT_API_KEY = '2232303f7b7d41038eccc4ebeb9237ff'

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

// ── VALIDACIONES LOCALES ───────────────────────────────────────────
function validar(datos) {
    const { nombre, ap_paterno, ap_materno, usuario, correo, password, confirmar } = datos

    if (!nombre || !ap_paterno || !ap_materno || !usuario || !correo || !password || !confirmar)
        return 'Todos los campos son obligatorios.'

    if (password.length < 6)
        return 'La contraseña debe tener al menos 6 caracteres.'

    if (password !== confirmar)
        return 'Las contraseñas no coinciden.'

    const emailInstitucional = /^[^\s@]+@uthh\.edu\.mx$/.test(correo)
    if (!emailInstitucional)
        return 'Solo se permiten correos institucionales (@uthh.edu.mx).'

    return null
}

// ── VALIDAR CORREO CON ABSTRACT API ───────────────────────────────
async function validarCorreoAPI(correo) {
    const inputCorreo = document.getElementById('correo')
    const feedbackEl  = document.getElementById('feedbackCorreo')

    feedbackEl.style.display = 'flex'
    feedbackEl.style.color   = '#94a3b8'
    feedbackEl.innerHTML     = '<i class="fas fa-circle-notch fa-spin"></i> Verificando correo...'

    try {
        const res  = await fetch(`https://emailvalidation.abstractapi.com/v1/?api_key=${ABSTRACT_API_KEY}&email=${correo}`)
        const data = await res.json()

        if (data.deliverability === 'UNDELIVERABLE') {
            feedbackEl.style.color = '#ef4444'
            feedbackEl.innerHTML   = '<i class="fas fa-circle-xmark"></i> Correo no válido o no existe.'
            inputCorreo.style.borderColor = '#ef4444'
            return false
        }

        if (data.is_disposable_email?.value) {
            feedbackEl.style.color = '#f59e0b'
            feedbackEl.innerHTML   = '<i class="fas fa-triangle-exclamation"></i> No se permiten correos temporales.'
            inputCorreo.style.borderColor = '#f59e0b'
            return false
        }

        feedbackEl.style.color = '#22c55e'
        feedbackEl.innerHTML   = '<i class="fas fa-circle-check"></i> Correo verificado correctamente.'
        inputCorreo.style.borderColor = '#22c55e'
        return true

    } catch (err) {
        // Si falla la API no bloqueamos el registro
        feedbackEl.style.display = 'none'
        return true
    }
}

// ── REGISTRO PRINCIPAL ─────────────────────────────────────────────
async function registrarse() {
    const datos = {
        nombre:     document.getElementById('nombre').value.trim(),
        ap_paterno: document.getElementById('ap_paterno').value.trim(),
        ap_materno: document.getElementById('ap_materno').value.trim(),
        usuario:    document.getElementById('usuario').value.trim(),
        correo:     document.getElementById('correo').value.trim(),
        password:   document.getElementById('password').value,
        confirmar:  document.getElementById('confirmar').value,
    }

    const error = validar(datos)
    if (error) { mostrarError(error); return }

    setLoading(true)

    // Validar correo con Abstract API antes de enviar
    const correoValido = await validarCorreoAPI(datos.correo)
    if (!correoValido) {
        setLoading(false)
        return
    }

    try {
        const res = await fetch(`${API}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                nombre:     datos.nombre,
                ap_paterno: datos.ap_paterno,
                ap_materno: datos.ap_materno,
                usuario:    datos.usuario,
                correo:     datos.correo,
                password:   datos.password,
                id_rol:     2
            })
        })

        const data = await res.json()
        if (!res.ok) { mostrarError(data.message || 'Error al crear la cuenta.'); return }

        mostrarExito()
        document.getElementById('formRegistro').reset()
        document.getElementById('feedbackCorreo').style.display = 'none'
        setTimeout(() => window.location.href = 'login.html', 2000)

    } catch (error) {
        mostrarError('Error de conexión. Verifica que el servidor esté activo.')
    } finally {
        setLoading(false)
    }
}