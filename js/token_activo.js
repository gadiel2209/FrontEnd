document.addEventListener('DOMContentLoaded', () => {
    const token  = localStorage.getItem('token')
    const idRol  = parseInt(localStorage.getItem('id_rol'))
    const nombre = localStorage.getItem('nombre') || 'Mi Perfil'

    const btn = document.getElementById('btnSesion')
    if (!btn) return

    if (token) {
        btn.innerHTML = `<i class="fas fa-user-circle"></i> ${nombre.split(' ')[0]}`
        btn.href      = idRol === 1 ? 'adminDashboard.html' : 'public/home.html'

        // Redirigir automáticamente si hay sesión activa
        window.location.href = idRol === 1 ? 'adminDashboard.html' : 'public/home.html'
    }
})