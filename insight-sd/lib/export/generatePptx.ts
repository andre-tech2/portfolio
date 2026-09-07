import type PptxGenJSType from "pptxgenjs";
import type { DateRangePreset } from "@/lib/dateRange";
import { DATE_RANGE_LABELS } from "@/lib/dateRange";
import { formatDuration as formatHours } from "@/lib/format/duration";
import type { MetricsContext, Recommendation } from "@/lib/metrics/types";
import type { ImportMeta } from "@/lib/types/ticket";

const COLOR = {
  text: "0B0B0B",
  muted: "5B5B57",
  accentBlue: "3987E5",
  accentViolet: "9085E9",
  critical: "D03B3B",
  warning: "FAB219",
  good: "0CA30C",
  border: "D9D9D6",
  surface: "F5F5F3",
  white: "FFFFFF",
};

const SEVERITY_LABEL: Record<Recommendation["severity"], string> = {
  critical: "Crítico",
  warning: "Atenção",
  info: "Oportunidade",
};

const SEVERITY_COLOR: Record<Recommendation["severity"], string> = {
  critical: COLOR.critical,
  warning: COLOR.warning,
  info: COLOR.good,
};


function pct(value: number | null): string {
  return value === null ? "—" : `${value.toFixed(0)}%`;
}

interface GeneratePptxParams {
  metrics: MetricsContext;
  meta: ImportMeta | null;
  dateRangePreset: DateRangePreset;
  /** Já filtradas (sem as resolvidas) e ordenadas por severidade. */
  recommendations: Recommendation[];
}

/** Gera e baixa uma apresentação .pptx robusta pra gerência — narrativa, gráficos nativos e os pontos mais relevantes, não uma cópia 1:1 do relatório em tela. */
export async function generateReportPptx({ metrics, meta, dateRangePreset, recommendations }: GeneratePptxParams): Promise<void> {
  const { default: PptxGenJS } = await import("pptxgenjs");
  const pptx = new PptxGenJS();
  pptx.defineLayout({ name: "INSIGHT_SD_WIDE", width: 13.33, height: 7.5 });
  pptx.layout = "INSIGHT_SD_WIDE";
  pptx.theme = { headFontFace: "Segoe UI", bodyFontFace: "Segoe UI" };

  const MARGIN_X = 0.6;
  const CONTENT_W = 13.33 - MARGIN_X * 2;
  const periodLine =
    `Período: ${DATE_RANGE_LABELS[dateRangePreset]}  ·  Gerado em ${new Date().toLocaleDateString("pt-BR")}` +
    (meta ? `  ·  Arquivo importado em ${meta.importedAt.toLocaleDateString("pt-BR")}` : "");

  function addSlide() {
    const slide = pptx.addSlide();
    slide.background = { color: COLOR.white };
    return slide;
  }

  function addSlideTitle(slide: PptxGenJSType.Slide, title: string, subtitle?: string) {
    slide.addText(title, { x: MARGIN_X, y: 0.4, w: CONTENT_W, h: 0.6, fontSize: 24, bold: true, color: COLOR.text });
    if (subtitle) {
      slide.addText(subtitle, { x: MARGIN_X, y: 0.95, w: CONTENT_W, h: 0.4, fontSize: 12, color: COLOR.muted });
    }
  }

  // Slide 1 — capa
  const cover = addSlide();
  cover.addShape("rect", { x: 0, y: 0, w: 0.18, h: 7.5, fill: { color: COLOR.accentBlue } });
  cover.addText("Insight SD", { x: 1, y: 2.5, w: 11.7, h: 1, fontSize: 42, bold: true, color: COLOR.text });
  cover.addText("Relatório de Service Desk", { x: 1, y: 3.4, w: 11.7, h: 0.6, fontSize: 20, color: COLOR.accentBlue });
  cover.addText(periodLine, { x: 1, y: 4.15, w: 11.7, h: 0.4, fontSize: 12, color: COLOR.muted });
  cover.addText("desenvolvido por André André", { x: 1, y: 6.9, w: 11.7, h: 0.4, fontSize: 10, color: COLOR.muted });

  // Slide 2 — resumo executivo (narrativa + KPIs)
  const summary = addSlide();
  addSlideTitle(summary, "Resumo executivo");
  const overduePct = metrics.totalTickets > 0 ? (metrics.overdueTotalCount / metrics.totalTickets) * 100 : 0;
  const teamCausedOverdue = metrics.overdueTotalCount - metrics.overdueExternalCount;
  const narrative =
    `No período analisado, o time atendeu ${metrics.totalTickets.toLocaleString("pt-BR")} chamados, com tempo médio de ` +
    `atendimento de ${formatHours(metrics.avgResolutionHours)} e SLA de resolução de ${pct(metrics.slaOverall.resolution.percentage)}. ` +
    `${metrics.overdueTotalCount.toLocaleString("pt-BR")} chamados (${overduePct.toFixed(0)}%) estão ou ficaram atrasados` +
    (metrics.overdueExternalCount > 0
      ? `; desses, ${metrics.overdueExternalCount} aguardam terceiros (transportadora, equipamento, aprovação) e não dependem diretamente do time — ${teamCausedOverdue} exigem ação do atendimento.`
      : ".");
  summary.addShape("roundRect", {
    x: MARGIN_X,
    y: 1.5,
    w: CONTENT_W,
    h: 1.4,
    fill: { color: COLOR.surface },
    line: { color: COLOR.border, width: 1 },
    rectRadius: 0.06,
  });
  summary.addText(narrative, { x: MARGIN_X + 0.3, y: 1.65, w: CONTENT_W - 0.6, h: 1.1, fontSize: 13, color: COLOR.text, valign: "middle" });

  const kpis = [
    { label: "Total de chamados", value: metrics.totalTickets.toLocaleString("pt-BR") },
    { label: "Média de atendimento", value: formatHours(metrics.avgResolutionHours) },
    { label: "SLA de resolução", value: pct(metrics.slaOverall.resolution.percentage) },
    { label: "Chamados atrasados", value: metrics.overdueTotalCount.toLocaleString("pt-BR") },
  ];
  const kpiWidth = (CONTENT_W - 0.3 * 3) / 4;
  kpis.forEach((kpi, i) => {
    const x = MARGIN_X + i * (kpiWidth + 0.3);
    summary.addShape("roundRect", {
      x,
      y: 3.3,
      w: kpiWidth,
      h: 1.6,
      fill: { color: COLOR.surface },
      line: { color: COLOR.border, width: 1 },
      rectRadius: 0.08,
    });
    summary.addText(kpi.label.toUpperCase(), { x: x + 0.2, y: 3.45, w: kpiWidth - 0.4, h: 0.4, fontSize: 10, bold: true, color: COLOR.muted });
    summary.addText(kpi.value, { x: x + 0.2, y: 3.85, w: kpiWidth - 0.4, h: 0.9, fontSize: 26, bold: true, color: COLOR.text });
  });

  // Slide 3 — volume e SLA ao longo do período
  if (metrics.teamTrend.length > 1) {
    const trendSlide = addSlide();
    addSlideTitle(trendSlide, "Volume e SLA ao longo do período", "Evolução diária do time no intervalo selecionado.");
    const labels = metrics.teamTrend.map((p) => p.periodLabel);
    const halfW = (CONTENT_W - 0.4) / 2;

    trendSlide.addText("Volume de chamados", { x: MARGIN_X, y: 1.5, w: halfW, h: 0.35, fontSize: 13, bold: true, color: COLOR.text });
    trendSlide.addChart(
      "line",
      [{ name: "Volume", labels, values: metrics.teamTrend.map((p) => p.count) }],
      {
        x: MARGIN_X,
        y: 1.9,
        w: halfW,
        h: 4.6,
        chartColors: [COLOR.accentBlue],
        showLegend: false,
        showTitle: false,
        catAxisLabelColor: COLOR.muted,
        valAxisLabelColor: COLOR.muted,
        catAxisLabelFontSize: 9,
        valAxisLabelFontSize: 9,
        lineDataSymbol: "circle",
        lineDataSymbolSize: 4,
      }
    );

    trendSlide.addText("SLA de resolução (%)", { x: MARGIN_X + halfW + 0.4, y: 1.5, w: halfW, h: 0.35, fontSize: 13, bold: true, color: COLOR.text });
    trendSlide.addChart(
      "line",
      [
        {
          name: "SLA",
          labels,
          values: metrics.teamTrend.map((p) => p.slaPercentage ?? 0),
        },
      ],
      {
        x: MARGIN_X + halfW + 0.4,
        y: 1.9,
        w: halfW,
        h: 4.6,
        chartColors: [COLOR.good],
        showLegend: false,
        showTitle: false,
        catAxisLabelColor: COLOR.muted,
        valAxisLabelColor: COLOR.muted,
        catAxisLabelFontSize: 9,
        valAxisLabelFontSize: 9,
        valAxisMaxVal: 100,
        lineDataSymbol: "circle",
        lineDataSymbolSize: 4,
      }
    );
  }

  // Slide 4 — SLA de atendimento (gauges)
  const slaSlide = addSlide();
  addSlideTitle(slaSlide, "SLA de atendimento", "Percentual de chamados dentro do prazo combinado.");
  const halfW2 = (CONTENT_W - 0.4) / 2;
  const slaGauges: { title: string; value: number | null; x: number }[] = [
    { title: "1ª resposta", value: metrics.slaOverall.firstResponse.percentage, x: MARGIN_X },
    { title: "Resolução", value: metrics.slaOverall.resolution.percentage, x: MARGIN_X + halfW2 + 0.4 },
  ];
  slaGauges.forEach((gauge) => {
    slaSlide.addText(gauge.title, { x: gauge.x, y: 1.5, w: halfW2, h: 0.4, fontSize: 14, bold: true, color: COLOR.text, align: "center" });
    if (gauge.value === null) {
      slaSlide.addText("Sem dados suficientes.", { x: gauge.x, y: 3, w: halfW2, h: 0.5, fontSize: 12, color: COLOR.muted, align: "center" });
      return;
    }
    slaSlide.addChart(
      "doughnut",
      [{ name: gauge.title, labels: ["Dentro do prazo", "Fora do prazo"], values: [gauge.value, 100 - gauge.value] }],
      {
        x: gauge.x + halfW2 / 2 - 1.6,
        y: 1.95,
        w: 3.2,
        h: 3.2,
        chartColors: [gauge.value >= 85 ? COLOR.good : gauge.value >= 70 ? COLOR.warning : COLOR.critical, COLOR.border],
        showLegend: false,
        showPercent: false,
        dataLabelColor: COLOR.text,
      }
    );
    slaSlide.addText(`${gauge.value.toFixed(0)}%`, {
      x: gauge.x,
      y: 3.15,
      w: halfW2,
      h: 0.9,
      fontSize: 32,
      bold: true,
      color: COLOR.text,
      align: "center",
    });
  });

  // Slide 5 — ranking da equipe
  const ranking = addSlide();
  addSlideTitle(ranking, "Ranking da equipe");
  const headerRow = ["Agente", "Volume", "Fechados", "Tempo médio", "SLA 1ª Resp.", "SLA Resolução"].map((t) => ({
    text: t,
    options: { bold: true, color: COLOR.white, fill: { color: COLOR.accentBlue }, fontSize: 11 },
  }));
  const bodyRows = metrics.agentStats.map((agent) => [
    { text: agent.agent, options: { fontSize: 11 } },
    { text: String(agent.volume), options: { fontSize: 11, align: "right" as const } },
    {
      text: `${agent.closedCount}${agent.closedPercentage !== null ? ` (${agent.closedPercentage.toFixed(0)}%)` : ""}`,
      options: { fontSize: 11, align: "right" as const },
    },
    { text: formatHours(agent.avgResolutionHours), options: { fontSize: 11, align: "right" as const } },
    { text: pct(agent.firstResponseSlaPercentage), options: { fontSize: 11, align: "right" as const } },
    { text: pct(agent.slaPercentage), options: { fontSize: 11, align: "right" as const } },
  ]);
  ranking.addTable([headerRow, ...bodyRows], {
    x: MARGIN_X,
    y: 1.4,
    w: CONTENT_W,
    color: COLOR.text,
    border: { type: "solid", color: COLOR.border, pt: 0.5 },
    autoPage: false,
  });

  // Slide 6 — volume por agente (visual)
  const realAgents = metrics.agentStats.filter((a) => a.agent !== "No Agent");
  if (realAgents.length > 0) {
    const volumeSlide = addSlide();
    addSlideTitle(volumeSlide, "Volume por agente", "Chamados atendidos no período, por agente.");
    volumeSlide.addChart(
      "bar",
      [{ name: "Volume", labels: realAgents.map((a) => a.agent), values: realAgents.map((a) => a.volume) }],
      {
        x: MARGIN_X,
        y: 1.5,
        w: CONTENT_W,
        h: 5.4,
        barDir: "col",
        chartColors: [COLOR.accentViolet],
        showLegend: false,
        showValue: true,
        dataLabelColor: COLOR.text,
        dataLabelFontSize: 10,
        catAxisLabelColor: COLOR.muted,
        valAxisLabelColor: COLOR.muted,
        catAxisLabelFontSize: 10,
        valAxisLabelFontSize: 9,
      }
    );
  }

  // Slide 7 — aging do backlog
  if (metrics.backlogAging.some((b) => b.count > 0)) {
    const agingSlide = addSlide();
    addSlideTitle(agingSlide, "Aging do backlog", "Chamados ainda em aberto, por tempo desde a criação.");
    agingSlide.addChart(
      "bar",
      [{ name: "Chamados", labels: metrics.backlogAging.map((b) => b.label), values: metrics.backlogAging.map((b) => b.count) }],
      {
        x: MARGIN_X,
        y: 1.6,
        w: CONTENT_W,
        h: 5.2,
        barDir: "col",
        chartColors: [COLOR.warning],
        showLegend: false,
        showValue: true,
        dataLabelColor: COLOR.text,
        catAxisLabelColor: COLOR.muted,
        valAxisLabelColor: COLOR.muted,
        catAxisLabelFontSize: 11,
        valAxisLabelFontSize: 9,
      }
    );
  }

  // Slide 8 — principais categorias
  if (metrics.topCategories.length > 0) {
    const catSlide = addSlide();
    addSlideTitle(catSlide, "Principais categorias de chamados");
    const topCats = metrics.topCategories.slice(0, 6).reverse();
    catSlide.addChart(
      "bar",
      [{ name: "Chamados", labels: topCats.map((c) => c.key), values: topCats.map((c) => c.count) }],
      {
        x: MARGIN_X,
        y: 1.5,
        w: CONTENT_W,
        h: 5.4,
        barDir: "bar",
        chartColors: [COLOR.accentBlue],
        showLegend: false,
        showValue: true,
        dataLabelColor: COLOR.text,
        catAxisLabelColor: COLOR.muted,
        valAxisLabelColor: COLOR.muted,
        catAxisLabelFontSize: 11,
        valAxisLabelFontSize: 9,
      }
    );
  }

  // Slide 9 — pontos críticos
  const critical = addSlide();
  addSlideTitle(critical, "Pontos críticos");
  const criticalStats = [
    { label: "Chamados parados", value: metrics.staleTotalCount },
    { label: "VIP em risco", value: metrics.vipTotalCount },
    { label: "Sem agente atribuído", value: metrics.unassignedTotalCount },
  ];
  criticalStats.forEach((stat, i) => {
    const x = MARGIN_X + i * ((CONTENT_W - 0.6) / 3 + 0.3);
    const w = (CONTENT_W - 0.6) / 3;
    critical.addText(String(stat.value), {
      x,
      y: 2.2,
      w,
      h: 1.2,
      fontSize: 48,
      bold: true,
      color: stat.value > 0 ? COLOR.critical : COLOR.good,
      align: "center",
    });
    critical.addText(stat.label, { x, y: 3.4, w, h: 0.5, fontSize: 14, color: COLOR.muted, align: "center" });
  });

  // Slide 10 — principais recomendações
  const recSlide = addSlide();
  addSlideTitle(recSlide, "Principais recomendações");
  const topRecs = recommendations.slice(0, 6);
  if (topRecs.length === 0) {
    recSlide.addText("Nenhum ponto de atenção identificado com os limiares atuais.", {
      x: MARGIN_X,
      y: 1.6,
      w: CONTENT_W,
      h: 0.5,
      fontSize: 14,
      color: COLOR.muted,
    });
  } else {
    topRecs.forEach((rec, i) => {
      const y = 1.4 + i * 0.95;
      recSlide.addShape("rect", { x: MARGIN_X, y, w: 0.1, h: 0.82, fill: { color: SEVERITY_COLOR[rec.severity] } });
      recSlide.addText(`[${SEVERITY_LABEL[rec.severity]}]  ${rec.title}`, {
        x: MARGIN_X + 0.3,
        y,
        w: CONTENT_W - 0.3,
        h: 0.35,
        fontSize: 13,
        bold: true,
        color: COLOR.text,
      });
      recSlide.addText(rec.description, {
        x: MARGIN_X + 0.3,
        y: y + 0.35,
        w: CONTENT_W - 0.3,
        h: 0.45,
        fontSize: 10,
        color: COLOR.muted,
      });
    });
  }

  const fileName = `Insight SD - Apresentacao ${new Date().toISOString().slice(0, 10)}.pptx`;
  await pptx.writeFile({ fileName });
}
