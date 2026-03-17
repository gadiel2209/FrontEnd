// Usamos la misma constante que en el resto de tu proyecto
const API = 'https://prestamos-xi.vercel.app/api';

async function enviarMensaje() {
    // 1. Capturar elementos
    const btnEnviar = document.querySelector('button[onclick="enviarMensaje()"]');
    const mensajeExito = document.getElementById('mensajeExito');
    const formulario = document.getElementById('formContacto');

    // 2. Obtener valores
    const nombre = document.getElementById('nombre').value.trim();
    const correo = document.getElementById('correo').value.trim();
    const asuntoSelect = document.getElementById('asunto');
    const asunto = asuntoSelect.options[asuntoSelect.selectedIndex].text; // Captura el texto del select
    const mensaje = document.getElementById('mensaje').value.trim();

    // 3. Validación básica
    if (!nombre || !correo || !mensaje) {
        alert('Por favor completa todos los campos requeridos.');
        return;
    }

    // 4. Estado de carga (Visual)
    btnEnviar.disabled = true;
    const originalContent = btnEnviar.innerHTML;
    btnEnviar.innerHTML = `<i class="fas fa-circle-notch fa-spin"></i> ENVIANDO...`;

    try {
        // 5. Petición a la API de Vercel
        const res = await fetch(`${API}/contacto`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombre, correo, asunto, mensaje })
        });

        const data = await res.json();

        if (res.ok) {
            // Éxito
            mensajeExito.style.display = 'block';
            mensajeExito.style.background = 'rgba(34,197,94,0.1)';
            mensajeExito.style.color = '#16a34a';
            mensajeExito.innerHTML = `<i class="fas fa-circle-check"></i> ${data.message || '¡Mensaje enviado correctamente!'}`;
            
            formulario.reset();

            // Ocultar mensaje de éxito tras 5 segundos
            setTimeout(() => {
                mensajeExito.style.display = 'none';
            }, 5000);
        } else {
            throw new Error(data.message || 'Error en el servidor');
        }

    } catch (error) {
        console.error("Error al enviar:", error);
        alert('No se pudo enviar el mensaje: ' + error.message);
    } finally {
        // 6. Restaurar botón
        btnEnviar.disabled = false;
        btnEnviar.innerHTML = originalContent;
    }
}