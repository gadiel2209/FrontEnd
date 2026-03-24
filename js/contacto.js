// Usamos la misma constante que en el resto de tu proyecto
const API = 'https://prestamos-xi.vercel.app/api';

async function enviarMensaje() {
    // 1. Capturar elementos
    const btnEnviar = document.querySelector('button[onclick="enviarMensaje()"]');
    const mensajeExito = document.getElementById('mensajeExito');
    const formulario = document.getElementById('formContacto');

    // 2. Obtener valores
    const nombre = document.getElementById('nombre').value.trim();
    const correo = document.getElementById('correo').value.trim();
    const asuntoSelect = document.getElementById('asunto');
    const asunto = asuntoSelect.options[asuntoSelect.selectedIndex].text; // Captura el texto del select
    const mensaje = document.getElementById('mensaje').value.trim();

    // 3. Validación básica
    if (!nombre || !correo || !mensaje) {
        alert('Por favor completa todos los campos requeridos.');
        return;
    }

    // 4. Estado de carga (Visual)
    btnEnviar.disabled = true;
    const originalContent = btnEnviar.innerHTML;
    btnEnviar.innerHTML = `<i class="fas fa-circle-notch fa-spin"></i> ENVIANDO...`;

    try {
        // 5. Petición a la API de Vercel
        const res = await fetch(`${API}/contacto`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombre, correo, asunto, mensaje })
        });

        const data = await res.json();

        if (res.ok) {
            // Éxito
            mensajeExito.style.display = 'block';
            mensajeExito.style.background = 'rgba(34,197,94,0.1)';
            mensajeExito.style.color = '#16a34a';
            mensajeExito.innerHTML = `<i class="fas fa-circle-check"></i> ${data.message || '¡Mensaje enviado correctamente!'}`;
            
            formulario.reset();

            // Ocultar mensaje de éxito tras 5 segundos
            setTimeout(() => {
                mensajeExito.style.display = 'none';
            }, 5000);
        } else {
            throw new Error(data.message || 'Error en el servidor');
        }

    } catch (error) {
        console.error("Error al enviar:", error);
        alert('No se pudo enviar el mensaje: ' + error.message);
    } finally {
        // 6. Restaurar botón
        btnEnviar.disabled = false;
        btnEnviar.innerHTML = originalContent;
    }
}

let mensajesBuzon = [];

/**
 * 1. Obtener mensajes desde el servidor
 */
async function obtenerMensajesServidor() {
    const lista = document.getElementById('listaMensajes');
    if (!lista) return;

    // Estado de carga inicial
    lista.innerHTML = `
        <div style="text-align:center; padding:40px; color:var(--primary);">
            <i class="fas fa-circle-notch fa-spin" style="font-size: 2rem;"></i>
            <p style="margin-top:10px; font-weight:600;">Cargando mensajes...</p>
        </div>`;

    try {
        const res = await fetch(`${API}/contacto`); 
        const data = await res.json();

        if (res.ok) {
            // Asumimos que data es un array de mensajes
            mensajesBuzon = data; 
            renderizarLista();
        } else {
            throw new Error(data.message || 'Error al obtener mensajes');
        }
    } catch (error) {
        console.error("Error API:", error);
        lista.innerHTML = `
            <div style="text-align:center; padding:20px; color:#ef4444;">
                <i class="fas fa-exclamation-triangle" style="font-size:2rem;"></i>
                <p style="margin-top:10px;">No se pudo conectar con el servidor.</p>
            </div>`;
    }
}

/**
 * 2. Pintar la lista en el HTML
 */
function renderizarLista() {
    const lista = document.getElementById('listaMensajes');
    lista.innerHTML = '';

    if (mensajesBuzon.length === 0) {
        lista.innerHTML = '<p style="text-align:center; padding:20px; color:var(--text-muted);">No hay mensajes en el buzón.</p>';
        return;
    }

    // Ordenar: Los más nuevos primero (usando ID o fecha)
    const ordenados = [...mensajesBuzon].reverse();

    ordenados.forEach(m => {
        const item = document.createElement('div');
        // Usamos m._id porque MongoDB/Vercel suelen usar ese formato de ID
        item.className = `msg-item ${m.leido ? '' : 'unread'}`;
        
        // Formatear fecha de forma amigable
        const fechaMsg = m.createdAt ? new Date(m.createdAt).toLocaleString() : 'Fecha desconocida';

        item.innerHTML = `
            <h4>${m.nombre}</h4>
            <p><strong>Asunto:</strong> ${m.asunto}</p>
            <span class="msg-date-tag"><i class="far fa-calendar-alt"></i> ${fechaMsg}</span>
        `;
        item.onclick = () => mostrarDetalle(m);
        lista.appendChild(item);
    });
}

/**
 * 3. Mostrar el detalle del mensaje seleccionado
 */
function mostrarDetalle(m) {
    const visor = document.getElementById('visorMensaje');
    
    // Marcar como leído localmente (opcional: podrías hacer un PUT a la API aquí)
    m.leido = true; 

    visor.innerHTML = `
        <div class="viewer-header">
            <div style="display: flex; justify-content: space-between; align-items: start; gap:15px;">
                <div>
                    <h3 style="color: var(--primary); margin-bottom: 10px; font-size:1.4rem;">
                        ${m.asunto.toUpperCase()}
                    </h3>
                    <p><strong>De:</strong> ${m.nombre} <span style="color: var(--accent); font-weight:700;">&lt;${m.correo}&gt;</span></p>
                    <p style="font-size: 0.8rem; color: var(--text-muted); margin-top:5px;">
                        <i class="far fa-clock"></i> Recibido: ${new Date(m.createdAt || Date.now()).toLocaleString()}
                    </p>
                </div>
                <button class="btn-login" 
                        style="border-color: #ef4444; color: #ef4444; min-width:auto; padding: 8px 12px;" 
                        onclick="eliminarMensajeAPI('${m._id}')" 
                        title="Eliminar mensaje">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
        <div class="viewer-body" style="padding: 20px 0; min-height:200px; color: var(--text-dark); line-height:1.8;">
            ${m.mensaje}
        </div>
        <div style="margin-top: auto; padding-top: 30px; border-top: 1px solid #eee;">
            
        </div>
    `;
    
    renderizarLista(); // Actualiza los estados visuales de la lista
}

/**
 * 4. Eliminar mensaje de la base de datos (DELETE)
 */
async function eliminarMensajeAPI(id) {
    if (!confirm('¿Estás seguro de que deseas eliminar este mensaje del servidor permanentemente?')) return;

    try {
        const res = await fetch(`${API}/contacto/${id}`, {
            method: 'DELETE'
        });

        if (res.ok) {
            // Filtramos el mensaje borrado del array local y refrescamos
            mensajesBuzon = mensajesBuzon.filter(msg => msg._id !== id);
            document.getElementById('visorMensaje').innerHTML = `
                <div style="text-align: center; margin-top: 100px; color: var(--text-muted);">
                    <i class="fas fa-check-circle" style="font-size: 4rem; color: var(--accent); opacity: 0.5;"></i>
                    <p>Mensaje eliminado correctamente.</p>
                </div>`;
            renderizarLista();
        } else {
            alert('El servidor no permitió borrar el mensaje.');
        }
    } catch (error) {
        console.error("Error al borrar:", error);
        alert('Error de conexión al intentar borrar.');
    }
}

// Iniciar proceso
// ✅ Reemplázalo con esto:
document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    const idRol = localStorage.getItem('id_rol');

    // Solo admins (rol 1) pueden ver el buzón
    if (!token || idRol !== '1') {
        // Oculta el buzón
        const buzon = document.getElementById('listaMensajes');
        const visor = document.getElementById('visorMensaje');
        if (buzon) buzon.style.display = 'none';
        if (visor) visor.style.display = 'none';

        // Muestra alerta y redirige al login
        alert('⚠️ Debes iniciar sesión como para contactar a los administradores.');
        window.location.href = '../index.html'; // Cambia por la ruta correcta a tu login
    } else {
        obtenerMensajesServidor();
    }
});