const API = 'https://prestamos-xi.vercel.app/api'
const token = localStorage.getItem('token')

if (!token) window.location.href = '../login.html'

// ─── DECODIFICAR TOKEN ────────────────────────────────────────────
function obtenerIdDesdeToken(token) {
    try {
        const base64Url = token.split('.')[1]
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
        const payload = JSON.parse(window.atob(base64))
        return payload.id
    } catch {
        return null
    }
}

const userId = obtenerIdDesdeToken(token)
let datosPerfil = {}           // datos actuales del usuario
let nuevoCorreoPendiente = null // correo nuevo esperando verificación

// ─── CARGAR PERFIL ────────────────────────────────────────────────
async function cargarPerfil() {
    try {
        const res = await fetch(`${API}/usuario/${userId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
        if (!res.ok) return
        datosPerfil = await res.json()
        renderizarPerfil(datosPerfil)
    } catch {
        console.error('Error al cargar perfil')
    }
}

function renderizarPerfil(data) {
    const rolTexto = data.rol || (data.id_rol === 1 ? 'Administrador' : 'Usuario')
    const nombreComp = `${data.nombre || ''} ${data.ap_paterno || ''} ${data.ap_materno || ''}`.trim()

    setEl('perfilNombre',        data.nombre || 'Usuario')
    setEl('perfilNombreCompleto', nombreComp || '—')
    setEl('perfilUsuario',       data.usuario ? `@${data.usuario}` : '—')
    setEl('perfilCorreo',        data.correo || '—')
    setEl('perfilRol',           rolTexto)
    setEl('perfilRolTag',        rolTexto)

    const avatar = document.getElementById('avatarLetra')
    if (avatar && data.nombre) avatar.textContent = data.nombre.charAt(0).toUpperCase()
}

function setEl(id, value) {
    const el = document.getElementById(id)
    if (el) el.textContent = value
}

// ─── ABRIR MODAL EDITAR ───────────────────────────────────────────
function abrirModalEditar() {
    document.getElementById('editNombre').value    = datosPerfil.nombre    || ''
    document.getElementById('editApPaterno').value = datosPerfil.ap_paterno || ''
    document.getElementById('editApMaterno').value = datosPerfil.ap_materno || ''
    document.getElementById('editUsuario').value   = datosPerfil.usuario   || ''
    document.getElementById('editCorreo').value    = datosPerfil.correo    || ''

    ocultarAlertaEdicion()
    document.getElementById('modalEditar').style.display = 'flex'
    document.body.style.overflow = 'hidden'
}

function cerrarModalEditar() {
    document.getElementById('modalEditar').style.display = 'none'
    document.body.style.overflow = ''
}

// ─── GUARDAR CAMBIOS ──────────────────────────────────────────────
async function guardarEdicion() {
    const nombre    = document.getElementById('editNombre').value.trim()
    const apPaterno = document.getElementById('editApPaterno').value.trim()
    const apMaterno = document.getElementById('editApMaterno').value.trim()
    const usuario   = document.getElementById('editUsuario').value.trim()
    const correo    = document.getElementById('editCorreo').value.trim()

    if (!nombre || !apPaterno || !apMaterno || !usuario || !correo) {
        mostrarAlertaEdicion('Todos los campos son obligatorios.', 'error')
        return
    }

    const correoSinCambios = correo === datosPerfil.correo

    // Si cambió el correo → flujo de verificación
    if (!correoSinCambios) {
        if (!/^[^\s@]+@uthh\.edu\.mx$/.test(correo)) {
            mostrarAlertaEdicion('Solo se permiten correos institucionales (@uthh.edu.mx).', 'error')
            return
        }
        await iniciarVerificacionCorreo({ nombre, apPaterno, apMaterno, usuario, correo })
        return
    }

    // Sin cambio de correo → actualizar directo
    await actualizarUsuario({ nombre, ap_paterno: apPaterno, ap_materno: apMaterno, usuario, correo })
}

async function actualizarUsuario(datos) {
    const btn = document.getElementById('btnGuardarEdicion')
    btn.disabled = true
    btn.innerHTML = '<i class="fas fa-spinner fa-spin" style="margin-right:6px;"></i> Guardando...'

    try {
        const res = await fetch(`${API}/usuario/${userId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(datos)
        })

        if (!res.ok) {
            const err = await res.json().catch(() => ({}))
            mostrarAlertaEdicion(err.message || 'Error al actualizar.', 'error')
            return
        }

        datosPerfil = { ...datosPerfil, ...datos }
        renderizarPerfil(datosPerfil)
        cerrarModalEditar()
        mostrarToast('Perfil actualizado correctamente.', 'success')

    } catch {
        mostrarAlertaEdicion('Error de conexión.', 'error')
    } finally {
        btn.disabled = false
        btn.innerHTML = '<i class="fas fa-save" style="margin-right:6px;"></i> Guardar Cambios'
    }
}

// ─── VERIFICACIÓN DE CORREO ───────────────────────────────────────
let datosPendientes = null  // guarda los datos del form mientras se verifica el correo

async function iniciarVerificacionCorreo(datos) {
    const btn = document.getElementById('btnGuardarEdicion')
    btn.disabled = true
    btn.innerHTML = '<i class="fas fa-spinner fa-spin" style="margin-right:6px;"></i> Enviando código...'

    try {
        const res  = await fetch(`${API}/auth/enviar-codigo`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ correo: datos.correo })
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.message || 'Error al enviar código')

        datosPendientes = datos
        nuevoCorreoPendiente = datos.correo

        // Enviar correo con EmailJS (mismo servicio que el registro)
        await enviarCodigoVerificacion({
            correo_usuario: datos.correo,
            nombre: datos.nombre,
            passcode: data.codigo
        })

        cerrarModalEditar()
        abrirModalVerificacion(datos.correo)

    } catch (err) {
        mostrarAlertaEdicion(err.message || 'Error al enviar código.', 'error')
    } finally {
        btn.disabled = false
        btn.innerHTML = '<i class="fas fa-save" style="margin-right:6px;"></i> Guardar Cambios'
    }
}

function abrirModalVerificacion(correo) {
    document.getElementById('verificCorreoDestino').textContent = correo
    document.getElementById('errorCodigoPerfil').style.display = 'none'
    document.querySelectorAll('.codigo-input-perfil').forEach(i => i.value = '')
    document.getElementById('modalVerificacionPerfil').style.display = 'flex'
    document.body.style.overflow = 'hidden'
    iniciarContadorPerfil()
    setTimeout(() => {
        const first = document.querySelector('.codigo-input-perfil')
        if (first) first.focus()
    }, 100)
}

function cerrarModalVerificacion() {
    document.getElementById('modalVerificacionPerfil').style.display = 'none'
    document.body.style.overflow = ''
    clearInterval(window._contadorPerfilInterval)
}

function iniciarContadorPerfil() {
    let segundos = 10 * 60
    clearInterval(window._contadorPerfilInterval)
    window._contadorPerfilInterval = setInterval(() => {
        const m = String(Math.floor(segundos / 60)).padStart(2, '0')
        const s = String(segundos % 60).padStart(2, '0')
        const el = document.getElementById('contadorTiempoPerfil')
        if (el) el.textContent = `${m}:${s}`
        if (--segundos < 0) clearInterval(window._contadorPerfilInterval)
    }, 1000)
}

async function verificarYActualizar() {
    const inputs = document.querySelectorAll('.codigo-input-perfil')
    const codigo = Array.from(inputs).map(i => i.value).join('')

    if (codigo.length < 6) {
        mostrarErrorCodigoPerfil('Ingresa los 6 dígitos del código.')
        return
    }

    const btn = document.getElementById('btnVerificarPerfil')
    btn.disabled = true
    btn.innerHTML = '<i class="fas fa-spinner fa-spin" style="margin-right:6px;"></i> Verificando...'

    try {
        // 1. Verificar código
        const resV = await fetch(`${API}/auth/verificar-codigo`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ correo: nuevoCorreoPendiente, codigo })
        })
        const dataV = await resV.json()
        if (!resV.ok) {
            mostrarErrorCodigoPerfil(dataV.message || 'Código incorrecto o expirado.')
            return
        }

        // 2. Actualizar usuario con el nuevo correo
        const { nombre, apPaterno, apMaterno, usuario, correo } = datosPendientes
        await actualizarUsuario({
            nombre,
            ap_paterno: apPaterno,
            ap_materno: apMaterno,
            usuario,
            correo
        })

        cerrarModalVerificacion()
        mostrarToast('Perfil y correo actualizados correctamente.', 'success')

    } catch {
        mostrarErrorCodigoPerfil('Error de conexión.')
    } finally {
        btn.disabled = false
        btn.innerHTML = '<i class="fas fa-check-circle" style="margin-right:6px;"></i> Verificar y Guardar'
    }
}

async function reenviarCodigoPerfil() {
    if (!datosPendientes) return
    const btn = document.getElementById('btnReenviarPerfil')
    btn.disabled = true
    btn.textContent = 'Enviando...'

    try {
        const res  = await fetch(`${API}/auth/enviar-codigo`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ correo: nuevoCorreoPendiente })
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.message)

        await enviarCodigoVerificacion({
            correo_usuario: nuevoCorreoPendiente,
            nombre: datosPendientes.nombre,
            passcode: data.codigo
        })

        document.querySelectorAll('.codigo-input-perfil').forEach(i => i.value = '')
        document.querySelector('.codigo-input-perfil').focus()
        document.getElementById('errorCodigoPerfil').style.display = 'none'
        iniciarContadorPerfil()

        btn.textContent = '¡Código reenviado!'
        setTimeout(() => {
            btn.textContent = 'Reenviar código'
            btn.disabled = false
        }, 30000)
    } catch {
        mostrarErrorCodigoPerfil('Error al reenviar el código.')
        btn.disabled = false
        btn.textContent = 'Reenviar código'
    }
}

function mostrarErrorCodigoPerfil(msg) {
    const el = document.getElementById('errorCodigoPerfil')
    el.textContent   = msg
    el.style.display = 'block'
}

// ─── CAMBIAR CONTRASEÑA (existente) ──────────────────────────────
async function cambiarPassword() {
    const passActual = document.getElementById('passwordActual').value
    const passNueva  = document.getElementById('passwordNueva').value

    if (!passActual || !passNueva) {
        mostrarAlerta('Completa ambos campos de contraseña.', 'error')
        return
    }
    if (passNueva.length < 6) {
        mostrarAlerta('La nueva contraseña debe tener al menos 6 caracteres.', 'error')
        return
    }

    try {
        const res = await fetch(`${API}/usuario/${userId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ password: passNueva })
        })
        if (res.ok) {
            mostrarAlerta('¡Contraseña actualizada!', 'success')
            document.getElementById('formPassword').reset()
        } else {
            const err = await res.json().catch(() => ({}))
            mostrarAlerta(err.message || 'Error al actualizar.', 'error')
        }
    } catch {
        mostrarAlerta('Error de conexión.', 'error')
    }
}

// ─── CERRAR SESIÓN ────────────────────────────────────────────────
function cerrarSesion() {
    localStorage.clear()
    window.location.href = '/FrontEnd/login.html'
}

// ─── ALERTAS / TOASTS ─────────────────────────────────────────────
function mostrarAlerta(msj, tipo) {
    const alerta = document.getElementById('alertaPerfil')
    if (!alerta) return
    alerta.style.display          = 'flex'
    alerta.textContent            = msj
    alerta.style.backgroundColor  = tipo === 'error' ? '#fecaca' : '#dcfce7'
    alerta.style.color            = tipo === 'error' ? '#b91c1c' : '#15803d'
    setTimeout(() => { alerta.style.display = 'none' }, 4000)
}

function mostrarAlertaEdicion(msj, tipo) {
    const el = document.getElementById('alertaEdicion')
    if (!el) return
    el.style.display         = 'flex'
    el.textContent           = msj
    el.style.backgroundColor = tipo === 'error' ? '#fecaca' : '#dcfce7'
    el.style.color           = tipo === 'error' ? '#b91c1c' : '#15803d'
}

function ocultarAlertaEdicion() {
    const el = document.getElementById('alertaEdicion')
    if (el) el.style.display = 'none'
}

function mostrarToast(mensaje, tipo = 'success') {
    let toast = document.getElementById('toastPerfil')
    if (!toast) {
        toast = document.createElement('div')
        toast.id = 'toastPerfil'
        document.body.appendChild(toast)
    }
    const bg   = tipo === 'success' ? '#22c55e' : '#ef4444'
    const icon = tipo === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'
    toast.style.cssText = `
        position:fixed; bottom:24px; right:24px; z-index:9999;
        background:${bg}; color:white; padding:12px 20px;
        border-radius:10px; font-family:'Montserrat',sans-serif;
        font-weight:600; font-size:.85rem; display:flex;
        align-items:center; gap:10px; box-shadow:0 8px 24px rgba(0,0,0,.15);
        opacity:1; transition:opacity .3s;
    `
    toast.innerHTML = `<i class="fas ${icon}"></i> ${mensaje}`
    clearTimeout(toast._t)
    toast._t = setTimeout(() => toast.style.opacity = '0', 3500)
}

// ─── INPUTS DE CÓDIGO (navegación automática) ─────────────────────
document.addEventListener('DOMContentLoaded', () => {
    cargarPerfil()

    // Cerrar modales al hacer clic en backdrop
    document.addEventListener('click', (e) => {
        if (e.target.id === 'modalEditar') cerrarModalEditar()
        if (e.target.id === 'modalVerificacionPerfil') cerrarModalVerificacion()
    })

    // Inputs código verificación
    const inputs = document.querySelectorAll('.codigo-input-perfil')
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
            const last = inputs[Math.min(pasted.length, inputs.length) - 1]
            if (last) last.focus()
        })
    })
})