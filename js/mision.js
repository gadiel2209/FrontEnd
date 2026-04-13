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

async function cargarMision() {
    try {
        const res = await fetch(`${API_BASE}/`)
        const data = await res.json()
        const texto = data.mision?.descripcion || 'Contenido no disponible.'
        const id = data.mision?.id

        document.getElementById('textoMision').textContent = texto

        if (esAdmin) {
            document.getElementById('seccionAdmin').style.display = 'block'
            document.querySelector('textarea[name="contenido"]').value = texto
            document.querySelector('textarea[name="contenido"]').dataset.id = id
        }
    } catch (err) {
        document.getElementById('textoMision').textContent = 'No se pudo cargar la misión.'
        console.error(err)
    }
}

async function guardarMision(e) {
    e.preventDefault()
    const textarea = document.querySelector('textarea[name="contenido"]')
    const id = textarea.dataset.id
    const descripcion = textarea.value.trim()

    if (!descripcion) return alert('El contenido no puede estar vacío.')

    try {
        const res = await fetch(`${API_BASE}/mision/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ descripcion })
        })
        const data = await res.json()
        alert(data.message)
    } catch (err) {
        alert('Error al guardar los cambios.')
        console.error(err)
    }
}

const form = document.getElementById('formMision')
if (esAdmin && form) {
    form.addEventListener('submit', guardarMision)
}

cargarMision()