const API_REPORTES = 'https://prestamos-xi.vercel.app/api'
// ── Helpers ─────────────────────────────────────────────────

function fechaHoy() {
    return new Date().toLocaleDateString('es-MX', {
        year: 'numeric', month: 'long', day: 'numeric'
    })
}

function timestampArchivo() {
    const now = new Date()
    return `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`
}

/** Obtiene todos los datos necesarios del backend */
async function fetchTodosLosDatos() {
    const token = localStorage.getItem('token')
    const headers = { Authorization: `Bearer ${token}` }

    const [dashRes, movRes, incRes] = await Promise.all([
        fetch(`${API_REPORTES}/reportes/dashboard`, { headers }),
        fetch(`${API_REPORTES}/reportes/movimientos?inicio=2020-01-01&fin=${new Date().toISOString().split('T')[0]}`, { headers }),
        fetch(`${API_REPORTES}/reportes`, { headers })
    ])

    if (!dashRes.ok || !movRes.ok || !incRes.ok) {
        throw new Error('Error al obtener datos del servidor')
    }

    const dashboard = await dashRes.json()
    const movimientos = await movRes.json()
    const incidencias = await incRes.json()

    return { dashboard, movimientos, incidencias }
}

// ── Estado del botón ─────────────────────────────────────────

function setBtnLoading(btn, loading) {
    if (loading) {
        btn.disabled = true
        btn.dataset.original = btn.innerHTML
        btn.innerHTML = `<i class="fas fa-circle-notch fa-spin"></i> Generando...`
    } else {
        btn.disabled = false
        btn.innerHTML = btn.dataset.original
    }
}

// ── EXPORTAR PDF ─────────────────────────────────────────────

window.exportarPDF = async function (btn) {
    setBtnLoading(btn, true)
    try {
        const { jsPDF } = window.jspdf
        const { dashboard, movimientos, incidencias } = await fetchTodosLosDatos()

        const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
        const W = doc.internal.pageSize.getWidth()
        const verde = [45, 90, 61]
        const verdeClaro = [132, 204, 22]
        const gris = [100, 116, 139]

        let y = 0  // cursor vertical

        // ── Cabecera ──
        doc.setFillColor(...verde)
        doc.rect(0, 0, W, 42, 'F')

        doc.setTextColor(255, 255, 255)
        doc.setFontSize(22)
        doc.setFont('helvetica', 'bold')
        doc.text('LOANWARE', 14, 18)

        doc.setFontSize(9)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(180, 220, 180)
        doc.text('Sistema de Gestión de Préstamos de Equipos', 14, 25)

        doc.setFontSize(11)
        doc.setTextColor(255, 255, 255)
        doc.text('Reporte General Completo', 14, 35)
        doc.text(fechaHoy(), W - 14, 35, { align: 'right' })

        y = 52

        // ── Sección 1: Resumen Dashboard ──
        doc.setFillColor(240, 247, 244)
        doc.roundedRect(10, y, W - 20, 8, 2, 2, 'F')
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(9)
        doc.setTextColor(...verde)
        doc.text('RESUMEN DEL DASHBOARD', 14, y + 5.5)
        y += 14

        const resumen = dashboard.resumen || {}
        const statsData = [
            ['Total de equipos', resumen.total_equipos ?? '--'],
            ['Solicitudes pendientes', resumen.pendientes ?? '--'],
            ['Equipos en préstamo', resumen.prestados ?? '--']
        ]

        doc.autoTable({
            startY: y,
            head: [['Indicador', 'Valor']],
            body: statsData,
            theme: 'grid',
            headStyles: { fillColor: verde, textColor: [255, 255, 255], fontSize: 8, fontStyle: 'bold' },
            bodyStyles: { fontSize: 8, textColor: [30, 41, 59] },
            columnStyles: { 1: { halign: 'center', fontStyle: 'bold' } },
            margin: { left: 10, right: 10 },
            styles: { cellPadding: 3 }
        })
        y = doc.lastAutoTable.finalY + 10

        // ── Sección 2: Top equipos ──
        doc.setFillColor(240, 247, 244)
        doc.roundedRect(10, y, W - 20, 8, 2, 2, 'F')
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(9)
        doc.setTextColor(...verde)
        doc.text('TOP EQUIPOS MÁS SOLICITADOS', 14, y + 5.5)
        y += 14

        const topEquipos = (dashboard.top_equipos || []).map((e, i) => [
            `${i + 1}°`, e.nombre, e.total
        ])

        doc.autoTable({
            startY: y,
            head: [['#', 'Equipo', 'Solicitudes']],
            body: topEquipos.length ? topEquipos : [['—', 'Sin datos', '—']],
            theme: 'striped',
            headStyles: { fillColor: verde, textColor: [255, 255, 255], fontSize: 8, fontStyle: 'bold' },
            bodyStyles: { fontSize: 8, textColor: [30, 41, 59] },
            columnStyles: { 0: { halign: 'center', cellWidth: 15 }, 2: { halign: 'center', cellWidth: 25 } },
            margin: { left: 10, right: 10 },
            styles: { cellPadding: 3 }
        })
        y = doc.lastAutoTable.finalY + 10

        // ── Sección 3: Movimientos ──
        doc.setFillColor(240, 247, 244)
        doc.roundedRect(10, y, W - 20, 8, 2, 2, 'F')
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(9)
        doc.setTextColor(...verde)
        doc.text('HISTORIAL DE MOVIMIENTOS', 14, y + 5.5)
        y += 14

        const movRows = (movimientos || []).map(m => [
            m.id_solicitud,
            m.usuario,
            m.equipo,
            new Date(m.fecha_solicitud).toLocaleDateString('es-MX'),
            m.estado
        ])

        doc.autoTable({
            startY: y,
            head: [['ID', 'Usuario', 'Equipo', 'Fecha', 'Estado']],
            body: movRows.length ? movRows : [['—', '—', 'Sin movimientos', '—', '—']],
            theme: 'grid',
            headStyles: { fillColor: verde, textColor: [255, 255, 255], fontSize: 7.5, fontStyle: 'bold' },
            bodyStyles: { fontSize: 7.5, textColor: [30, 41, 59] },
            columnStyles: {
                0: { halign: 'center', cellWidth: 12 },
                3: { halign: 'center', cellWidth: 28 },
                4: { halign: 'center', cellWidth: 25 }
            },
            margin: { left: 10, right: 10 },
            styles: { cellPadding: 2.5 },
            didParseCell(data) {
                if (data.column.index === 4 && data.section === 'body') {
                    const estado = String(data.cell.raw).toLowerCase()
                    if (estado === 'aprobada') data.cell.styles.textColor = [5, 150, 105]
                    if (estado === 'devuelta') data.cell.styles.textColor = [37, 99, 235]
                    if (estado === 'rechazada') data.cell.styles.textColor = [220, 38, 38]
                    if (estado === 'pendiente') data.cell.styles.textColor = [217, 119, 6]
                }
            }
        })
        y = doc.lastAutoTable.finalY + 10

        // ── Sección 4: Incidencias ──
        // Nueva página si no hay espacio
        if (y > 240) { doc.addPage(); y = 14 }

        doc.setFillColor(240, 247, 244)
        doc.roundedRect(10, y, W - 20, 8, 2, 2, 'F')
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(9)
        doc.setTextColor(...verde)
        doc.text('INCIDENCIAS REGISTRADAS', 14, y + 5.5)
        y += 14

        const incRows = (incidencias || []).map(r => [
            r.id_reporte,
            r.administrador,
            r.equipo,
            new Date(r.fecha_reporte).toLocaleDateString('es-MX'),
            r.descripcion
        ])

        doc.autoTable({
            startY: y,
            head: [['ID', 'Reportó', 'Equipo', 'Fecha', 'Descripción']],
            body: incRows.length ? incRows : [['—', '—', '—', '—', 'Sin incidencias']],
            theme: 'grid',
            headStyles: { fillColor: [180, 50, 50], textColor: [255, 255, 255], fontSize: 7.5, fontStyle: 'bold' },
            bodyStyles: { fontSize: 7, textColor: [30, 41, 59] },
            columnStyles: {
                0: { halign: 'center', cellWidth: 12 },
                3: { halign: 'center', cellWidth: 24 },
                4: { cellWidth: 70 }
            },
            margin: { left: 10, right: 10 },
            styles: { cellPadding: 2.5, overflow: 'linebreak' }
        })

        // ── Footer en todas las páginas ──
        const totalPages = doc.internal.getNumberOfPages()
        for (let i = 1; i <= totalPages; i++) {
            doc.setPage(i)
            doc.setFontSize(7)
            doc.setTextColor(...gris)
            doc.text(`Página ${i} de ${totalPages}  ·  Generado el ${fechaHoy()}  ·  LOANWARE Admin`, W / 2, 290, { align: 'center' })
        }

        doc.save(`LOANWARE_Reporte_${timestampArchivo()}.pdf`)
    } catch (err) {
        console.error(err)
        alert('Error al generar el PDF: ' + err.message)
    } finally {
        setBtnLoading(btn, false)
    }
}

// ── EXPORTAR EXCEL ────────────────────────────────────────────

window.exportarExcel = async function (btn) {
    setBtnLoading(btn, true)
    try {
        const { dashboard, movimientos, incidencias } = await fetchTodosLosDatos()
        const wb = XLSX.utils.book_new()

        // ── Hoja 1: Dashboard ──
        const resumen = dashboard.resumen || {}
        const wsDash = XLSX.utils.aoa_to_sheet([
            ['LOANWARE — Reporte General'],
            ['Generado:', fechaHoy()],
            [],
            ['RESUMEN DASHBOARD'],
            ['Indicador', 'Valor'],
            ['Total de equipos', resumen.total_equipos ?? 0],
            ['Solicitudes pendientes', resumen.pendientes ?? 0],
            ['Equipos en préstamo', resumen.prestados ?? 0],
            [],
            ['TOP EQUIPOS MÁS SOLICITADOS'],
            ['#', 'Equipo', 'Total solicitudes'],
            ...(dashboard.top_equipos || []).map((e, i) => [i + 1, e.nombre, e.total]),
            [],
            ['SOLICITUDES POR MES'],
            ['Mes', 'Total'],
            ...(dashboard.por_mes || []).map(m => [m.mes, m.total])
        ])
        // Ancho de columnas
        wsDash['!cols'] = [{ wch: 30 }, { wch: 20 }, { wch: 20 }]
        XLSX.utils.book_append_sheet(wb, wsDash, 'Dashboard')

        // ── Hoja 2: Movimientos ──
        const movHeaders = ['ID', 'Usuario', 'Equipo', 'Fecha', 'Estado']
        const movData = (movimientos || []).map(m => ({
            ID: m.id_solicitud,
            Usuario: m.usuario,
            Equipo: m.equipo,
            Fecha: new Date(m.fecha_solicitud).toLocaleDateString('es-MX'),
            Estado: m.estado
        }))
        const wsMov = XLSX.utils.json_to_sheet(movData, { header: movHeaders })
        wsMov['!cols'] = [{ wch: 8 }, { wch: 25 }, { wch: 25 }, { wch: 15 }, { wch: 15 }]
        XLSX.utils.book_append_sheet(wb, wsMov, 'Movimientos')

        // ── Hoja 3: Incidencias ──
        const incData = (incidencias || []).map(r => ({
            ID: r.id_reporte,
            'Reportado por': r.administrador,
            Equipo: r.equipo,
            Fecha: new Date(r.fecha_reporte).toLocaleDateString('es-MX'),
            Descripción: r.descripcion
        }))
        const wsInc = XLSX.utils.json_to_sheet(
            incData.length ? incData : [{ ID: '—', 'Reportado por': '—', Equipo: '—', Fecha: '—', Descripción: 'Sin incidencias' }]
        )
        wsInc['!cols'] = [{ wch: 8 }, { wch: 25 }, { wch: 25 }, { wch: 15 }, { wch: 50 }]
        XLSX.utils.book_append_sheet(wb, wsInc, 'Incidencias')

        XLSX.writeFile(wb, `LOANWARE_Reporte_${timestampArchivo()}.xlsx`)
    } catch (err) {
        console.error(err)
        alert('Error al generar el Excel: ' + err.message)
    } finally {
        setBtnLoading(btn, false)
    }
}