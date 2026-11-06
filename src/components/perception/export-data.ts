export function downloadFile(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export function toCsv(rows: string[][]) {
  return rows.map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(',')).join('\n')
}

export function toExcelXml(rows: string[][], sheet = 'Perception') {
  const escape = (value: string) => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
  const table = rows
    .map((row) => `<Row>${row.map((cell) => `<Cell><Data ss:Type="String">${escape(cell)}</Data></Cell>`).join('')}</Row>`)
    .join('')
  return `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
<Worksheet ss:Name="${sheet}"><Table>${table}</Table></Worksheet>
</Workbook>`
}

export async function copyTable(rows: string[][]) {
  await navigator.clipboard.writeText(rows.map((row) => row.join('\t')).join('\n'))
}
