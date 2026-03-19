/**
 * LOANWARE - Mis Solicitudes (Vista Usuario)
 * GET /api/solicitudes/usuario/:id
 * Respuesta: { solicitudes[], stats{}, totalHistorico }
 *
 * Campos de cada solicitud: id_solicitud, estado, fecha_solicitud,
 *                           equipo (nombre), ruta_imagen, categoria
 */

const API = 'https://prestamos-xi.vercel.app/api';
let todasLasSolicitudes = [];

// ─── DECODIFICAR JWT ──────────────────────────────────────────────
function getUsuarioFromToken() {
    const token = localStorage.getItem('token');
    if (!token) return null;
    try {
        const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
        return JSON.parse(decodeURIComponent(
            window.atob(base64).split('').map(c =>
                '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
            ).join('')
        ));
    } catch (e) {
        console.error('Error al decodificar token', e);
        return null;
    }
}

// ─── BADGE POR ESTADO (ENUM de la BD) ────────────────────────────
function getEstadoConfig(estado) {
    const config = {
        pendiente: { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',  icon: 'fa-clock',        label: 'Pendiente'  },
        aprobada:  { color: '#22c55e', bg: 'rgba(34,197,94,0.1)',   icon: 'fa-circle-check', label: 'Aprobada'   },
        rechazada: { color: '#ef4444', bg: 'rgba(239,68,68,0.1)',   icon: 'fa-circle-xmark', label: 'Rechazada'  },
        devuelta:  { color: '#6366f1', bg: 'rgba(99,102,241,0.1)',  icon: 'fa-rotate-left',  label: 'Devuelta'   },
        entregada: { color: '#0ea5e9', bg: 'rgba(14,165,233,0.1)',  icon: 'fa-box-open',     label: 'Entregada'  },
    };
    return config[estado] || { color: '#94a3b8', bg: '#f1f5f9', icon: 'fa-circle', label: estado };
}

// ─── RENDERIZAR TABLA DE SOLICITUDES ─────────────────────────────
function renderizarSolicitudes(solicitudes) {
    const contenedor = document.getElementById('contenedorSolicitudes');

    if (solicitudes.length === 0) {
        contenedor.innerHTML = `
            <div style="text-align:center; padding: 60px; color: var(--text-muted);">
                <i class="fas fa-inbox" style="font-size: 2.5rem; opacity: 0.3; display: block; margin-bottom: 15px;"></i>
                <p style="font-weight: 600;">No hay solicitudes en este estado.</p>
            </div>`;
        return;
    }

    contenedor.innerHTML = `
        <table style="width:100%; border-collapse:collapse; font-size:0.88rem;">
            <thead>
                <tr style="background: var(--primary); color: white; text-align: left;">
                    <th style="padding: 14px 18px;">#</th>
                    <th style="padding: 14px 18px;">Equipo</th>
                    <th style="padding: 14px 18px;">Categoría</th>
                    <th style="padding: 14px 18px;">Fecha solicitud</th>
                    <th style="padding: 14px 18px;">Estado</th>
                </tr>
            </thead>
            <tbody>
                ${solicitudes.map(s => {
                    const cfg   = getEstadoConfig(s.estado);
                    // El modelo devuelve 'equipo' (no 'equipo_nombre') en esta ruta
                    const nombre = s.equipo || s.equipo_nombre || '—';
                    const fecha  = new Date(s.fecha_solicitud).toLocaleDateString('es-MX', {
                        day: '2-digit', month: 'short', year: 'numeric'
                    });
                    return `
                    <tr style="border-bottom: 1px solid #f1f5f9; transition: background 0.15s;"
                        onmouseover="this.style.background='#f8fafc'"
                        onmouseout="this.style.background=''">
                        <td style="padding: 14px 18px; color: var(--text-muted); font-weight: 700;">#${s.id_solicitud}</td>
                        <td style="padding: 14px 18px;">
                            <div style="display:flex; align-items:center; gap:12px;">
                                <img src="${s.ruta_imagen || 'https://placehold.co/48x48?text=?'}"
                                     alt="${nombre}"
                                     style="width:44px; height:44px; object-fit:contain; border-radius:8px; background:#f1f5f9; padding:4px;"
                                     onerror="this.src='https://placehold.co/48x48?text=?'">
                                <span style="font-weight:700; color: var(--text-dark);">${nombre}</span>
                            </div>
                        </td>
                        <td style="padding: 14px 18px; color: var(--text-muted);">${s.categoria || '—'}</td>
                        <td style="padding: 14px 18px; color: var(--text-muted);">${fecha}</td>
                        <td style="padding: 14px 18px;">
                            <span style="background:${cfg.bg}; color:${cfg.color};
                                         padding: 5px 12px; border-radius: 20px;
                                         font-size: 0.78rem; font-weight: 700;
                                         display: inline-flex; align-items: center; gap: 5px;">
                                <i class="fas ${cfg.icon}"></i> ${cfg.label}
                            </span>
                        </td>
                    </tr>`;
                }).join('')}
            </tbody>
        </table>`;
}

// ─── RENDERIZAR STATS ─────────────────────────────────────────────
// La API devuelve: { total, pendientes, aprobadas, rechazadas, devueltas }
// + totalHistorico (de la función TotalSolicitudesUsuario)
function renderizarStats(stats, totalHistorico) {
    const set = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.textContent = val ?? 0;
    };
    set('statTotal',       stats.total       || totalHistorico || 0);
    set('statPendientes',  stats.pendientes);
    set('statAprobadas',   stats.aprobadas);
    set('statRechazadas',  stats.rechazadas);
    set('statDevueltas',   stats.devueltas);
}

// ─── FILTROS ──────────────────────────────────────────────────────
function filtrar(estado, btn) {
    document.querySelectorAll('.filtro-btn').forEach(b => b.classList.remove('activo'));
    btn.classList.add('activo');

    const filtradas = estado === 'todos'
        ? todasLasSolicitudes
        : todasLasSolicitudes.filter(s => s.estado === estado);

    renderizarSolicitudes(filtradas);
}

// ─── CARGA PRINCIPAL ──────────────────────────────────────────────
async function cargarSolicitudes() {
    const usuario = getUsuarioFromToken();
    const token   = localStorage.getItem('token');

    if (!usuario || !token) {
        document.getElementById('contenedorSolicitudes').innerHTML = `
            <div style="text-align:center; padding: 60px; color: var(--text-muted);">
                <i class="fas fa-lock" style="font-size: 2.5rem; opacity:0.3; display:block; margin-bottom:15px;"></i>
                <p style="font-weight:600; margin-bottom: 15px;">Debes iniciar sesión para ver tus solicitudes.</p>
                <a href="login.html" class="btn-primary"
                   style="display:inline-block; padding: 12px 28px; text-decoration:none; border-radius:10px;">
                    Iniciar Sesión
                </a>
            </div>`;
        return;
    }

    // Mostrar nombre en el header si existe ese elemento
    const elNombre = document.getElementById('nombreUsuario');
    if (elNombre && usuario.nombre) elNombre.textContent = usuario.nombre;

    try {
        // id_usuario puede venir como id_usuario o id según cómo firmes el JWT
        const idFinal = usuario.id_usuario || usuario.id;

        // GET /solicitudes/usuario/:id
        // Devuelve: { solicitudes[], stats{}, totalHistorico }
        const res = await fetch(`${API}/solicitudes/usuario/${idFinal}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.message || `Error ${res.status}`);
        }

        const data = await res.json();

        todasLasSolicitudes = data.solicitudes || [];
        renderizarStats(data.stats || {}, data.totalHistorico);
        renderizarSolicitudes(todasLasSolicitudes);

    } catch (error) {
        document.getElementById('contenedorSolicitudes').innerHTML = `
            <div style="text-align:center; padding: 60px; color:#ef4444;">
                <i class="fas fa-triangle-exclamation" style="font-size:2rem; display:block; margin-bottom:15px;"></i>
                <p style="font-weight:600;">Error al cargar solicitudes: ${error.message}</p>
            </div>`;
    }
}

cargarSolicitudes();