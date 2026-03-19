// Configuración de la API
const API = 'https://prestamos-xi.vercel.app/api';
let todosLosUsuarios = [];

// ─── SEGURIDAD: SOLO ADMINISTRADORES ─────────────────────────────
const token = localStorage.getItem('token');
const id_rol = localStorage.getItem('id_rol');

function verificarAcceso() {
    // Si no hay token o no es rol 1, fuera de aquí
    if (!token || id_rol !== "1") {
        window.location.href = "../login.html";
        return;
    }

    // Actualizar nombre en el botón de perfil (según tu imagen: "fernando hernandez")
    const btnSesion = document.getElementById('btnSesion');
    if (btnSesion) {
        const nombre = localStorage.getItem('nombre') || 'Usuario Admin';
        btnSesion.innerHTML = `<i class="fas fa-user-circle"></i> ${nombre.toLowerCase()}`;
    }
}

// ─── OBTENER DATOS DE LA API ──────────────────────────────────────
async function cargarUsuarios() {
    const tablaBody = document.querySelector('tbody');
    // Spinner de carga opcional
    tablaBody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:20px;">Cargando usuarios...</td></tr>`;

    try {
        const res = await fetch(`${API}/usuario`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!res.ok) throw new Error('Error en la respuesta');
        
        todosLosUsuarios = await res.json();
        renderizarTabla(todosLosUsuarios);

    } catch (error) {
        console.error("Error cargando usuarios:", error);
        tablaBody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:red; padding:20px;">No se pudo conectar con el servidor.</td></tr>`;
    }
}

// ─── RENDERIZAR TABLA (MATCH CON TU DISEÑO) ──────────────────────
function renderizarTabla(usuarios) {
    const tbody = document.querySelector('tbody');
    tbody.innerHTML = '';

    if (usuarios.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:20px;">Sin resultados encontrados.</td></tr>`;
        return;
    }

    usuarios.forEach(u => {
        const tr = document.createElement('tr');
        tr.style.borderBottom = "1px solid #edf2f7";

        // Formatear Fecha
        const fecha = u.fecha_registro ? new Date(u.fecha_registro).toLocaleDateString('es-MX') : '15/01/2026';
        
        // Determinar Estilo del Rol (Verde oscuro para Admin, Verde claro para Estudiante)
        const esAdmin = u.id_rol === 1;
        const bgBadge = esAdmin ? '#e2e8f0' : '#dcfce7';
        const colorText = esAdmin ? '#475569' : '#166534';
        const textoRol = esAdmin ? 'ADMINISTRADOR' : 'ESTUDIANTE';

        tr.innerHTML = `
            <td style="padding: 15px;">${u.id_usuario.toString().padStart(3, '0')}</td>
            <td style="padding: 15px; font-weight: 700;">${u.usuario}</td>
            <td style="padding: 15px;">${u.nombre} ${u.apellido || ''}</td>
            <td style="padding: 15px;">${u.correo}</td>
            <td style="padding: 15px;">
                <span class="badge" style="background: ${bgBadge}; color: ${colorText}; 
                      padding: 5px 15px; border-radius: 20px; font-size: 0.7rem; font-weight: 800;">
                    ${textoRol}
                </span>
            </td>
            <td style="padding: 15px;">${fecha}</td>
            <td style="padding: 15px; text-align: center;">
                <button onclick="editarUsuario(${u.id_usuario})" 
                    style="background: none; border: none; color: #334155; cursor: pointer; font-size: 1.2rem;">
                    <i class="fas fa-user-edit"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// ─── LÓGICA DE BÚSQUEDA ──────────────────────────────────────────
function filtrarUsuarios() {
    const query = document.querySelector('input[type="text"]').value.toLowerCase().trim();
    
    const filtrados = todosLosUsuarios.filter(u => 
        u.nombre.toLowerCase().includes(query) || 
        u.usuario.toLowerCase().includes(query) || 
        u.correo.toLowerCase().includes(query)
    );
    
    renderizarTabla(filtrados);
}

// ─── ACCIONES ─────────────────────────────────────────────────────
function editarUsuario(id) {
    // Aquí puedes abrir un modal de edición o redirigir
    console.log("Editando usuario con ID:", id);
    mostrarToast(`Editando usuario ${id}...`, 'success');
}

function mostrarToast(msg, tipo) {
    const t = document.createElement('div');
    t.style.cssText = `position:fixed; bottom:20px; right:20px; background:#84cc16; color:white; 
                       padding:12px 25px; border-radius:8px; z-index:10000; font-weight:600;`;
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 3000);
}

// ─── INICIO AL CARGAR PÁGINA ─────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    verificarAcceso();
    cargarUsuarios();

    // Evento del botón Buscar (el botón verde de tu imagen)
    const btnBuscar = document.querySelector('.btn-primary') || document.querySelector('button[style*="cursor: pointer"]');
    if (btnBuscar) {
        btnBuscar.addEventListener('click', (e) => {
            e.preventDefault();
            filtrarUsuarios();
        });
    }

    // Buscar al escribir
    const inputBusqueda = document.querySelector('input[type="text"]');
    if (inputBusqueda) {
        inputBusqueda.addEventListener('input', filtrarUsuarios);
    }
});