document.addEventListener('DOMContentLoaded', () => {
    const token     = localStorage.getItem('token')
    const idRol     = parseInt(localStorage.getItem('id_rol'))
    const nombre    = localStorage.getItem('nombre') || 'Mi Perfil'

    // ── AJUSTAR BOTÓN HEADER ──────────────────────────────────────
    const btnContainer = document.querySelector('.login-container a')
    if (btnContainer) {
        if (token) {
            // Sesión activa — mostrar nombre y redirigir al home correcto
            btnContainer.innerHTML = `<i class="fas fa-user-circle"></i> ${nombre.split(' ')[0]}`
            btnContainer.href      = idRol === 1 ? 'adminDashboard.html' : 'public/home.html'
        } else {
            // Sin sesión — botón normal de login
            btnContainer.innerHTML = `<i class="fas fa-user-circle"></i> Iniciar Sesión`
            btnContainer.href      = 'login.html'
        }
    }
})