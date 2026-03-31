const API = 'https://prestamos-xi.vercel.app/api'
const token = localStorage.getItem('token')

// ─── VERIFICAR PERMISOS ───────────────────────────────────────────
function verificarAccesoAdmin() {
    const id_rol = localStorage.getItem('id_rol');
    if (!token || id_rol !== "1") {
        window.location.href = '../login.html';
    }
}

// ─── ENVIAR MENSAJE — público, sin sesión requerida ───────────────
async function enviarMensaje() {
    const btnEnviar = document.querySelector('button[onclick="enviarMensaje()"]')
    const mensajeExito = document.getElementById('mensajeExito')

    const nombre = document.getElementById('nombre').value.trim()
    const correo = document.getElementById('correo').value.trim()
    const asuntoEl = document.getElementById('asunto')
    const asunto = asuntoEl?.options[asuntoEl.selectedIndex]?.text || 'General'
    const mensaje = document.getElementById('mensaje').value.trim()

    if (!nombre || !correo || !mensaje) {
        alert('Por favor completa todos los campos requeridos.')
        return
    }

// ─── CARGAR FORMULARIO ────────────────────────────────────────────
async function cargarAjustes() {
    try {
        const res = await fetch(`${API}/ajustes`);
        if (res.ok) {
            const settings = await res.json();
            if (document.getElementById('email'))     document.getElementById('email').value     = settings.email     || '';
            if (document.getElementById('telefono'))  document.getElementById('telefono').value  = settings.telefono  || '';
            if (document.getElementById('copyright')) document.getElementById('copyright').value = settings.copyright || '';
    btnEnviar.disabled = true
    const original = btnEnviar.innerHTML
    btnEnviar.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> ENVIANDO...'

    try {
        const res = await fetch(`${API}/contacto`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombre, correo, asunto, mensaje })
        })

        const data = await res.json()

        if (res.ok) {
            mensajeExito.style.display = 'flex'
            mensajeExito.style.background = 'rgba(34,197,94,0.1)'
            mensajeExito.style.color = '#16a34a'
            mensajeExito.innerHTML = `<i class="fas fa-circle-check"></i> ${data.message || '¡Mensaje enviado correctamente!'}`
            document.getElementById('formContacto').reset()
            setTimeout(() => mensajeExito.style.display = 'none', 5000)
        } else {
            throw new Error(data.message || 'Error en el servidor')
        }

    } catch (error) {
        console.error("Error al cargar ajustes:", error);
    }
}

// ─── CARGAR FOOTER DINÁMICO ───────────────────────────────────────
async function cargarFooter() {
    try {
        const res = await fetch(`${API}/ajustes`);
        if (res.ok) {
            const settings = await res.json();
            const elEmail = document.getElementById('footer-email');
            const elTel   = document.getElementById('footer-telefono');
            const elCopy  = document.getElementById('footer-copyright');

            if (elEmail && settings.email)     elEmail.textContent  = settings.email;
            if (elTel   && settings.telefono)  elTel.textContent    = settings.telefono;
            if (elCopy  && settings.copyright) elCopy.textContent   = settings.copyright;
        }
    } catch (error) {
        console.error("Error al cargar footer:", error);
    }
}

// ─── GUARDAR CAMBIOS (PUT o POST) ─────────────────────────────────
async function guardarCambios(e) {
    e.preventDefault();

    const btn = e.target.querySelector('button[type="submit"]');
    const originalHTML = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Guardando...';

    const registros = [
        { clave: 'email',     valor: document.getElementById('email').value.trim(),     descripcion: 'Correo de contacto principal' },
        { clave: 'telefono',  valor: document.getElementById('telefono').value.trim(),  descripcion: 'Teléfono de atención al cliente' },
        { clave: 'copyright', valor: document.getElementById('copyright').value.trim(), descripcion: 'Texto legal del pie de página' }
    ];

    try {
        const promesas = registros.map(async (reg) => {

            // 1️⃣ Intentar PUT (actualizar registro existente)
            const urlPut = `${API}/ajustes/${reg.clave}`;
            console.log(`➡️ PUT ${urlPut}`, reg.valor);

            let res = await fetch(urlPut, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ valor: reg.valor })
            });

            console.log(`PUT ${reg.clave} → status: ${res.status}`);

            // 2️⃣ Si no existe (404), crear con POST
            if (res.status === 404) {
                console.log(`⚠️ ${reg.clave} no existe, creando con POST...`);
                res = await fetch(`${API}/ajustes`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(reg)
                });
                console.log(`POST ${reg.clave} → status: ${res.status}`);
            }

            return res;
        });

        const respuestas = await Promise.all(promesas);
        const todoOk = respuestas.every(res => res.ok);

        if (todoOk) {
            mostrarToast("✅ Ajustes guardados correctamente", "success");
            setTimeout(() => location.reload(), 2000);
        } else {
            mostrarToast("⚠️ Algunos ajustes no se pudieron guardar", "error");
            btn.disabled = false;
            btn.innerHTML = originalHTML;
        }

    } catch (error) {
        console.error("❌ Error:", error);
        mostrarToast("Error de conexión", "error");
        btn.disabled = false;
        btn.innerHTML = originalHTML;
    }
}

// ─── TOAST ────────────────────────────────────────────────────────
function mostrarToast(mensaje, tipo = 'success') {
    const toast = document.createElement('div');
    toast.style.cssText = `
        position:fixed; bottom:30px; left:50%; transform:translateX(-50%);
        background:${tipo === 'success' ? '#1a392a' : '#ef4444'};
        color:white; padding:14px 28px; border-radius:12px;
        font-size:0.88rem; font-weight:600; z-index:9999;
        box-shadow:0 8px 20px rgba(0,0,0,0.2);`;
    toast.textContent = mensaje;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3500);
}

// ─── ARRANQUE ─────────────────────────────────────────────────────
verificarAccesoAdmin();
cargarAjustes();
cargarFooter();

const form = document.querySelector('form');
if (form) form.addEventListener('submit', guardarCambios);
        alert('No se pudo enviar el mensaje: ' + error.message)
    } finally {
        btnEnviar.disabled = false
        btnEnviar.innerHTML = original
    }
}

// ─── BUZÓN ADMIN ──────────────────────────────────────────────────
let mensajesBuzon = []

async function obtenerMensajesServidor() {
    const lista = document.getElementById('listaMensajes')
    if (!lista) return

    lista.innerHTML = `
        <div style="text-align:center; padding:40px; color:var(--primary);">
            <i class="fas fa-circle-notch fa-spin" style="font-size:2rem;"></i>
            <p style="margin-top:10px; font-weight:600;">Cargando mensajes...</p>
        </div>`

    try {
        const res = await fetch(`${API}/contacto`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.message)

        mensajesBuzon = Array.isArray(data) ? data : []
        renderizarLista()

    } catch (error) {
        lista.innerHTML = `
            <div style="text-align:center; padding:20px; color:#ef4444;">
                <i class="fas fa-exclamation-triangle" style="font-size:2rem;"></i>
                <p style="margin-top:10px;">No se pudo conectar con el servidor.</p>
            </div>`
    }
}

function renderizarLista() {
    const lista = document.getElementById('listaMensajes')
    lista.innerHTML = ''

    if (mensajesBuzon.length === 0) {
        lista.innerHTML = `
            <div style="text-align:center; padding:40px; color:var(--text-muted);">
                <i class="fas fa-inbox" style="font-size:2.5rem; opacity:0.3; display:block; margin-bottom:12px;"></i>
                No hay mensajes en el buzón.
            </div>`
        return
    }

    [...mensajesBuzon].reverse().forEach(m => {
        const item = document.createElement('div')
        item.className = `msg-item ${m.leido ? '' : 'unread'}`
        const fecha = m.fecha || m.createdAt
            ? new Date(m.fecha || m.createdAt).toLocaleString('es-MX')
            : 'Sin fecha'

        item.innerHTML = `
            <h4 style="margin:0 0 4px; color:var(--primary);">${m.nombre}</h4>
            <p style="margin:0 0 4px; font-size:0.85rem; color:var(--text-muted);">
                <strong>Asunto:</strong> ${m.asunto || 'Sin asunto'}
            </p>
            <span style="font-size:0.75rem; color:var(--text-muted);">
                <i class="far fa-clock"></i> ${fecha}
            </span>`

        item.onclick = () => mostrarDetalle(m)
        lista.appendChild(item)
    })
}

function mostrarDetalle(m) {
    const visor = document.getElementById('visorMensaje')
    m.leido = true
    const id = m.id_contacto || m._id
    const fecha = m.fecha || m.createdAt
        ? new Date(m.fecha || m.createdAt).toLocaleString('es-MX')
        : 'Sin fecha'

    visor.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:start; gap:15px; margin-bottom:20px;">
            <div>
                <h3 style="color:var(--primary); margin-bottom:10px; font-size:1.3rem;">
                    ${(m.asunto || 'Sin asunto').toUpperCase()}
                </h3>
                <p style="margin:0 0 4px;">
                    <strong>De:</strong> ${m.nombre}
                    <span style="color:var(--accent); font-weight:700;">&lt;${m.correo}&gt;</span>
                </p>
                <p style="font-size:0.8rem; color:var(--text-muted); margin-top:5px;">
                    <i class="far fa-clock"></i> Recibido: ${fecha}
                </p>
            </div>
            <button onclick="eliminarMensaje('${id}')"
                style="background:none; border:1.5px solid #ef4444; color:#ef4444;
                       padding:8px 12px; border-radius:8px; cursor:pointer;
                       font-family:'Montserrat',sans-serif; font-weight:700; font-size:0.82rem;">
                <i class="fas fa-trash"></i>
            </button>
        </div>
        <div style="padding:20px 0; min-height:200px; color:var(--text-dark);
                    line-height:1.8; border-top:1px solid #f1f5f9;">
            ${m.mensaje}
        </div>`

    renderizarLista()
}

async function eliminarMensaje(id) {
    if (!confirm('¿Eliminar este mensaje permanentemente?')) return

    try {
        const res = await fetch(`${API}/contacto/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        })

        if (res.ok) {
            mensajesBuzon = mensajesBuzon.filter(m => (m.id_contacto || m._id) != id)
            document.getElementById('visorMensaje').innerHTML = `
                <div style="text-align:center; margin-top:80px; color:var(--text-muted);">
                    <i class="fas fa-check-circle" style="font-size:3rem; color:var(--accent); opacity:0.5; display:block; margin-bottom:12px;"></i>
                    Mensaje eliminado correctamente.
                </div>`
            renderizarLista()
        } else {
            alert('No se pudo eliminar el mensaje.')
        }
    } catch (error) {
        alert('Error de conexión al intentar borrar.')
    }
}

// ─── ARRANQUE — detecta en qué página está ────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    const hayBuzon = !!document.getElementById('listaMensajes')
    const hayFormulario = !!document.getElementById('formContacto')

    if (hayBuzon) {
        // Estamos en la página del buzón admin — requiere sesión
        const idRol = localStorage.getItem('id_rol')
        if (!token || idRol !== '1') {
            window.location.href = '../login.html'
            return
        }
        obtenerMensajesServidor()
    }

    // Si hay formulario (pública o admin), no hace nada extra
    // enviarMensaje() se llama desde el onclick del botón
})
