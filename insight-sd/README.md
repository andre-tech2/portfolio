# Insight SD

Dashboard local de análise de Service Desk, estilo Power BI — importa o CSV/Excel exportado de um sistema de
chamados e recalcula todas as métricas na hora, direto no navegador. **Sem IA, sem backend, sem custo de API**:
tudo roda no cliente, com cálculo determinístico por regras.

**[Ver demonstração ao vivo →](https://andre-tech2.github.io/portfolio/insight-sd/)**

> Projeto de portfólio: os dados mostrados na demonstração são gerados sinteticamente (nomes, chamados e métricas
> fictícios), criados na hora em que a página é aberta pela primeira vez no seu navegador — nada é enviado a
> nenhum servidor. Esta é uma versão adaptada, sem o empacotamento Electron, de uma ferramenta que desenvolvi
> para uso real como gestor de uma equipe de Service Desk.

## Páginas

| Página | O que mostra |
|---|---|
| **Visão Geral** | Totais, tempo médio por prioridade (com meta), top solicitações/áreas, gauges de SLA, satisfação (CSAT), volume diário do time, tabela de agentes |
| **Equipe** | Ranking de agentes ordenável, índice de saúde do agente (SLA + CSAT + atraso), chamados por status × agente, tendência diária, heatmap de volume por dia/horário, satisfação por categoria |
| **Crítico Agora** | Aging do backlog (geral e por agente), matriz Prioridade × Status, chamados parados, VIP em risco, chamados sem agente atribuído |
| **Recomendações** | Motor de regras (sem IA) que aponta pontos de atenção: SLA baixo, agente sobrecarregado, backlog parado, CSAT baixo, VIP em risco, entre outros |
| **Agente · Indicadores/Tendências** | Comparação de um agente vs a média da equipe, e evolução dele por dia, mês ou semestre |
| **Relatório** | Resumo condensado pra impressão/PDF, com opção de gerar apresentação em PowerPoint |
| **Configurações** | Metas de SLA, tempo médio de resolução (por prioridade), CSAT e volume diário do time, e restaurar os dados de exemplo |

Qualquer número agregado do app (barra, linha, célula de matriz, célula do heatmap) pode ser clicado pra abrir a
lista real de chamados por trás dele — com busca por texto e exportação para CSV.

Um filtro de período no topo (7/14/30/90/180 dias ou tudo) e um filtro de área afetam todas as páginas.

## Stack técnica

- **Next.js 16** (App Router, export estático) + **React 19** + **TypeScript**
- **Tailwind CSS v4** para estilo, **Recharts** para os gráficos
- **IndexedDB** (`idb-keyval`) para persistência local — nada sai do navegador
- Parsing de **CSV** (`papaparse`) e **Excel** (`.xlsx`/`.xls`/`.xlsm`, via `xlsx`)
- **pptxgenjs** para exportar o relatório como apresentação PowerPoint, direto no navegador

## Dados de demonstração

Como é um projeto de portfólio sem um CSV real pra importar, `lib/seed/sampleTickets.ts` gera um conjunto de
~600 chamados sintéticos na primeira vez que o app roda no seu navegador — sempre ancorado na data atual, pra
nunca parecer desatualizado. Os desequilíbrios são propositais (um agente sobrecarregado, uma categoria com CSAT
baixo, backlog parado, VIP em risco) pra a página de Recomendações e o Crítico Agora terem o que mostrar. Dá pra
restaurar esse conjunto a qualquer momento em Configurações, ou importar seu próprio arquivo pra ver o fluxo de
import de verdade — o formato de colunas esperado está em [`lib/csv/columnMap.ts`](lib/csv/columnMap.ts).

## Rodando localmente

```bash
npm install
npm run dev     # http://localhost:3000
npm run build   # export estático em out/
```
