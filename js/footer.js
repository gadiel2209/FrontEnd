// 1. Declarar la constante API (Asegúrate de que sea tu URL real)
const API_FOOTER = 'https://prestamos-xi.vercel.app/api';

async function cargarFooter() {
    try {
        const res = await fetch(`${API_URL}/ajustes`);
        if (res.ok) {
            const settings = await res.json();
            const elEmail = document.getElementById('footer-email');
            const elTel = document.getElementById('footer-telefono');
            const elCopy = document.getElementById('footer-copyright');

            if (elEmail && settings.email) elEmail.textContent = settings.email;
            if (elTel && settings.telefono) elTel.textContent = settings.telefono;
            if (elCopy && settings.copyright) elCopy.textContent = settings.copyright;
        }
    } catch (error) {
        console.error("Error al cargar footer:", error);
    }
}

// Arranca al cargar la página
document.addEventListener('DOMContentLoaded', () => {
    cargarFooter();
});