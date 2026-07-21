import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { money } from './catalogo.js'

// Datos de la empresa (ajústalos si cambian)
const EMPRESA = {
  nombre: 'ROJO HOME IMPROVEMENT',
  eslogan: 'Master Painting & Complete Home Care',
  direccion: 'PO Box 853, Norwalk, CT 06856',
  telefono: '(203) 847-5044',
  web: 'rojohomeimprovement.com',
}

const AMARILLO = [245, 179, 1]
const TINTA = [28, 27, 26]

export function generarPDF(cot) {
  const doc = new jsPDF({ unit: 'pt', format: 'letter' })
  const W = doc.internal.pageSize.getWidth()
  const M = 48 // margen

  // ---- Encabezado ----
  doc.setFillColor(...TINTA)
  doc.rect(0, 0, W, 92, 'F')
  doc.setFillColor(...AMARILLO)
  doc.rect(0, 92, W, 5, 'F')

  doc.setTextColor(...AMARILLO)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(20)
  doc.text(EMPRESA.nombre, M, 45)
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.text(EMPRESA.eslogan, M, 62)
  doc.text(`${EMPRESA.direccion}  ·  ${EMPRESA.telefono}  ·  ${EMPRESA.web}`, M, 76)

  // ---- Título COTIZACIÓN ----
  doc.setTextColor(...TINTA)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(22)
  doc.text('COTIZACIÓN', W - M, 135, { align: 'right' })
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(90, 90, 90)
  doc.text(`No. ${cot.numero}`, W - M, 152, { align: 'right' })
  doc.text(`Fecha: ${cot.fecha}`, W - M, 166, { align: 'right' })

  // ---- Cliente ----
  doc.setTextColor(...TINTA)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.text('PARA:', M, 135)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  let y = 152
  doc.text(cot.cliente?.nombre ?? '', M, y); y += 15
  if (cot.cliente?.empresa) { doc.text(cot.cliente.empresa, M, y); y += 15 }
  if (cot.ubicacion) {
    const dir = [cot.ubicacion.direccion, cot.ubicacion.ciudad, cot.ubicacion.estado]
      .filter(Boolean).join(', ')
    doc.setFontSize(9); doc.setTextColor(90, 90, 90)
    doc.text(dir, M, y); y += 13
  }
  doc.setTextColor(...TINTA); doc.setFontSize(10)
  doc.text(`Servicio: ${cot.tipoServicio}`, M, y + 4)

  // ---- Tabla de renglones ----
  autoTable(doc, {
    startY: 200,
    head: [['Descripción', 'Cant.', 'Unidad', 'Precio', 'Total']],
    body: cot.filas.map((f) => [
      f.descripcion,
      String(f.cantidad),
      f.unidad,
      money(f.precio_unit),
      money((Number(f.cantidad) || 0) * (Number(f.precio_unit) || 0)),
    ]),
    theme: 'grid',
    headStyles: { fillColor: TINTA, textColor: AMARILLO, fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { fontSize: 9, textColor: TINTA },
    alternateRowStyles: { fillColor: [250, 250, 249] },
    columnStyles: {
      1: { halign: 'center', cellWidth: 45 },
      2: { halign: 'center', cellWidth: 60 },
      3: { halign: 'right', cellWidth: 70 },
      4: { halign: 'right', cellWidth: 80 },
    },
    margin: { left: M, right: M },
  })

  // ---- Totales ----
  let ty = doc.lastAutoTable.finalY + 16
  const xEt = W - M - 200
  const xVal = W - M
  const fila = (et, val, bold = false) => {
    doc.setFont('helvetica', bold ? 'bold' : 'normal')
    doc.setFontSize(bold ? 12 : 10)
    doc.setTextColor(...(bold ? TINTA : [90, 90, 90]))
    doc.text(et, xEt, ty)
    doc.setTextColor(...TINTA)
    doc.text(val, xVal, ty, { align: 'right' })
    ty += bold ? 22 : 16
  }
  fila('Subtotal', money(cot.subtotal))
  if (cot.descuento > 0) fila('Descuento', '– ' + money(cot.descuento))
  if (cot.impuesto > 0) fila('Impuesto (6.35%)', money(cot.impuesto))
  // línea del total con fondo amarillo
  doc.setFillColor(...AMARILLO)
  doc.rect(xEt - 12, ty - 14, 200 + 12, 26, 'F')
  fila('TOTAL', money(cot.total), true)

  // ---- Notas + pie ----
  if (cot.notas) {
    const notaY = ty + 10
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(...TINTA)
    doc.text('Notas:', M, notaY)
    doc.setFont('helvetica', 'normal'); doc.setTextColor(90, 90, 90)
    doc.text(doc.splitTextToSize(cot.notas, W - M * 2 - 220), M, notaY + 14)
  }

  const H = doc.internal.pageSize.getHeight()
  doc.setDrawColor(230); doc.line(M, H - 60, W - M, H - 60)
  doc.setFontSize(8); doc.setTextColor(120)
  doc.text('Gracias por confiar en Rojo Home Improvement · 25 años de experiencia en pintura.', M, H - 44)
  doc.text('Cotización válida por 30 días.', M, H - 32)

  doc.save(`${cot.numero}.pdf`)
}
