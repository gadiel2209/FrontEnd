// Configuración de la API
const API = 'https://prestamos-xi.vercel.app/api';
let todosLosEquipos = [];

const token = localStorage.getItem('token');
const id_rol = localStorage.getItem('id_rol');

// ─── SEGURIDAD ───────────────────────────────────────────────────
function verificarAcceso() {
    if (!token || id_rol !== "1") {
        window.location.href = "./public/home.html";
        return;
    }
}

// ─── OBTENER DATOS ───────────────────────────────────────────────
async function cargarInventario() {
    const tablaBody = document.getElementById('tablaInventario');
    tablaBody.innerHTML = `<tr><td colspan="5" class="p-10 text-center"><i class="fas fa-sync fa-spin"></i> Cargando equipos...</td></tr>`;

    try {
        const res = await fetch(`${API}/equipos`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!res.ok) throw new Error('Error al obtener equipos');
        
        todosLosEquipos = await res.json();
        renderizarTabla(todosLosEquipos);

    } catch (error) {
        console.error("Error:", error);
        tablaBody.innerHTML = `<tr><td colspan="5" class="p-10 text-center text-red-500">Error al conectar con la base de datos.</td></tr>`;
    }
}

// ─── RENDERIZAR TABLA (SIN QR NI CATEGORÍA) ──────────────────────
function renderizarTabla(equipos) {
    const tbody = document.getElementById('tablaInventario');
    tbody.innerHTML = '';

    equipos.forEach(equipo => {
        // Lógica de colores para el estado
        let colorEstado = "";
        const estado = equipo.estado?.toLowerCase() || 'desconocido';

        if (estado === 'disponible') colorEstado = "!bg-green-100 !text-green-700";
        else if (estado === 'prestado') colorEstado = "!bg-blue-100 !text-blue-700";
        else colorEstado = "!bg-gray-100 !text-gray-700";

        // IMPORTANTE: Verifica cómo se llama el campo en tu API (ej: equipo.categoria_nombre)
        const categoriaTexto = equipo.categoria_nombre || equipo.categoria || "General";

        const tr = document.createElement('tr');
        tr.className = "border-b hover:bg-slate-50 transition-colors";
        
        tr.innerHTML = `
            <td class="p-4 text-xs text-gray-500">${equipo.id_equipo.toString().padStart(3, '0')}</td>
            <td class="p-4">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 bg-slate-100 rounded flex items-center justify-center text-[var(--primary)]">
                        ${obtenerIcono(equipo.nombre)}
                    </div>
                    <div>
                        <span class="block font-bold text-slate-800">${equipo.nombre}</span>
                        <small class="text-gray-400 uppercase text-[9px]">ID: ${equipo.codigo_qr || 'N/A'}</small>
                    </div>
                </div>
            </td>
            <td class="p-4 text-sm text-slate-600">${equipo.descripcion || '---'}</td>
            <td class="p-4">
                <span class="text-slate-500 font-medium text-sm">${categoriaTexto}</span>
            </td>
            <td class="p-4">
                <span class="badge ${colorEstado} px-3 py-1 rounded-full text-[10px] font-bold uppercase">
                    ${estado}
                </span>
            </td>
            <td class="p-4 text-center">
                <div class="flex justify-center gap-3">
                    <button onclick="verDetalle(${equipo.id_equipo})" class="text-blue-500 hover:scale-110">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button onclick="editarEquipo(${equipo.id_equipo})" class="text-[var(--primary)] hover:scale-110">
                        <i class="fas fa-edit"></i>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Función extra para poner iconos automáticos según el nombre del equipo
function obtenerIcono(nombre) {
    const n = nombre.toLowerCase();
    if (n.includes('monitor') || n.includes('pantalla')) return '<i class="fas fa-desktop"></i>';
    if (n.includes('mouse') || n.includes('raton')) return '<i class="fas fa-mouse"></i>';
    if (n.includes('teclado')) return '<i class="fas fa-keyboard"></i>';
    if (n.includes('laptop') || n.includes('computadora')) return '<i class="fas fa-laptop"></i>';
    if (n.includes('audifonos') || n.includes('diadema')) return '<i class="fas fa-headphones"></i>';
    return '<i class="fas fa-box"></i>';
}

// ─── FILTRADO ─────────────────────────────────────────────────────
function filtrarEquipos() {
    const query = document.getElementById('filtroNombre').value.toLowerCase().trim();
    const filtrados = todosLosEquipos.filter(e => e.nombre.toLowerCase().includes(query));
    renderizarTabla(filtrados);
}

document.addEventListener('DOMContentLoaded', () => {
    verificarAcceso();
    cargarInventario();
    document.getElementById('filtroNombre').addEventListener('input', filtrarEquipos);
});