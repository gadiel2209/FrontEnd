// ── CONFIGURACIÓN EMAILJS ─────────────────────────────────────────
const EMAILJS_SERVICE_ID = 'service_ih1uemy'
const EMAILJS_PUBLIC_KEY = 'qXYubprt2KisghM2-'
const TEMPLATE_APROBADA  = 'template_ed4a4sq'
const TEMPLATE_RECHAZADA = 'template_lhj06bl'

// Inicializar — se ejecuta al cargar el script
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