function escapeHtml(s: string) {
  const map: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }
  return s.replace(/[&<>"']/g, (c) => map[c])
}

function buildReportHtml(p: ReportPayload): string {
  const statusLabel: Record<string, string> = { ok: 'OK', baixo: 'Baixo', critico: 'Crítico' }
  const statusColor: Record<string, string> = { ok: '#0B8A3A', baixo: '#B45309', critico: '#B91C1C' }

  const kpiRows = p.kpis
    .map((k) => `<div class="kpi"><div class="kpi-label">${escapeHtml(k.label)}</div><div class="kpi-value">${escapeHtml(k.value)}</div></div>`)
    .join('')

  const estoqueRows = p.estoque
    .map((e) => `<tr><td>${escapeHtml(e.nome)}</td><td class="num">${e.atual}</td><td class="num">${e.minimo}</td></tr>`)
    .join('')

  const alertaRows = p.alertas
    .map(
      (a) =>
        `<tr><td>${escapeHtml(a.nome)}</td><td style="color:${statusColor[a.status] ?? '#14151A'};font-weight:600">${statusLabel[a.status] ?? a.status}</td><td class="num">${a.atual}</td><td class="num">${a.minimo}</td></tr>`
    )
    .join('')

  const movRows = p.movimentacoes
    .map((m) => `<tr><td>${escapeHtml(m.dia)}</td><td class="num">${m.saidas}</td><td class="num">${m.entradas}</td></tr>`)
    .join('')

  return `<!doctype html>
<html><head><meta charset="utf-8" /><title>${escapeHtml(p.titulo)}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #14151A; margin: 32px; }
  h1 { font-size: 20px; margin: 0 0 4px; }
  .sub { color: #53565F; font-size: 12px; margin: 0 0 24px; }
  .kpis { display: flex; gap: 12px; margin-bottom: 24px; flex-wrap: wrap; }
  .kpi { border: 1px solid #E2E4EA; border-radius: 8px; padding: 10px 14px; min-width: 140px; }
  .kpi-label { font-size: 10px; color: #84878F; text-transform: uppercase; font-weight: 600; }
  .kpi-value { font-size: 20px; font-weight: 700; margin-top: 2px; }
  h2 { font-size: 14px; margin: 24px 0 8px; }
  table { width: 100%; border-collapse: collapse; font-size: 11px; }
  th { text-align: left; background: #F7F8FA; padding: 6px 8px; border-bottom: 1px solid #E2E4EA; font-size: 10px; text-transform: uppercase; color: #53565F; }
  td { padding: 5px 8px; border-bottom: 1px solid #EEF0F4; }
  .num { text-align: right; }
  @media print { @page { margin: 16mm; } }
</style></head>
<body>
  <h1>${escapeHtml(p.titulo)}</h1>
  <p class="sub">Sede: ${escapeHtml(p.sedeLabel)} · Período: ${escapeHtml(p.periodoLabel)} · Gerado em ${escapeHtml(p.geradoEm)}</p>
  <div class="kpis">${kpiRows}</div>

  <h2>Alertas de estoque</h2>
  <table>
    <thead><tr><th>Equipamento</th><th>Status</th><th class="num">Atual</th><th class="num">Mínimo</th></tr></thead>
    <tbody>${alertaRows || '<tr><td colspan="4">Nenhum alerta no período.</td></tr>'}</tbody>
  </table>

  <h2>Estoque por equipamento</h2>
  <table>
    <thead><tr><th>Equipamento</th><th class="num">Atual</th><th class="num">Mínimo</th></tr></thead>
    <tbody>${estoqueRows}</tbody>
  </table>

  <h2>Movimentações por dia</h2>
  <table>
    <thead><tr><th>Dia</th><th class="num">Saídas</th><th class="num">Entradas</th></tr></thead>
    <tbody>${movRows}</tbody>
  </table>
  <script>window.onload = () => setTimeout(() => window.print(), 200)</script>
</body></html>`
}

/** Abre o relatório numa aba nova e já dispara o diálogo de impressão do navegador — "Salvar como PDF" é uma das opções de destino nesse diálogo. */
export function abrirRelatorioParaImpressao(payload: ReportPayload) {
  const html = buildReportHtml(payload)
  const win = window.open('', '_blank')
  if (!win) throw new Error('Não foi possível abrir a janela de impressão. Verifique o bloqueador de pop-ups.')
  win.document.open()
  win.document.write(html)
  win.document.close()
}
