const API = 'https://prestamos-xi.vercel.app/api'

let todasLasSolicitudes = []

// ─── OBTENER ID USUARIO DEL JWT ───────────────────────────────────
function getUsuarioFromToken() {
    const token = localStorage.getItem('token');
    if (!token) return null;
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));

        return JSON.parse(jsonPayload);
    } catch (e) {
        console.error("Error al decodificar token", e);
        return null;
    }
}

// ─── COLORES Y LABELS POR ESTADO ─────────────────────────────────
function getEstadoConfig(estado) {
    const config = {
        pendiente:  { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',  icon: 'fa-clock',        label: 'Pendiente'  },
        aprobada:   { color: '#22c55e', bg: 'rgba(34,197,94,0.1)',   icon: 'fa-circle-check', label: 'Aprobada'   },
        rechazada:  { color: '#ef4444', bg: 'rgba(239,68,68,0.1)',   icon: 'fa-circle-xmark', label: 'Rechazada'  },
        devuelta:   { color: '#6366f1', bg: 'rgba(99,102,241,0.1)',  icon: 'fa-rotate-left',  label: 'Devuelta'   },
        entregada:  { color: '#0ea5e9', bg: 'rgba(14,165,233,0.1)',  icon: 'fa-box-open',     label: 'Entregada'  },
    }
    return config[estado] || { color: '#94a3b8', bg: '#f1f5f9', icon: 'fa-circle', label: estado }
}

// ─── RENDERIZAR TABLA ─────────────────────────────────────────────
function renderizarSolicitudes(solicitudes) {
    const contenedor = document.getElementById('contenedorSolicitudes')

    if (solicitudes.length === 0) {
        contenedor.innerHTML = `
            <div style="text-align:center; padding: 60px; color: var(--text-muted);">
                <i class="fas fa-inbox" style="font-size: 2.5rem; opacity: 0.3; display: block; margin-bottom: 15px;"></i>
                <p style="font-weight: 600;">No hay solicitudes en este estado.</p>
            </div>`
        return
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
                ${solicitudes.map((s, i) => {
                    const cfg   = getEstadoConfig(s.estado)
                    const fecha = new Date(s.fecha_solicitud).toLocaleDateString('es-MX', {
                        day: '2-digit', month: 'short', year: 'numeric'
                    })
                    return `
                    <tr style="border-bottom: 1px solid #f1f5f9; transition: background 0.15s;"
                        onmouseover="this.style.background='#f8fafc'"
                        onmouseout="this.style.background=''">
                        <td style="padding: 14px 18px; color: var(--text-muted); font-weight: 700;">
                            #${s.id_solicitud}
                        </td>
                        <td style="padding: 14px 18px;">
                            <div style="display:flex; align-items:center; gap:12px;">
                                <img src="${s.ruta_imagen || 'https://placehold.co/48x48?text=?'}"
                                    alt="${s.equipo}"
                                    style="width:44px; height:44px; object-fit:contain; border-radius:8px; background:#f1f5f9; padding:4px;"
                                    onerror="this.src='https://placehold.co/48x48?text=?'">
                                <span style="font-weight:700; color: var(--text-dark);">${s.equipo}</span>
                            </div>
                        </td>
                        <td style="padding: 14px 18px; color: var(--text-muted);">${s.categoria}</td>
                        <td style="padding: 14px 18px; color: var(--text-muted);">${fecha}</td>
                        <td style="padding: 14px 18px;">
                            <span style="background:${cfg.bg}; color:${cfg.color};
                                        padding: 5px 12px; border-radius: 20px;
                                        font-size: 0.78rem; font-weight: 700;
                                        display: inline-flex; align-items: center; gap: 5px;">
                                <i class="fas ${cfg.icon}"></i> ${cfg.label}
                            </span>
                        </td>
                    </tr>`
                }).join('')}
            </tbody>
        </table>`
}

// ─── RENDERIZAR STATS ─────────────────────────────────────────────
function renderizarStats(stats) {
    document.getElementById('statTotal').textContent      = stats.total      || 0
    document.getElementById('statPendientes').textContent = stats.pendientes || 0
    document.getElementById('statAprobadas').textContent  = stats.aprobadas  || 0
    document.getElementById('statRechazadas').textContent = stats.rechazadas || 0
    document.getElementById('statDevueltas').textContent  = stats.devueltas  || 0
}

// ─── FILTRAR ──────────────────────────────────────────────────────
function filtrar(estado, btn) {
    document.querySelectorAll('.filtro-btn').forEach(b => b.classList.remove('activo'))
    btn.classList.add('activo')

    const filtradas = estado === 'todos'
        ? todasLasSolicitudes
        : todasLasSolicitudes.filter(s => s.estado === estado)

    renderizarSolicitudes(filtradas)
}

// ─── CARGAR DATOS ─────────────────────────────────────────────────
async function cargarSolicitudes() {
const usuario = getUsuarioFromToken();
    const token = localStorage.getItem('token'); // Recuperar token

    if (!usuario || !token) {
        document.getElementById('contenedorSolicitudes').innerHTML = `
            <div style="text-align:center; padding: 60px; color: var(--text-muted);">
                <i class="fas fa-lock" style="font-size: 2.5rem; opacity:0.3; display:block; margin-bottom:15px;"></i>
                <p style="font-weight:600; margin-bottom: 15px;">Debes iniciar sesión para ver tus solicitudes.</p>
                <a href="login.html" class="btn-primary" style="display:inline-block; padding: 12px 28px; text-decoration:none; border-radius:10px;">
                    Iniciar Sesión
                </a>
            </div>`
        return;
    }

    // Mostrar nombre en el header
    if (usuario.nombre) {
        document.getElementById('nombreUsuario').textContent = usuario.nombre
    }

    try {
        const idFinal = usuario.id_usuario || usuario.id; 
        console.log("Cargando solicitudes para el ID:", idFinal); // Para debug

        const res = await fetch(`${API}/solicitudes/usuario/${idFinal}`, {
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        const data = await res.json()

        if (!res.ok) throw new Error(data.message)

        todasLasSolicitudes = data.solicitudes
        renderizarStats(data.stats)
        renderizarSolicitudes(todasLasSolicitudes)  

    } catch (error) {
        document.getElementById('contenedorSolicitudes').innerHTML = `
            <div style="text-align:center; padding: 60px; color:#ef4444;">
                <i class="fas fa-triangle-exclamation" style="font-size:2rem; display:block; margin-bottom:15px;"></i>
                <p style="font-weight:600;">Error al cargar solicitudes: ${error.message}</p>
            </div>`
    }
}

cargarSolicitudes()