const API_BASE = 'https://prestamos-xi.vercel.app/api/informacion'

const token = localStorage.getItem('token')
const id_rol = localStorage.getItem('id_rol')
const esAdmin = token && id_rol === '1'

// Cambia nav y header según el rol
if (esAdmin) {
    document.getElementById('navAdmin').style.display = 'block'
    document.getElementById('navPublico').style.display = 'none'
    document.getElementById('headerAdmin').style.display = 'flex'
    document.getElementById('headerPublico').style.display = 'none'
}

async function cargarQuienes() {
    try {
        const res = await fetch(`${API_BASE}/`)
        const data = await res.json()
        const texto = data.quienes?.descricion || 'Contenido no disponible.'
        const id = data.quienes?.id

        // Siempre muestra el texto
        document.getElementById('textoQuienes').textContent = texto

        // Si es admin, muestra el formulario de edición
        if (esAdmin) {
            document.getElementById('seccionAdmin').style.display = 'block'
            document.getElementById('textareaContenido').value = texto
            document.getElementById('textareaContenido').dataset.id = id
        }
    } catch (err) {
        document.getElementById('textoQuienes').textContent =
            'LoanWare es un sistema creado para gestionar el préstamo de equipos de cómputo ' +
            'dentro de instituciones educativas.'
        console.error(err)
    }
}

async function guardarQuienes(e) {
    e.preventDefault()
    const textarea = document.getElementById('textareaContenido')
    const id = textarea.dataset.id
    const descripcion = textarea.value.trim()

    if (!descripcion) return alert('El contenido no puede estar vacío.')

    try {
        const res = await fetch(`${API_BASE}/quienes/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ descripcion })
        })
        const data = await res.json()
        alert(data.message)
        document.getElementById('textoQuienes').textContent = descripcion
    } catch (err) {
        alert('Error al guardar los cambios.')
        console.error(err)
    }
}

// Solo agrega el listener si es admin
const form = document.getElementById('formVision')
if (esAdmin && form) {
    form.addEventListener('submit', guardarVision)
}

cargarQuienes()