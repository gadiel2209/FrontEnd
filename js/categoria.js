const API = 'https://prestamos-xi.vercel.app/api';

let todasLasCategorias = [];

// ─── RENDERIZAR TABLA DE CATEGORÍAS ──────────────────────────────
function renderizarCategorias(categorias) {
    const tbody = document.querySelector('table tbody');

    if (categorias.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="3" style="text-align: center; padding: 30px; color: var(--text-muted);">
                    <i class="fas fa-folder-open" style="font-size: 2rem; display: block; margin-bottom: 10px; opacity: 0.5;"></i>
                    No se encontraron categorías.
                </td>
            </tr>`;
        return;
    }

    tbody.innerHTML = categorias.map(cat => `
        <tr style="border-bottom: 1px solid #eee;">
            <td style="padding: 15px 25px; font-weight: 700; color: var(--text-muted);">#${cat.id_categoria || cat.id}</td>
            <td style="padding: 15px 25px; font-weight: 600;">${cat.nombre}</td>
            <td style="padding: 15px 25px; text-align: center;">
                <button title="Editar" onclick="editarCategoria(${cat.id_categoria || cat.id})" 
                    style="background: none; border: none; color: var(--primary); cursor: pointer; margin-right: 10px;">
                    <i class="fas fa-edit"></i>
                </button>
                <button title="Eliminar" onclick="eliminarCategoria(${cat.id_categoria || cat.id}, '${cat.nombre}')" 
                    style="background: none; border: none; color: #ff4b4b; cursor: pointer;">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// ─── CARGAR DATOS DESDE LA API ────────────────────────────────────
async function cargarCategorias() {
    const tbody = document.querySelector('table tbody');
    tbody.innerHTML = `<tr><td colspan="3" style="text-align:center; padding:20px;"><i class="fas fa-circle-notch fa-spin"></i> Cargando...</td></tr>`;

    try {
        const res = await fetch(`${API}/categorias`);
        if (!res.ok) throw new Error('Error al obtener categorías');

        const data = await res.json();
        todasLasCategorias = data;
        renderizarCategorias(todasLasCategorias);
    } catch (error) {
        console.error("Error:", error);
        tbody.innerHTML = `<tr><td colspan="3" style="text-align:center; color:red; padding:20px;">Error al conectar con el servidor</td></tr>`;
    }
}

// ─── FILTRADO (BÚSQUEDA) ──────────────────────────────────────────
function buscarCategoria(event) {
    event.preventDefault();
    const texto = document.querySelector('input[placeholder="Buscar categoría..."]').value.toLowerCase();

    const filtradas = todasLasCategorias.filter(cat =>
        cat.nombre.toLowerCase().includes(texto)
    );

    renderizarCategorias(filtradas);
}

// ─── FUNCIONES DE ACCIÓN (Provisionales) ──────────────────────────
function editarCategoria(id) {
    console.log("Editando categoría con ID:", id);
    // Aquí podrías abrir un modal con un formulario
}

async function eliminarCategoria(id, nombre) {
    if (!confirm(`¿Estás seguro de eliminar la categoría "${nombre}"?`)) return;

    try {
        const res = await fetch(`${API}/categorias/${id}`, { method: 'DELETE' });
        if (res.ok) {
            alert('Categoría eliminada');
            cargarCategorias(); // Recargar tabla
        } else {
            const data = await res.json();
            alert(data.message || 'No se pudo eliminar');
        }
    } catch (error) {
        alert('Error de conexión');
    }
}

// ─── INICIALIZACIÓN ───────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    cargarCategorias();

    // Escuchar el evento del buscador
    const formBusqueda = document.querySelector('.hero-btns');
    formBusqueda.addEventListener('submit', buscarCategoria);

    // Opcional: buscar mientras se escribe
    document.querySelector('input[placeholder="Buscar categoría..."]').addEventListener('input', (e) => {
        const filtradas = todasLasCategorias.filter(cat =>
            cat.nombre.toLowerCase().includes(e.target.value.toLowerCase())
        );
        renderizarCategorias(filtradas);
    });
});