/**
 * footer.js — Carga dinámica del footer desde ajustes_globales
 * Incluir en TODAS las páginas antes de </body>
 * <script src="js/footer.js"></script>  (público)
 * <script src="../js/footer.js"></script> (admin)
 */

const FOOTER_API = 'https://prestamos-xi.vercel.app/api/ajustes'

async function cargarFooter() {
    try {
        const res = await fetch(FOOTER_API)
        if (!res.ok) return  // Si falla, el footer queda con los valores estáticos del HTML

        const s = await res.json()
        // s = { contacto_email: '...', contacto_telefono: '...', ... }

        // ── CONTACTO ──────────────────────────────────────────────
        const elEmail     = document.getElementById('footer-email')
        const elTelefono  = document.getElementById('footer-telefono')
        const elDireccion = document.getElementById('footer-direccion')

        if (elEmail     && s.contacto_email)     elEmail.textContent     = s.contacto_email
        if (elTelefono  && s.contacto_telefono)  elTelefono.textContent  = s.contacto_telefono
        if (elDireccion && s.contacto_direccion) elDireccion.textContent = s.contacto_direccion

        // ── REDES SOCIALES ────────────────────────────────────────
        const elFacebook  = document.getElementById('footer-facebook')
        const elInstagram = document.getElementById('footer-instagram')
        const elTwitter   = document.getElementById('footer-twitter')
        const elTiktok    = document.getElementById('footer-tiktok')

        if (elFacebook  && s.red_facebook)  elFacebook.href  = s.red_facebook
        if (elInstagram && s.red_instagram) elInstagram.href = s.red_instagram
        if (elTwitter   && s.red_twitter)   elTwitter.href   = s.red_twitter
        if (elTiktok    && s.red_tiktok)    elTiktok.href    = s.red_tiktok

        // ── COPYRIGHT ─────────────────────────────────────────────
        const elCopyright = document.getElementById('footer-copyright')
        if (elCopyright && s.copyright_texto) elCopyright.textContent = s.copyright_texto

    } catch (error) {
        console.warn('Footer dinámico no disponible, usando valores estáticos.')
    }
}

document.addEventListener('DOMContentLoaded', cargarFooter)