const API_URL = 'https://prestamos-xi.vercel.app/api';
let marcasLocales = [];

/**
 * INICIALIZACIÓN: Se ejecuta al cargar cualquier página que use este JS
 */
document.addEventListener('DOMContentLoaded', async () => {
    const formulario = document.getElementById('formMarca');
    const tabla = document.getElementById('tablaMarcasBody');
    const buscador = document.getElementById('inputBuscador');
    const inputNombre = document.getElementById('nombreMarca');

    // 1. Cargamos las marcas desde la BD siempre para tener marcasLocales actualizado
    await cargarMarcas();

    // 2. Si existe el buscador (estamos en marca.html)
    if (buscador) {
        buscador.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') filtrarMarcas();
        });
    }

    // 3. Si existe el formulario (estamos en addMarca.html)
    if (formulario) {
        formulario.addEventListener('submit', async (e) => {
            e.preventDefault(); 
            await guardarMarca();
        });
    }

    // 4. Lógica de edición: si hay un ID en la URL, configuramos la interfaz
    const params = new URLSearchParams(window.location.search);
    const idMarca = params.get('id');
    if (idMarca && inputNombre) {
        configurarModoEdicion(idMarca);
    }
});

/**
 * Carga las marcas desde la API y las guarda en el array global marcasLocales
 */
async function cargarMarcas() {
    const tbody = document.getElementById('tablaMarcasBody');
    
    // Solo mostramos el spinner si el elemento existe (en marca.html)
    if (tbody) {
        tbody.innerHTML = `<tr><td colspan="3" style="text-align:center; padding:20px;"><i class="fas fa-spinner fa-spin"></i> Cargando...</td></tr>`;
    }

    try {
        const respuesta = await fetch(`${API_URL}/marcas`);
        const marcas = await respuesta.json();
        
        // Guardamos en la variable global para comparar duplicados después
        marcasLocales = marcas; 
        
        if (tbody) mostrarMarcas(marcas);
    } catch (error) {
        console.error("Error al cargar marcas:", error);
        if (tbody) {
            tbody.innerHTML = `<tr><td colspan="3" style="text-align:center; color:red; padding:20px;">Error al conectar con el servidor</td></tr>`;
        }
    }
}

/**
 * Pinta las marcas en la tabla de la página principal
 */
function mostrarMarcas(marcas) {
    const tbody = document.getElementById('tablaMarcasBody');
    if (!tbody) return;

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
 * Guarda o actualiza la marca validando que no exista en la BD (marcasLocales)
 */
async function guardarMarca() {
    const inputNombre = document.getElementById('nombreMarca');
    const idMarcaHidden = document.getElementById('idMarca');
    
    const idMarca = idMarcaHidden ? idMarcaHidden.value : null;
    const nombreNuevo = inputNombre.value.trim().toUpperCase();

    if (!nombreNuevo) {
        alert("Por favor, ingrese un nombre para la marca.");
        return;
    }

    // --- VALIDACIÓN DE DUPLICADOS CONTRA LA BD ---
    // Comparamos el nombre ingresado con lo que ya existe en marcasLocales
    const existe = marcasLocales.find(m => 
        m.nombre.toUpperCase() === nombreNuevo && m.id_marca != idMarca
    );

    if (existe) {
        alert(`¡Atención! La marca "${nombreNuevo}" ya está registrada en la base de datos.`);
        return; // Bloqueamos el registro
    }

    // --- LÓGICA DE ENVÍO ---
    const metodo = idMarca ? 'PUT' : 'POST';
    const url = idMarca ? `${API_URL}/marcas/${idMarca}` : `${API_URL}/marcas`;

    try {
        const respuesta = await fetch(url, {
            method: metodo,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombre: nombreNuevo })
        });

        if (respuesta.ok) {
            alert(idMarca ? "Marca actualizada correctamente." : "Marca registrada correctamente.");
            window.location.href = 'marca.html'; 
        } else {
            const errorRes = await respuesta.json();
            alert("Error: " + (errorRes.message || "No se pudo procesar la solicitud."));
        }
    } catch (error) {
        console.error("Error en guardarMarca:", error);
        alert("Error de conexión al guardar.");
    }
}

/**
 * Configura la vista de addMarca.html para modo edición
 */
async function configurarModoEdicion(id) {
    const titulo = document.getElementById('tituloPrincipal');
    const subtitulo = document.getElementById('subtituloPrincipal');
    const textoBoton = document.getElementById('textoBoton');
    const inputNombre = document.getElementById('nombreMarca');
    const inputId = document.getElementById('idMarca');

    if (titulo) titulo.innerHTML = `Editar <span style="color: var(--text-muted);">Marca</span>`;
    if (subtitulo) subtitulo.textContent = 'Actualiza la información del fabricante seleccionado.';
    if (textoBoton) textoBoton.textContent = 'ACTUALIZAR MARCA';

    try {
        const respuesta = await fetch(`${API_URL}/marcas/${id}`);
        if (respuesta.ok) {
            const marca = await respuesta.json();
            if (inputNombre) inputNombre.value = marca.nombre || '';
            if (inputId) inputId.value = marca.id_marca || '';
        }
    } catch (error) {
        console.error("Error al cargar datos para edición:", error);
    }
}

/**
 * Redirige a la página de edición
 */
function prepararEdicion(id) {
    window.location.href = `addMarca.html?id=${id}`;
}

/**
 * Elimina una marca de la BD
 */
async function eliminarMarca(id, nombre) {
    if (confirm(`¿Estás seguro de eliminar "${nombre}"?`)) {
        try {
            const res = await fetch(`${API_URL}/marcas/${id}`, { method: 'DELETE' });
            if (res.ok) {
                alert("Eliminado con éxito.");
                cargarMarcas();
            } else {
                alert("No se pudo eliminar. Es posible que esté en uso.");
            }
        } catch (error) {
            alert("Error de conexión.");
        }
    }
}

/**
 * Buscador en tiempo real
 */
function filtrarMarcas() {
    const busqueda = document.getElementById('inputBuscador').value.toLowerCase();
    const filtradas = marcasLocales.filter(m =>
        m.nombre.toLowerCase().includes(busqueda)
    );
    mostrarMarcas(filtradas);
}