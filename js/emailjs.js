// ── CUENTA 1 — Aprobación y Rechazo ──────────────────────────────
const EMAILJS_SERVICE_ID = 'service_ih1uemy'
const EMAILJS_PUBLIC_KEY = 'qXYubprt2KisghM2-'
const TEMPLATE_APROBADA  = 'template_ed4a4sq'
const TEMPLATE_RECHAZADA = 'template_lhj06bl'

// ── CUENTA 2 — Verificación de correo ────────────────────────────
const EMAILJS_SERVICE_ID_2 = 'service_u2cddym'
const EMAILJS_PUBLIC_KEY_2 = 'BZZv5KK62SvmE4U8e'
const TEMPLATE_VERIFICACION = 'template_gy3v9ro'

// Inicializar cuenta principal
emailjs.init(EMAILJS_PUBLIC_KEY)

// ── ENVIAR CORREO DE APROBACIÓN ───────────────────────────────────
async function enviarCorreoAprobacion({ correo_usuario, nombre_usuario, nombre_equipo, id_solicitud }) {
    const fecha = new Date().toLocaleDateString('es-MX', {
        day: '2-digit', month: 'long', year: 'numeric'
    })

    try {
        await emailjs.send(EMAILJS_SERVICE_ID, TEMPLATE_APROBADA, {
            correo_usuario,
            nombre_usuario,
            nombre_equipo,
            id_solicitud,
            fecha
        })
        console.log('Correo de aprobación enviado a', correo_usuario)
        return true
    } catch (error) {
        console.error('Error enviando correo de aprobación:', error)
        return false
    }
}

// ── ENVIAR CORREO DE RECHAZO ──────────────────────────────────────
async function enviarCorreoRechazo({ correo_usuario, nombre_usuario, nombre_equipo, id_solicitud, motivo }) {
    const fecha = new Date().toLocaleDateString('es-MX', {
        day: '2-digit', month: 'long', year: 'numeric'
    })

    try {
        await emailjs.send(EMAILJS_SERVICE_ID, TEMPLATE_RECHAZADA, {
            correo_usuario,
            nombre_usuario,
            nombre_equipo,
            id_solicitud,
            motivo: motivo || 'Sin motivo especificado',
            fecha
        })
        console.log('Correo de rechazo enviado a', correo_usuario)
        return true
    } catch (error) {
        console.error('Error enviando correo de rechazo:', error)
        return false
    }
}

// ── ENVIAR CÓDIGO DE VERIFICACIÓN ────────────────────────────────
async function enviarCodigoVerificacion({ correo_usuario, nombre, passcode }) {
    try {
        await emailjs.send(
            EMAILJS_SERVICE_ID_2,
            TEMPLATE_VERIFICACION,
            {
                correo_usuario,
                nombre,
                passcode
            },
            EMAILJS_PUBLIC_KEY_2  // ← clave de la cuenta 2
        )
        console.log('Código de verificación enviado a', correo_usuario)
        return true
    } catch (error) {
        console.error('Error enviando código de verificación:', error)
        return false
    }
}