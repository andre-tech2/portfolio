export function formatIdade(dataEntradaISO: string): string {
  const inicio = new Date(`${dataEntradaISO}T00:00:00`)
  if (Number.isNaN(inicio.getTime())) return '—'

  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  inicio.setHours(0, 0, 0, 0)

  const dias = Math.round((hoje.getTime() - inicio.getTime()) / 86400000)
  if (dias < 0) return 'Data futura'
  if (dias < 30) return `${dias} ${dias === 1 ? 'dia' : 'dias'}`

  let anos = hoje.getFullYear() - inicio.getFullYear()
  let meses = hoje.getMonth() - inicio.getMonth()
  if (hoje.getDate() < inicio.getDate()) meses--
  if (meses < 0) {
    anos--
    meses += 12
  }

  if (anos <= 0) return `${meses} ${meses === 1 ? 'mês' : 'meses'}`
  if (meses === 0) return `${anos} ${anos === 1 ? 'ano' : 'anos'}`
  return `${anos} ${anos === 1 ? 'ano' : 'anos'} e ${meses} ${meses === 1 ? 'mês' : 'meses'}`
}
