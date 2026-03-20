const API = 'https://prestamos-xi.vercel.app/api';
const token = localStorage.getItem('token');

// 1. Protección de ruta: Si no hay token, redirigir al login
if (!token) {
    window.location.href = '../login.html';
}

function obtenerIdDesdeToken(token) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const payload = JSON.parse(window.atob(base64));
        return payload.id; // Ajusta 'id' según cómo lo guarde tu backend en el JWT
    } catch (error) {
        console.error("Error al decodificar el token:", error);
        return null;
    }
}

async function cargarPerfil() {
    // Obtenemos el ID del usuario (puedes usar el del token o uno fijo para pruebas)
    const userId = obtenerIdDesdeToken(token) || 22; 

    try {
        // Usamos la ruta que indicaste: /api/usuario/ID
        const res = await fetch(`${API}/usuario/${userId}`, {
            method: 'GET',
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!res.ok) {
            console.error("No se pudo obtener la información del usuario");
            return;
        }

        const data = await res.json();
        console.log("Datos del usuario:", data);

        // --- Inyección en el HTML ---

        // Nombre en el saludo/avatar
        const perfilNombre = document.getElementById('perfilNombre');
        if (perfilNombre) perfilNombre.textContent = data.nombre || 'Usuario';

        // Letra inicial del Avatar
        const avatarLetra = document.getElementById('avatarLetra');
        if (avatarLetra && data.nombre) {
            avatarLetra.textContent = data.nombre.charAt(0).toUpperCase();
        }

        // Etiquetas de Rol
        const rolTexto = data.rol || (data.id_rol === 1 ? 'Administrador' : 'Usuario');
        const perfilRolTag = document.getElementById('perfilRolTag');
        if (perfilRolTag) perfilRolTag.textContent = rolTexto;

        // Nombre Completo (Concatenación de campos)
        const nombreComp = `${data.nombre || ''} ${data.ap_paterno || ''} ${data.ap_materno || ''}`.trim();
        const elNombreComp = document.getElementById('perfilNombreCompleto');
        if (elNombreComp) elNombreComp.textContent = nombreComp || 'No disponible';

        // Usuario y Correo
        const elUsuario = document.getElementById('perfilUsuario');
        if (elUsuario) elUsuario.textContent = data.usuario ? `@${data.usuario}` : '—';

        const elCorreo = document.getElementById('perfilCorreo');
        if (elCorreo) elCorreo.textContent = data.correo || '—';

        const elRol = document.getElementById('perfilRol');
        if (elRol) elRol.textContent = rolTexto;

    } catch (error) {
        console.error('Error de conexión:', error);
    }
}

// Función auxiliar para mostrar mensajes en el cuadro de alerta
function mostrarAlerta(msj, tipo) {
    const alerta = document.getElementById('alertaPerfil');
    if (!alerta) return;

    alerta.style.display = 'flex';
    alerta.textContent = msj;
    
    if (tipo === 'error') {
        alerta.style.backgroundColor = '#fecaca'; // Rojo claro
        alerta.style.color = '#b91c1c';
    } else {
        alerta.style.backgroundColor = '#dcfce7'; // Verde claro
        alerta.style.color = '#15803d';
    }

    // Ocultar después de 4 segundos
    setTimeout(() => { alerta.style.display = 'none'; }, 4000);
}

// --- Función para cambiar contraseña ---
async function cambiarPassword() {
    const passNueva = document.getElementById('passwordNueva').value;
    const userId = obtenerIdDesdeToken(token) || 34; // Usando el 34 que sale en tu consola

    if (!passNueva) {
        mostrarAlerta("Escribe una nueva contraseña", "error");
        return;
    }

    try {
        const res = await fetch(`${API}/usuario/${userId}`, { 
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                password: passNueva // <--- EL NOMBRE DEBE SER "password"
            })
        });

        if (res.ok) {
            mostrarAlerta("¡Contraseña actualizada!", "success");
            document.getElementById('formPassword').reset();
        } else {
            const errorData = await res.json();
            mostrarAlerta(errorData.message || "Error al actualizar", "error");
        }
    } catch (error) {
        mostrarAlerta("Error de conexión", "error");
    }
}

function cerrarSesion() {
    // 1. Extraemos el rol antes de borrar los datos
    // Intentamos obtenerlo del objeto data si lo guardaste, 
    // o directamente del elemento HTML donde se mostró.
    const perfilRolTag = document.getElementById('perfilRolTag');
    const rol = perfilRolTag ? perfilRolTag.textContent.toLowerCase() : '';

    // 2. Limpiar el almacenamiento
    localStorage.removeItem('token');
    localStorage.clear();

    // 3. Redirección condicional
    if (rol.includes('admin')) {
        // Si el rol es Administrador
        window.location.href = '../login.html'; 
    } else {
        // Si es usuario normal o cualquier otro
        window.location.href = '../login.html';
    }
}

// Ejecutar automáticamente cuando el HTML esté listo
document.addEventListener('DOMContentLoaded', cargarPerfil);
