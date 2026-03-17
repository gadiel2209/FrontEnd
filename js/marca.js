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
        marcasLocales = marcas; // Guardamos para el buscador
        mostrarMarcas(marcas);
    } catch (error) {
        console.error("Error al cargar marcas:", error);
        tbody.innerHTML = `<tr><td colspan="3" style="text-align:center; color:red; padding:20px;">Error al conectar con el servidor</td></tr>`;
    }
}

/**
 * Pinta las filas en la tabla
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
        fila.innerHTML = `
            <td style="padding: 15px; font-weight: 700;">#${marca.id_marca}</td>
            <td style="padding: 15px; text-transform: uppercase;">${marca.nombre}</td>
            <td style="padding: 15px; text-align: center;">
                <button onclick="prepararEdicion(${marca.id_marca})" style="background:none; border:none; color: var(--primary); cursor:pointer; margin-right: 10px;">
                    <i class="fas fa-edit"></i>
                </button>
                <button onclick="eliminarMarca(${marca.id_marca}, '${marca.nombre}')" style="background:none; border:none; color: #ff4747; cursor:pointer;">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(fila);
    });
}

/**
 * Filtro de búsqueda
 */
function filtrarMarcas() {
    const busqueda = document.getElementById('inputBuscador').value.toLowerCase();
    const filtradas = marcasLocales.filter(m =>
        m.nombre.toLowerCase().includes(busqueda)
    );
    mostrarMarcas(filtradas);
}

/**
 * Eliminar marca
 */
async function eliminarMarca(id, nombre) {
    if (confirm(`¿Estás seguro de eliminar la marca "${nombre}"?`)) {
        try {
            const res = await fetch(`${API_URL}/marcas/${id}`, { method: 'DELETE' });
            if (res.ok) {
                cargarMarcas(); // Recargar tabla
            } else {
                alert("No se puede eliminar la marca porque tiene equipos asociados.");
            }
        } catch (error) {
            alert("Error de conexión al intentar eliminar.");
        }
    }
}

// Inicializar cuando cargue el documento
document.addEventListener('DOMContentLoaded', () => {
    cargarMarcas();

    // Búsqueda en tiempo real
    document.getElementById('inputBuscador').addEventListener('keyup', filtrarMarcas);
});