const API_AGREGARUSUARIO = 'https://prestamos-xi.vercel.app/api/usuarios'

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
    window.scrollTo({ top: 0, behavior: 'smooth' })
    setTimeout(() => alerta.style.display = 'none', 5000)
}

function mostrarExito(mensaje = 'Usuario registrado con éxito.') {
    const alerta = document.getElementById('alertaExito')
    document.getElementById('mensajeExito').textContent = mensaje
    document.getElementById('alertaError').style.display = 'none'
    alerta.style.display = 'flex'
    window.scrollTo({ top: 0, behavior: 'smooth' })
}

// ── ESTADO DEL BOTÓN ───────────────────────────────────────────────
function setLoading(loading) {
    const btn = document.getElementById('btnGuardar')
    btn.disabled  = loading
    btn.innerHTML = loading
        ? '<i class="fas fa-circle-notch fa-spin"></i> Guardando...'
        : '<i class="fas fa-save"></i> Guardar Usuario'
    btn.style.opacity = loading ? '0.6' : '1'
}

// ── BARRA DE FORTALEZA DE CONTRASEÑA ──────────────────────────────
function evaluarPassword(val) {
    const bars  = [1, 2, 3, 4].map(n => document.getElementById('bar' + n))
    const label = document.getElementById('strengthLabel')
    let score = 0
    if (val.length >= 8)          score++
    if (/[A-Z]/.test(val))        score++
    if (/[0-9]/.test(val))        score++
    if (/[^A-Za-z0-9]/.test(val)) score++

    const colors = ['#e53e3e', '#ed8936', '#ecc94b', '#38a169']
    const labels = ['Débil', 'Regular', 'Buena', 'Fuerte']

    bars.forEach((b, i) => {
        b.style.background = i < score ? colors[score - 1] : '#e2e8f0'
    })
    label.textContent = val.length === 0 ? 'Ingresa una contraseña' : (labels[score - 1] || 'Débil')
    label.style.color = val.length === 0 ? '#888' : colors[score - 1]
}

// ── VALIDACIONES LOCALES ───────────────────────────────────────────
function validar(datos) {
    const { matricula, username, nombre, correo, password, confirmar, id_rol } = datos
    if (!matricula || !username || !nombre || !correo || !password || !confirmar || !id_rol)
        return 'Todos los campos son obligatorios.'
    if (password.length < 8)
        return 'La contraseña debe tener al menos 8 caracteres.'
    if (password !== confirmar)
        return 'Las contraseñas no coinciden.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo))
        return 'Ingresa un correo electrónico válido.'
    return null
}

// ── VALIDAR CAMPO INDIVIDUAL ───────────────────────────────────────
function validarCampo(id, errId, condicion, msg) {
    const input = document.getElementById(id)
    const err   = document.getElementById(errId)
    if (!condicion) {
        input.classList.add('error')
        err.textContent = msg
        err.classList.add('visible')
        return false
    }
    input.classList.remove('error')
    err.classList.remove('visible')
    return true
}

// ── LIMPIAR ERRORES AL ESCRIBIR ────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    ['matricula','username','nombre','correo','password','confirm_password','rol'].forEach(id => {
        const el = document.getElementById(id)
        if (!el) return
        el.addEventListener('input', () => {
            el.classList.remove('error')
            const err = document.getElementById('err-' + id)
            if (err) err.classList.remove('visible')
        })
    })
})

// ── GUARDAR USUARIO ────────────────────────────────────────────────
async function guardarUsuario(e) {
    e.preventDefault()

    const matricula = document.getElementById('matricula').value.trim()
    const username  = document.getElementById('username').value.trim()
    const nombre    = document.getElementById('nombre').value.trim()
    const correo    = document.getElementById('correo').value.trim()
    const password  = document.getElementById('password').value
    const confirmar = document.getElementById('confirm_password').value
    const id_rol    = document.getElementById('rol').value

    // 1. VALIDACIÓN VISUAL (Corregido el ID de error para confirm_password)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    let ok = true
    ok &= validarCampo('matricula',        'err-matricula', matricula !== '',          'La matrícula es obligatoria.')
    ok &= validarCampo('username',         'err-username',  username  !== '',          'El nombre de usuario es obligatorio.')
    ok &= validarCampo('nombre',           'err-nombre',    nombre    !== '',          'El nombre completo es obligatorio.')
    ok &= validarCampo('correo',           'err-correo',    emailRegex.test(correo),   'Ingresa un correo electrónico válido.')
    ok &= validarCampo('password',         'err-password',  password.length >= 8,      'La contraseña debe tener al menos 8 caracteres.')
    // AQUÍ SE CORRIGIÓ: de 'err-confirm' a 'err-confirm_password' para coincidir con el HTML
    ok &= validarCampo('confirm_password', 'err-confirm_password', password === confirmar, 'Las contraseñas no coinciden.')
    ok &= validarCampo('rol',              'err-rol',       id_rol    !== '',           'Selecciona un rol para el usuario.')
    
    if (!ok) return

    // 2. VALIDACIÓN GLOBAL
    const errorMsg = validar({ matricula, username, nombre, correo, password, confirmar, id_rol })
    if (errorMsg) { mostrarError(errorMsg); return }

    setLoading(true)

    try {
        const token = localStorage.getItem('token')
        // 3. FETCH CORREGIDO: Se quitó el "/usuarios" extra al final
        const res = await fetch(API_AGREGARUSUARIO, {
            method:  'POST',
            headers: {
                'Content-Type':  'application/json',
                'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify({
                matricula,
                usuario:  username,
                nombre,
                correo,
                password,
                id_rol:   parseInt(id_rol)
            })
        })

        const data = await res.json()

        if (res.ok) {
            mostrarExito(data.mensaje || 'Usuario registrado con éxito.')
            document.getElementById('formAgregarUsuario').reset()
            evaluarPassword('')
            setTimeout(() => window.location.href = 'usuario.html', 2000)
        } else {
            mostrarError(data.message || data.error || 'Ocurrió un error al registrar el usuario.')
        }
    } catch (err) {
        console.error(err)
        mostrarError('No se pudo conectar con el servidor. Intenta de nuevo.')
    } finally {
        setLoading(false)
    }
}