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


// ─── INICIALIZACIÓN ───────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    // Verificar si estamos en la página de lista o en la de agregar/editar
    const tabla = document.querySelector('table tbody');
    const form = document.getElementById('formCategoria');

    if (tabla) {
        cargarCategorias(); // Estamos en la lista
    }

    if (form) {
        // Estamos en el formulario, revisar si hay ID para EDITAR
        const params = new URLSearchParams(window.location.search);
        const idCat = params.get('id');
        if (idCat) {
            configurarModoEdicion(idCat);
        }
        
        // Manejar el guardado (Crear o Actualizar)
        form.addEventListener('submit', guardarCategoria);
    }
});

/**
 * Cambia los textos si se detecta un ID en la URL
 */
async function configurarModoEdicion(id) {
    document.getElementById('tituloPrincipal').innerHTML = `Editar <span style="color: var(--text-muted);">Categoría</span>`;
    document.getElementById('subtituloPrincipal').textContent = 'Actualiza el nombre de la clasificación seleccionada.';
    document.getElementById('textoBoton').textContent = 'ACTUALIZAR CATEGORÍA';
    document.getElementById('idCategoria').value = id;

    try {
        const res = await fetch(`${API}/categorias/${id}`);
        if (res.ok) {
            const cat = await res.json();
            document.getElementById('nombreCategoria').value = cat.nombre;
        }
    } catch (error) {
        console.error("Error al cargar categoría:", error);
    }
}

/**
 * Función para redirigir a la edición (Se llama desde la tabla)
 */
function editarCategoria(id) {
    window.location.href = `addCategoria.html?id=${id}`;
}

/**
 * Lógica para GUARDAR o ACTUALIZAR
 */
async function guardarCategoria(e) {
    e.preventDefault();
    const id = document.getElementById('idCategoria').value;
    const nombre = document.getElementById('nombreCategoria').value;
    
    const metodo = id ? 'PUT' : 'POST';
    const url = id ? `${API}/categorias/${id}` : `${API}/categorias`;

    try {
        const res = await fetch(url, {
            method: metodo,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombre })
        });

        if (res.ok) {
            alert(id ? 'Categoría actualizada' : 'Categoría guardada');
            window.location.href = 'categoria.html';
        } else {
            alert('Error al procesar la solicitud');
        }
    } catch (error) {
        alert('Error de conexión');
    }
}

// ─── CARGAR DATOS (Para la tabla) ──────────────────────────────────
async function cargarCategorias() {
    const tbody = document.querySelector('table tbody');
    if (!tbody) return;
    
    tbody.innerHTML = `<tr><td colspan="3" style="text-align:center; padding:20px;"><i class="fas fa-circle-notch fa-spin"></i> Cargando...</td></tr>`;

    try {
        const res = await fetch(`${API}/categorias`);
        const data = await res.json();
        todasLasCategorias = data;
        renderizarCategorias(data);
    } catch (error) {
        tbody.innerHTML = `<tr><td colspan="3" style="text-align:center; color:red; padding:20px;">Error al conectar</td></tr>`;
    }
}

function renderizarCategorias(categorias) {
    const tbody = document.querySelector('table tbody');
    tbody.innerHTML = categorias.map(cat => `
        <tr style="border-bottom: 1px solid #eee;">
            <td style="padding: 15px 25px; font-weight: 700; color: var(--text-muted);">#${cat.id_categoria}</td>
            <td style="padding: 15px 25px; font-weight: 600;">${cat.nombre}</td>
            <td style="padding: 15px 25px; text-align: center;">
                <button title="Editar" onclick="editarCategoria(${cat.id_categoria})" 
                    style="background: none; border: none; color: #334155; cursor: pointer; margin-right: 15px;">
                    <i class="fas fa-edit"></i>
                </button>
                <button title="Eliminar" onclick="eliminarCategoria(${cat.id_categoria}, '${cat.nombre}')" 
                    style="background: none; border: none; color: #ef4444; cursor: pointer;">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// ... Mantén tus funciones de eliminarCategoria y buscarCategoria iguales ...