const API_INV = 'https://prestamos-xi.vercel.app/api';
const CLOUDINARY_URL = 'https://api.cloudinary.com/v1_1/TU_CLOUD_NAME/image/upload';
const CLOUDINARY_PRESET = 'TU_UPLOAD_PRESET'; // Cambia esto por tu unsigned preset

let todosLosEquipos = [];
let listaCategorias = [];

const token = localStorage.getItem('token');
const id_rol = localStorage.getItem('id_rol');

// ─── SEGURIDAD ───────────────────────────────────────────────────
function verificarAcceso() {
    if (!token || id_rol !== "1") {
        window.location.href = "./public/home.html";
    }
}

// ─── CARGAR CATEGORÍAS ───────────────────────────────────────────
async function cargarCategorias() {
    try {
        const res = await fetch(`${API_INV}/categorias`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error();
        listaCategorias = await res.json();
    } catch {
        console.warn("No se pudieron cargar las categorías.");
    }
}

function getCategoriaOptions(selectedId = '') {
    return listaCategorias.map(c =>
        `<option value="${c.id_categoria}" ${c.id_categoria == selectedId ? 'selected' : ''}>${c.nombre}</option>`
    ).join('');
}

// ─── CARGAR INVENTARIO ───────────────────────────────────────────
async function cargarInventario() {
    const tablaBody = document.getElementById('tablaInventario');
    tablaBody.innerHTML = `<tr><td colspan="6" class="p-10 text-center text-slate-400"><i class="fas fa-sync fa-spin mr-2"></i> Cargando equipos...</td></tr>`;

    try {
        const res = await fetch(`${API_INV}/equipos`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error();
        todosLosEquipos = await res.json();
        renderizarTabla(todosLosEquipos);
    } catch {
        tablaBody.innerHTML = `<tr><td colspan="6" class="p-10 text-center text-red-400"><i class="fas fa-exclamation-triangle mr-2"></i>Error al conectar con la base de datos.</td></tr>`;
    }
}

// ─── RENDERIZAR TABLA ─────────────────────────────────────────────
function renderizarTabla(equipos) {
    const tbody = document.getElementById('tablaInventario');
    tbody.innerHTML = '';

    if (equipos.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="p-10 text-center text-slate-400">No se encontraron equipos.</td></tr>`;
        return;
    }

    equipos.forEach(equipo => {
        const estado = equipo.estado?.toLowerCase() || 'desconocido';
        let badgeClass = "bg-gray-100 text-gray-600";
        if (estado === 'disponible') badgeClass = "bg-green-100 text-green-700";
        else if (estado === 'prestado') badgeClass = "bg-blue-100 text-blue-700";
        else if (estado === 'dañado') badgeClass = "bg-red-100 text-red-700";
        else if (estado === 'mantenimiento') badgeClass = "bg-yellow-100 text-yellow-700";

        const categoriaTexto = equipo.categoria || "General";
        const imgHTML = equipo.ruta_imagen
            ? `<img src="${equipo.ruta_imagen}" alt="${equipo.nombre}" class="w-10 h-10 rounded object-cover">`
            : `<div class="w-10 h-10 bg-slate-100 rounded flex items-center justify-center text-[var(--primary)]">${obtenerIcono(equipo.nombre)}</div>`;

        const tr = document.createElement('tr');
        tr.className = "border-b hover:bg-slate-50 transition-colors";
        tr.innerHTML = `
            <td class="p-3 text-xs text-gray-400 w-12">${equipo.id_equipo.toString().padStart(3, '0')}</td>
            <td class="p-3 w-64">
                <div class="flex items-center gap-3">
                    ${imgHTML}
                    <div>
                        <span class="block font-semibold text-slate-800 text-sm leading-tight">${equipo.nombre}</span>
                        <small class="text-gray-400 text-[10px] uppercase">${equipo.codigo_qr || 'Sin QR'}</small>
                    </div>
                </div>
            </td>
            <td class="p-3 text-sm text-slate-500 max-w-xs truncate">${equipo.descripcion || '---'}</td>
            <td class="p-3 text-sm text-slate-600 w-28">${categoriaTexto}</td>
            <td class="p-3 w-32">
                <span class="inline-block px-2 py-1 rounded-full text-[10px] font-bold uppercase ${badgeClass}">
                    ${estado}
                </span>
            </td>
            <td class="p-3 w-28">
                <div class="flex items-center gap-3">
                    <button onclick="verDetalle(${equipo.id_equipo})" title="Ver" class="text-slate-400 hover:text-blue-500 transition-colors hover:scale-110">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button onclick="abrirModalEditar(${equipo.id_equipo})" title="Editar" class="text-slate-400 hover:text-[var(--primary)] transition-colors hover:scale-110">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="confirmarEliminar(${equipo.id_equipo}, '${equipo.nombre.replace(/'/g, "\\'")}')" title="Eliminar" class="text-slate-400 hover:text-red-500 transition-colors hover:scale-110">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function obtenerIcono(nombre) {
    const n = nombre.toLowerCase();
    if (n.includes('monitor') || n.includes('pantalla')) return '<i class="fas fa-desktop"></i>';
    if (n.includes('mouse') || n.includes('raton')) return '<i class="fas fa-mouse"></i>';
    if (n.includes('teclado')) return '<i class="fas fa-keyboard"></i>';
    if (n.includes('laptop') || n.includes('computadora')) return '<i class="fas fa-laptop"></i>';
    if (n.includes('audifonos') || n.includes('diadema')) return '<i class="fas fa-headphones"></i>';
    if (n.includes('proyector')) return '<i class="fas fa-projector"></i>';
    return '<i class="fas fa-box"></i>';
}

// ─── FILTRADO ─────────────────────────────────────────────────────
function filtrarEquipos() {
    const query = document.getElementById('filtroNombre').value.toLowerCase().trim();
    const filtrados = todosLosEquipos.filter(e => e.nombre.toLowerCase().includes(query));
    renderizarTabla(filtrados);
}

// ─── MODAL VER DETALLE ────────────────────────────────────────────
async function verDetalle(id) {
    const equipo = todosLosEquipos.find(e => e.id_equipo === id);
    if (!equipo) return;

    const estado = equipo.estado?.toLowerCase() || 'desconocido';
    let badgeClass = "bg-gray-100 text-gray-600";
    if (estado === 'disponible') badgeClass = "bg-green-100 text-green-700";
    else if (estado === 'prestado') badgeClass = "bg-blue-100 text-blue-700";
    else if (estado === 'dañado') badgeClass = "bg-red-100 text-red-700";
    else if (estado === 'mantenimiento') badgeClass = "bg-yellow-100 text-yellow-700";

    const imgHTML = equipo.ruta_imagen
        ? `<img src="${equipo.ruta_imagen}" alt="${equipo.nombre}" class="w-full h-48 object-cover rounded-lg mb-4">`
        : `<div class="w-full h-32 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 text-4xl mb-4">${obtenerIcono(equipo.nombre)}</div>`;

    document.getElementById('modalVerContenido').innerHTML = `
        ${imgHTML}
        <div class="grid grid-cols-2 gap-4 text-sm">
            <div><span class="text-gray-400 block text-xs uppercase font-bold mb-1">ID</span><span class="font-semibold">${equipo.id_equipo.toString().padStart(3, '0')}</span></div>
            <div><span class="text-gray-400 block text-xs uppercase font-bold mb-1">Código QR</span><span class="font-mono text-xs bg-slate-100 px-2 py-1 rounded">${equipo.codigo_qr || 'N/A'}</span></div>
            <div class="col-span-2"><span class="text-gray-400 block text-xs uppercase font-bold mb-1">Nombre</span><span class="font-semibold text-[var(--primary)]">${equipo.nombre}</span></div>
            <div class="col-span-2"><span class="text-gray-400 block text-xs uppercase font-bold mb-1">Descripción</span><span>${equipo.descripcion || '---'}</span></div>
            <div><span class="text-gray-400 block text-xs uppercase font-bold mb-1">Categoría</span><span>${equipo.categoria || 'General'}</span></div>
            <div><span class="text-gray-400 block text-xs uppercase font-bold mb-1">Estado</span><span class="inline-block px-2 py-1 rounded-full text-[10px] font-bold uppercase ${badgeClass}">${estado}</span></div>
            <div class="col-span-2"><span class="text-gray-400 block text-xs uppercase font-bold mb-1">Fecha de Registro</span><span>${equipo.fecha_registro ? new Date(equipo.fecha_registro).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' }) : '---'}</span></div>
        </div>
    `;
    abrirModal('modalVer');
}

// ─── MODAL AGREGAR ────────────────────────────────────────────────
function abrirModalAgregar() {
    document.getElementById('modalFormTitulo').innerHTML = '<i class="fas fa-box mr-2" style="color:var(--accent)"></i> Nuevo Equipo';
    document.getElementById('equipoIdHidden').value = '';
    document.getElementById('inputNombre').value = '';
    document.getElementById('inputDescripcion').value = '';
    document.getElementById('inputCodigoQR').value = '';
    document.getElementById('inputEstado').value = 'disponible';
    document.getElementById('inputRutaImagen').value = '';
    document.getElementById('inputImagen').value = '';
    document.getElementById('previewImg').classList.add('hidden');
    document.getElementById('categoriaSelect').innerHTML =
        `<option value="">Selecciona una categoría</option>${getCategoriaOptions()}`;
    abrirModal('modalForm');
}

// ─── MODAL EDITAR ─────────────────────────────────────────────────
async function abrirModalEditar(id) {
    const equipo = todosLosEquipos.find(e => e.id_equipo === id);
    if (!equipo) return;

    document.getElementById('modalFormTitulo').textContent = 'Editar Equipo';
    document.getElementById('equipoIdHidden').value = equipo.id_equipo;
    document.getElementById('inputNombre').value = equipo.nombre || '';
    document.getElementById('inputDescripcion').value = equipo.descripcion || '';
    document.getElementById('inputCodigoQR').value = equipo.codigo_qr || '';
    document.getElementById('inputEstado').value = equipo.estado || 'disponible';
    document.getElementById('categoriaSelect').innerHTML = `<option value="">Selecciona una categoría</option>${getCategoriaOptions(equipo.id_categoria)}`;

    const preview = document.getElementById('previewImg');
    if (equipo.ruta_imagen) {
        preview.src = equipo.ruta_imagen;
        preview.classList.remove('hidden');
        document.getElementById('inputRutaImagen').value = equipo.ruta_imagen;
    } else {
        preview.classList.add('hidden');
        document.getElementById('inputRutaImagen').value = '';
    }

    abrirModal('modalForm');
}

// ─── SUBIR IMAGEN A CLOUDINARY ────────────────────────────────────
async function subirImagenCloudinary(file) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_PRESET);

    const res = await fetch(CLOUDINARY_URL, { method: 'POST', body: formData });
    if (!res.ok) throw new Error('Error al subir imagen');
    const data = await res.json();
    return data.secure_url;
}

// Preview de imagen al seleccionar
document.addEventListener('DOMContentLoaded', () => {
    verificarAcceso();
    cargarCategorias().then(() => cargarInventario());
    document.getElementById('filtroNombre').addEventListener('input', filtrarEquipos);

    document.getElementById('inputImagen').addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const preview = document.getElementById('previewImg');
        preview.src = URL.createObjectURL(file);
        preview.classList.remove('hidden');
    });
});

// ─── GUARDAR (CREAR / EDITAR) ─────────────────────────────────────
async function guardarEquipo() {
    const id = document.getElementById('equipoIdHidden').value;
    const nombre = document.getElementById('inputNombre').value.trim();
    const descripcion = document.getElementById('inputDescripcion').value.trim();
    const codigo_qr = document.getElementById('inputCodigoQR').value.trim();
    const id_categoria = document.getElementById('categoriaSelect').value;
    const estado = document.getElementById('inputEstado').value;
    const fileInput = document.getElementById('inputImagen');
    let ruta_imagen = document.getElementById('inputRutaImagen').value;

    if (!nombre || !id_categoria) {
        mostrarToast('Nombre y categoría son obligatorios.', 'error');
        return;
    }

    const btnGuardar = document.getElementById('btnGuardar');
    btnGuardar.disabled = true;
    btnGuardar.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Guardando...';

    try {
        // Subir imagen si se seleccionó una nueva
        if (fileInput.files[0]) {
            ruta_imagen = await subirImagenCloudinary(fileInput.files[0]);
        }

        const payload = { nombre, descripcion, ruta_imagen, codigo_qr, id_categoria: Number(id_categoria), estado };
        const url = id ? `${API_INV}/equipos/${id}` : `${API_INV}/equipos`;
        const method = id ? 'PUT' : 'POST';

        const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(payload)
        });

        if (!res.ok) throw new Error();

        mostrarToast(id ? 'Equipo actualizado correctamente.' : 'Equipo creado correctamente.', 'success');
        cerrarModal('modalForm');
        await cargarInventario();
    } catch {
        mostrarToast('Ocurrió un error al guardar. Intenta de nuevo.', 'error');
    } finally {
        btnGuardar.disabled = false;
        btnGuardar.innerHTML = '<i class="fas fa-save mr-2"></i> Guardar';
    }
}

// ─── ELIMINAR ─────────────────────────────────────────────────────
function confirmarEliminar(id, nombre) {
    document.getElementById('eliminarNombre').textContent = nombre;
    document.getElementById('btnConfirmarEliminar').onclick = () => eliminarEquipo(id);
    abrirModal('modalEliminar');
}

async function eliminarEquipo(id) {
    const btn = document.getElementById('btnConfirmarEliminar');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Eliminando...';

    try {
        const res = await fetch(`${API_INV}/equipos/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error();
        mostrarToast('Equipo eliminado correctamente.', 'success');
        cerrarModal('modalEliminar');
        await cargarInventario();
    } catch {
        mostrarToast('No se pudo eliminar el equipo.', 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-trash mr-2"></i> Sí, eliminar';
    }
}

// ─── HELPERS DE MODALES ───────────────────────────────────────────
function abrirModal(id) {
    const m = document.getElementById(id);
    m.classList.remove('hidden');
    m.classList.add('flex');
    document.body.classList.add('overflow-hidden');
}

function cerrarModal(id) {
    const m = document.getElementById(id);
    m.classList.add('hidden');
    m.classList.remove('flex');
    document.body.classList.remove('overflow-hidden');
}

// Cerrar modal al hacer clic en el backdrop
document.addEventListener('click', (e) => {
    ['modalVer', 'modalForm', 'modalEliminar'].forEach(id => {
        const modal = document.getElementById(id);
        if (e.target === modal) cerrarModal(id);
    });
});

// ─── TOAST NOTIFICATION ───────────────────────────────────────────
function mostrarToast(mensaje, tipo = 'success') {
    const toast = document.getElementById('toastNotif');
    const icon = tipo === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle';
    const color = tipo === 'success' ? 'bg-green-600' : 'bg-red-500';
    toast.className = `fixed bottom-6 right-6 z-[9999] flex items-center gap-3 px-5 py-3 rounded-xl shadow-xl text-white text-sm font-medium transition-all duration-300 ${color}`;
    toast.innerHTML = `<i class="fas ${icon}"></i> ${mensaje}`;
    toast.classList.remove('translate-y-20', 'opacity-0');
    setTimeout(() => {
        toast.classList.add('translate-y-20', 'opacity-0');
    }, 3000);
}