const API = 'https://prestamos-xi.vercel.app/api';
let todasLasCategorias = []; 

// ─── INICIALIZACIÓN UNIFICADA ──────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
    // Corregido: Buscamos el ID genérico de la tabla o el tbody
    const tabla = document.querySelector('table tbody'); 
    const form = document.getElementById('formCategoria');
    const buscador = document.querySelector('input[placeholder="Buscar categoría..."]');

    // 1. Cargamos las categorías siempre para la validación de duplicados
    await cargarCategorias();

    // 2. Lógica para la página de LISTADO (categoria.html)
    if (tabla) {
        if (buscador) {
            buscador.addEventListener('input', (e) => {
                const filtradas = todasLasCategorias.filter(cat =>
                    cat.nombre.toLowerCase().includes(e.target.value.toLowerCase())
                );
                renderizarCategorias(filtradas);
            });
        }
    }

    // 3. Lógica para la página de FORMULARIO (addCategoria.html)
    if (form) {
        const params = new URLSearchParams(window.location.search);
        const idCat = params.get('id');
        
        if (idCat) {
            configurarModoEdicion(idCat);
        }
        
        form.addEventListener('submit', guardarCategoria);
    }
});

// ─── FUNCIONES DE CARGA Y RENDER ───────────────────────────────────────
async function cargarCategorias() {
    const tbody = document.querySelector('table tbody');
    
    // Solo mostramos "Cargando" si estamos en la página de la tabla
    if (tbody) {
        tbody.innerHTML = `<tr><td colspan="3" style="text-align:center; padding:20px;"><i class="fas fa-circle-notch fa-spin"></i> Cargando...</td></tr>`;
    }

    try {
        const res = await fetch(`${API}/categorias`);
        if (!res.ok) throw new Error('Error al obtener categorías');

        const data = await res.json();
        todasLasCategorias = data; 

        if (tbody) renderizarCategorias(todasLasCategorias);
    } catch (error) {
        console.error("Error:", error);
        if (tbody) {
            tbody.innerHTML = `<tr><td colspan="3" style="text-align:center; color:red; padding:20px;">Error al conectar con el servidor</td></tr>`;
        }
    }
}

function renderizarCategorias(categorias) {
    const tbody = document.querySelector('table tbody');
    if (!tbody) return;

    if (categorias.length === 0) {
        tbody.innerHTML = `<tr><td colspan="3" style="text-align:center; padding:30px;">No se encontraron categorías.</td></tr>`;
        return;
    }

    tbody.innerHTML = categorias.map(cat => `
        <tr style="border-bottom: 1px solid #eee;">
            <td style="padding: 15px 25px; font-weight: 700; color: var(--text-muted);">#${cat.id_categoria}</td>
            <td style="padding: 15px 25px; font-weight: 600; text-transform: uppercase;">${cat.nombre}</td>
            <td style="padding: 15px 25px; text-align: center;">
                <button title="Editar" onclick="editarCategoria(${cat.id_categoria})" 
                    style="background: none; border: none; color: #334155; cursor: pointer; margin-right: 15px; font-size: 1.1rem;">
                    <i class="fas fa-edit"></i>
                </button>
                <button title="Eliminar" onclick="eliminarCategoria(${cat.id_categoria}, '${cat.nombre}')" 
                    style="background: none; border: none; color: #ef4444; cursor: pointer; font-size: 1.1rem;">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// ─── LÓGICA DE GUARDADO ───────────────────────────────────────────────
async function guardarCategoria(e) {
    e.preventDefault();
    
    const inputNombre = document.getElementById('nombreCategoria');
    const inputId = document.getElementById('idCategoria');
    
    if (!inputNombre) return;

    const id = inputId ? inputId.value : null;
    const nombreNuevo = inputNombre.value.trim().toUpperCase();

    if (!nombreNuevo) {
        alert("Por favor, ingrese un nombre para la categoría.");
        return;
    }

    const existe = todasLasCategorias.find(c => 
        c.nombre.toUpperCase() === nombreNuevo && c.id_categoria != id
    );

    if (existe) {
        alert(`¡Atención! La categoría "${nombreNuevo}" ya existe en la base de datos.`);
        return;
    }

    const metodo = id ? 'PUT' : 'POST';
    const url = id ? `${API}/categorias/${id}` : `${API}/categorias`;

    try {
        const res = await fetch(url, {
            method: metodo,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombre: nombreNuevo })
        });

        if (res.ok) {
            alert(id ? 'Categoría actualizada con éxito' : 'Categoría registrada con éxito');
            window.location.href = 'categoria.html';
        } else {
            const data = await res.json();
            alert(data.message || 'Error al procesar la solicitud');
        }
    } catch (error) {
        alert('Error de conexión con el servidor');
    }
}

// ─── FUNCIONES DE APOYO ──────────────────────────────────────────────
async function configurarModoEdicion(id) {
    const titulo = document.getElementById('tituloPrincipal');
    const subtitulo = document.getElementById('subtituloPrincipal');
    const textoBoton = document.getElementById('textoBoton');
    const inputId = document.getElementById('idCategoria');
    const inputNombre = document.getElementById('nombreCategoria');

    if (titulo) titulo.innerHTML = `Editar <span style="color: var(--text-muted);">Categoría</span>`;
    if (subtitulo) subtitulo.textContent = 'Actualiza el nombre de la clasificación seleccionada.';
    if (textoBoton) textoBoton.textContent = 'ACTUALIZAR CATEGORÍA';
    if (inputId) inputId.value = id;

    try {
        const res = await fetch(`${API}/categorias/${id}`);
        if (res.ok) {
            const cat = await res.json();
            if (inputNombre) inputNombre.value = cat.nombre;
        } else if (res.status === 404) {
            alert("La categoría que intentas editar ya no existe en la base de datos.");
            window.location.href = 'categoria.html';
        }
    } catch (error) {
        console.error("Error al cargar categoría:", error);
    }
}

function editarCategoria(id) {
    window.location.href = `addCategoria.html?id=${id}`;
}

async function eliminarCategoria(id, nombre) {
    if (!confirm(`¿Estás seguro de eliminar la categoría "${nombre}"?`)) return;

    try {
        if (!id) {
            alert("Error: ID de categoría no encontrado.");
            return;
        }

        const res = await fetch(`${API}/categorias/${id}`, { 
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' }
        });

        if (res.ok) {
            alert('Categoría eliminada correctamente');
            await cargarCategorias(); 
        } else {
            const data = await res.json().catch(() => ({}));
            alert(`Error ${res.status}: ${data.message || 'No se puede eliminar (posiblemente tiene equipos asociados)'}`);
        }
    } catch (error) {
        console.error("Error en DELETE:", error);
        alert('Error de conexión al intentar eliminar.');
    }
}