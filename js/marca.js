const API_URL = 'https://prestamos-xi.vercel.app/api';
let marcasLocales = [];

/**
 * Carga las marcas desde la base de datos
 */
async function cargarMarcas() {
    const tbody = document.getElementById('tablaMarcasBody');
    tbody.innerHTML = `<tr><td colspan="3" style="text-align:center; padding:20px;"><i class="fas fa-spinner fa-spin"></i> Cargando...</td></tr>`;

    try {
        const respuesta = await fetch(`${API_URL}/marcas`);
        const marcas = await respuesta.json();
        marcasLocales = marcas; 
        mostrarMarcas(marcas);
    } catch (error) {
        console.error("Error al cargar marcas:", error);
        tbody.innerHTML = `<tr><td colspan="3" style="text-align:center; color:red; padding:20px;">Error al conectar con el servidor</td></tr>`;
    }
}

/**
 * Pinta las filas en la tabla con los iconos de la captura
 */
function mostrarMarcas(marcas) {
    const tbody = document.getElementById('tablaMarcasBody');
    tbody.innerHTML = '';

    if (marcas.length === 0) {
        tbody.innerHTML = `<tr><td colspan="3" style="text-align:center; padding:20px;">No hay marcas registradas.</td></tr>`;
        return;
    }

    marcas.forEach(marca => {
        const fila = document.createElement('tr');
        fila.style.borderBottom = '1px solid #eee';
        
        // El diseño de los botones coincide con tu imagen: 
        // Editar (Lápiz azul/oscuro) y Eliminar (Basura rojo)
        fila.innerHTML = `
            <td style="padding: 15px; font-weight: 700;">#${marca.id_marca}</td>
            <td style="padding: 15px; text-transform: uppercase;">${marca.nombre}</td>
            <td style="padding: 15px; text-align: center;">
                <button onclick="prepararEdicion(${marca.id_marca})" title="Editar" style="background:none; border:none; color: #334155; cursor:pointer; font-size: 1.1rem; margin-right: 15px;">
                    <i class="fas fa-edit"></i>
                </button>
                <button onclick="eliminarMarca(${marca.id_marca}, '${marca.nombre}')" title="Eliminar" style="background:none; border:none; color: #ef4444; cursor:pointer; font-size: 1.1rem;">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(fila);
    });
}

/**
 * Redirige a la página de agregar pero pasando el ID para editar
 */
function prepararEdicion(id) {
    // Redirigimos a la página addMarca.html con el parámetro id
    window.location.href = `addMarca.html?id=${id}`;
}

/**
 * Eliminar marca con confirmación
 */
async function eliminarMarca(id, nombre) {
    // Usamos una confirmación amigable
    const confirmar = confirm(`¿Estás seguro de que deseas eliminar la marca "${nombre}"?`);
    
    if (confirmar) {
        try {
            const res = await fetch(`${API_URL}/marcas/${id}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                alert("Marca eliminada correctamente.");
                cargarMarcas(); // Recargamos la tabla
            } else {
                const errorData = await res.json();
                alert("No se pudo eliminar: " + (errorData.message || "La marca podría estar en uso por equipos."));
            }
        } catch (error) {
            console.error("Error al eliminar:", error);
            alert("Error de conexión al intentar eliminar.");
        }
    }
}

/**
 * Filtro de búsqueda (Buscador)
 */
function filtrarMarcas() {
    const busqueda = document.getElementById('inputBuscador').value.toLowerCase();
    const filtradas = marcasLocales.filter(m =>
        m.nombre.toLowerCase().includes(busqueda)
    );
    mostrarMarcas(filtradas);
}

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    cargarMarcas();

    // Permitir buscar al presionar Enter en el input
    document.getElementById('inputBuscador').addEventListener('keyup', (e) => {
        if (e.key === 'Enter') filtrarMarcas();
    });
});

document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const idMarca = params.get('id');

    if (idMarca) {
        // Estamos en modo EDICIÓN
        configurarModoEdicion(idMarca);
    }
});

async function configurarModoEdicion(id) {
    // 1. Cambiar los textos de la interfaz
    const titulo = document.getElementById('tituloPrincipal');
    const subtitulo = document.getElementById('subtituloPrincipal');
    const textoBoton = document.getElementById('textoBoton');

    if (titulo) {
        titulo.innerHTML = `Editar <span style="color: var(--text-muted);">Marca</span>`;
    }
    if (subtitulo) {
        subtitulo.textContent = 'Actualiza la información del fabricante seleccionado.';
    }
    if (textoBoton) {
        textoBoton.textContent = 'ACTUALIZAR MARCA';
    }

    // 2. Opcional: Cargar los datos actuales de la marca en el input
    try {
        const respuesta = await fetch(`${API_URL}/marcas/${id}`);
        if (respuesta.ok) {
            const marca = await respuesta.json();
            document.getElementById('nombreMarca').value = marca.nombre;
            document.getElementById('idMarca').value = marca.id_marca;
        }
    } catch (error) {
        console.error("Error al obtener datos de la marca:", error);
    }
}