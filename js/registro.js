const API = 'https://prestamos-xi.vercel.app/api'

// ── ABSTRACT API KEY ───────────────────────────────────────────────
const ABSTRACT_API_KEY = '2232303f7b7d41038eccc4ebeb9237ff'

// Datos temporales del registro mientras se verifica el correo
let datosRegistro = null

// ── MOSTRAR/OCULTAR CONTRASEÑA ─────────────────────────────────────
function togglePass(inputId, iconoId) {
    const input   = document.getElementById(inputId)
    const icono   = document.getElementById(iconoId)
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
    btn.disabled  = loading
    btn.innerHTML = loading
        ? '<i class="fas fa-circle-notch fa-spin"></i> Enviando código...'
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
    if (!/^[^\s@]+@uthh\.edu\.mx$/.test(correo))
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
        feedbackEl.innerHTML   = '<i class="fas fa-circle-check"></i> Correo válido.'
        inputCorreo.style.borderColor = '#22c55e'
        return true
    } catch {
        feedbackEl.style.display = 'none'
        return true
    }
}

// ── PASO 1: REGISTRARSE → ENVIAR CÓDIGO ───────────────────────────
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

    const correoValido = await validarCorreoAPI(datos.correo)
    if (!correoValido) { setLoading(false); return }

    try {
        // Solicitar código al backend
        const res  = await fetch(`${API}/auth/enviar-codigo`, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ correo: datos.correo })
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.message || 'Error al generar código')

        // Guardar datos temporalmente
        datosRegistro = datos

        // Enviar código por EmailJS (cuenta 2)
        await enviarCodigoVerificacion({
            correo_usuario: datos.correo,
            nombre:         datos.nombre,
            passcode:       data.codigo
        })

        // Abrir modal
        abrirModalCodigo(datos.correo)

    } catch (err) {
        mostrarError(err.message)
    } finally {
        setLoading(false)
    }
}

// ── MODAL ─────────────────────────────────────────────────────────
function abrirModalCodigo(correo) {
    document.getElementById('modalCorreoDestino').textContent = correo
    document.getElementById('modalVerificacion').style.display = 'flex'
    document.getElementById('errorCodigo').style.display = 'none'
    document.querySelectorAll('.codigo-input').forEach(i => i.value = '')
    document.querySelector('.codigo-input').focus()
    iniciarContador()
}

function cerrarModalCodigo() {
    document.getElementById('modalVerificacion').style.display = 'none'
    clearInterval(window._contadorInterval)
}

// ── CONTADOR REGRESIVO ────────────────────────────────────────────
function iniciarContador() {
    let segundos = 10 * 60
    clearInterval(window._contadorInterval)
    window._contadorInterval = setInterval(() => {
        const m  = String(Math.floor(segundos / 60)).padStart(2, '0')
        const s  = String(segundos % 60).padStart(2, '0')
        const el = document.getElementById('contadorTiempo')
        if (el) el.textContent = `${m}:${s}`
        if (segundos <= 0) { clearInterval(window._contadorInterval); return }
        segundos--
    }, 1000)
}

// ── INPUTS: navegación automática + pegar ─────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    const inputs = document.querySelectorAll('.codigo-input')
    inputs.forEach((input, idx) => {
        input.addEventListener('input', () => {
            input.value = input.value.replace(/\D/g, '').slice(0, 1)
            if (input.value && idx < inputs.length - 1) inputs[idx + 1].focus()
        })
        input.addEventListener('keydown', e => {
            if (e.key === 'Backspace' && !input.value && idx > 0) inputs[idx - 1].focus()
        })
        input.addEventListener('paste', e => {
            e.preventDefault()
            const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
            pasted.split('').forEach((char, i) => { if (inputs[i]) inputs[i].value = char })
            if (inputs[pasted.length - 1]) inputs[pasted.length - 1].focus()
        })
    })
})

// ── PASO 2: VERIFICAR CÓDIGO Y CREAR CUENTA ───────────────────────
async function verificarYRegistrar() {
    const inputs = document.querySelectorAll('.codigo-input')
    const codigo = Array.from(inputs).map(i => i.value).join('')

    if (codigo.length < 6) { mostrarErrorCodigo('Ingresa los 6 dígitos del código.'); return }

    const btnVerificar = document.getElementById('btnVerificar')
    btnVerificar.disabled = true
    btnVerificar.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Verificando...'

    try {
        // Verificar código
        const resV  = await fetch(`${API}/auth/verificar-codigo`, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ correo: datosRegistro.correo, codigo })
        })
        const dataV = await resV.json()
        if (!resV.ok) {
            mostrarErrorCodigo(dataV.message || 'Código incorrecto o expirado.')
            btnVerificar.disabled = false
            btnVerificar.innerHTML = '<i class="fas fa-check-circle"></i> VERIFICAR Y CREAR CUENTA'
            return
        }

        // Crear cuenta
        const resR  = await fetch(`${API}/auth/register`, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({
                nombre:     datosRegistro.nombre,
                ap_paterno: datosRegistro.ap_paterno,
                ap_materno: datosRegistro.ap_materno,
                usuario:    datosRegistro.usuario,
                correo:     datosRegistro.correo,
                password:   datosRegistro.password,
                id_rol:     2
            })
        })
        const dataR = await resR.json()
        if (!resR.ok) {
            mostrarErrorCodigo(dataR.message || 'Error al crear la cuenta.')
            btnVerificar.disabled = false
            btnVerificar.innerHTML = '<i class="fas fa-check-circle"></i> VERIFICAR Y CREAR CUENTA'
            return
        }

        // Éxito
        cerrarModalCodigo()
        mostrarExito()
        document.getElementById('formRegistro').reset()
        document.getElementById('feedbackCorreo').style.display = 'none'
        setTimeout(() => window.location.href = 'login.html', 2000)

    } catch {
        mostrarErrorCodigo('Error de conexión.')
        btnVerificar.disabled = false
        btnVerificar.innerHTML = '<i class="fas fa-check-circle"></i> VERIFICAR Y CREAR CUENTA'
    }
}

// ── REENVIAR CÓDIGO ───────────────────────────────────────────────
async function reenviarCodigo() {
    if (!datosRegistro) return
    const btnReenviar = document.getElementById('btnReenviar')
    btnReenviar.disabled = true

    try {
        const res  = await fetch(`${API}/auth/enviar-codigo`, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ correo: datosRegistro.correo })
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.message)

        await enviarCodigoVerificacion({
            correo_usuario: datosRegistro.correo,
            nombre:         datosRegistro.nombre,
            passcode:       data.codigo
        })

        document.getElementById('errorCodigo').style.display = 'none'
        document.querySelectorAll('.codigo-input').forEach(i => i.value = '')
        document.querySelector('.codigo-input').focus()
        iniciarContador()

        btnReenviar.textContent = '¡Código reenviado!'
        setTimeout(() => {
            btnReenviar.textContent = 'Reenviar código'
            btnReenviar.disabled = false
        }, 30000)

    } catch (err) {
        mostrarErrorCodigo('Error al reenviar el código.')
        btnReenviar.disabled = false
    }
}

function mostrarErrorCodigo(msg) {
    const el = document.getElementById('errorCodigo')
    el.textContent    = msg
    el.style.display  = 'block'
}