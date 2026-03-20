/**
 * LOANWARE - Gestión de Devoluciones (Admin)
 * GET /api/solicitudes              → filtramos por estado='aprobada'
 * PUT /api/solicitudes/devolver/:id → SP MarcarDevuelta
 */

const API = 'https://prestamos-xi.vercel.app/api';
const token = localStorage.getItem('token');

function getAdminId() {
    if (!token) return null;
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.id_usuario || payload.id;
    } catch (e) { return null; }
}

function getIniciales(nombre) {
    if (!nombre) return '?';
    return nombre.trim().split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
}

function getDiasChip(fecha) {
    const dias = Math.floor((new Date() - new Date(fecha)) / (1000 * 60 * 60 * 24));
    if (dias > 7) return `<span class="dias-chip danger"><i class="fas fa-triangle-exclamation"></i> ${dias} días — VENCIDO</span>`;
    if (dias >= 5) return `<span class="dias-chip warning"><i class="fas fa-clock"></i> ${dias} días — Por vencer</span>`;
    return `<span class="dias-chip normal"><i class="fas fa-check-circle"></i> ${dias} día${dias !== 1 ? 's' : ''} en préstamo</span>`;
}

async function cargarDevoluciones() {
    const contenedor = document.getElementById('contenedorDevoluciones');
    try {
        const res = await fetch(`${API}/solicitudes`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error(`Error ${res.status}`);

        const solicitudes = await res.json();
        const activos = solicitudes.filter(s => s.estado === 'aprobada');

        const contador = document.getElementById('contadorActivos');
        if (contador) contador.textContent = activos.length;

        if (activos.length === 0) {
            contenedor.innerHTML = `
                <div class="dev-empty">
                    <div class="icon-wrap"><i class="fas fa-check-double"></i></div>
                    <h3>Todo en orden</h3>
                    <p>No hay equipos pendientes de devolución en este momento.</p>
                </div>`;
            return;
        }

        contenedor.innerHTML = `<div class="dev-grid">${activos.map((sol, i) => `
            <div class="dev-card" style="animation-delay: ${i * 0.06}s">
                <div class="dev-card-header">
                    <span class="sol-id">SOLICITUD #${sol.id_solicitud}</span>
                    <span class="estado-badge"><i class="fas fa-circle" style="font-size:0.5rem;"></i> En préstamo</span>
                </div>
                <div class="dev-card-body">
                    <div class="equipo-row">
                        <img class="equipo-img"
                             src="${sol.ruta_imagen || 'https://placehold.co/56x56?text=?'}"
                             alt="${sol.equipo_nombre}"
                             onerror="this.src='https://placehold.co/56x56?text=?'">
                        <div class="equipo-info">
                            <p class="nombre">${sol.equipo_nombre || '—'}</p>
                            <p class="sub"><i class="fas fa-laptop" style="margin-right:4px;"></i>Equipo en préstamo</p>
                        </div>
                    </div>

                    <div class="usuario-row">
                        <div class="avatar">${getIniciales(sol.usuario_nombre)}</div>
                        <div class="usuario-info">
                            <p class="nombre">${sol.usuario_nombre || '—'}</p>
                            <p class="mat"><i class="fas fa-id-badge" style="margin-right:4px; color:#84cc16;"></i>${sol.matricula || '—'}</p>
                        </div>
                    </div>

                    <div class="fecha-row">
                        <i class="fas fa-calendar-alt"></i>
                        <span>Prestado el ${new Date(sol.fecha_solicitud).toLocaleDateString('es-MX', {
            day: '2-digit', month: 'long', year: 'numeric'
        })}</span>
                    </div>

                    ${getDiasChip(sol.fecha_solicitud)}

                    <button class="btn-devolver" onclick="confirmarDevolucion(${sol.id_solicitud}, this)">
                        <i class="fas fa-rotate-left"></i> Registrar Devolución
                    </button>
                </div>
            </div>
        `).join('')}</div>`;

    } catch (error) {
        document.getElementById('contenedorDevoluciones').innerHTML = `
            <div class="dev-empty">
                <div class="icon-wrap" style="background:#fee2e2;">
                    <i class="fas fa-triangle-exclamation" style="color:#ef4444;"></i>
                </div>
                <h3 style="color:#ef4444;">Error al cargar</h3>
                <p>${error.message}</p>
            </div>`;
    }
}

async function confirmarDevolucion(id, btn) {
    const id_admin = getAdminId();
    if (!id_admin) return alert('Sesión expirada.');
    if (!confirm('¿Confirma que el equipo ha sido devuelto físicamente?')) return;

    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Procesando...';

    try {
        const res = await fetch(`${API}/solicitudes/devolver/${id}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ id_admin })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.message || `Error ${res.status}`);

        const card = btn.closest('.dev-card');
        card.style.transition = 'all 0.3s ease';
        card.style.opacity = '0';
        card.style.transform = 'scale(0.9)';
        setTimeout(() => cargarDevoluciones(), 350);

    } catch (e) {
        alert('Error al procesar devolución: ' + e.message);
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-rotate-left"></i> Registrar Devolución';
    }
}

document.addEventListener('DOMContentLoaded', cargarDevoluciones);