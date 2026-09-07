# Insight SD

Dashboard local de análise de Service Desk, estilo Power BI — importa o CSV/Excel exportado de um sistema de
chamados e recalcula todas as métricas na hora, direto no navegador. **Sem IA, sem backend, sem custo de API**:
tudo roda no cliente, com cálculo determinístico por regras.

**[Ver demonstração ao vivo →](https://andre-tech2.github.io/portfolio/insight-sd/)**

![Demonstração do app](../web/demo-insight-sd.gif)

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

## Por que esse projeto existe (e as decisões por trás dele)

O problema real: geria uma equipe de Service Desk e o retrato real da operação (SLA, quem está sobrecarregado, o
que está parado há dias, quem é VIP e está em risco) vivia espalhado em exports manuais — quando o número
finalmente saía, a reunião já tinha passado. Algumas decisões de design vêm direto dessa dor:

- **Motor de regras, sem IA.** Cada item em Recomendações precisa ser defensável numa reunião de gestão ("por que
  esse agente apareceu como sobrecarregado?") sem cair em "o modelo decidiu assim". Regra fixa é auditável, não
  tem custo de API e não tem risco de alucinação em cima de dado sensível de chamado.
- **SLA de 1ª resposta e SLA de resolução são sempre métricas separadas, nunca uma "SLA geral" única.** Um agente
  pode responder rápido e demorar pra resolver, ou o contrário — misturar os dois esconde qual é o problema real
  por trás do número.
- **Qualquer número agregado (barra, célula de matriz, célula do heatmap) é clicável e abre os chamados por trás
  dele.** Na prática, a primeira pergunta depois de qualquer gráfico em reunião é "quais chamados são esses". Um
  dashboard que só mostra o agregado gera mais trabalho manual depois, não menos.
- **O índice de saúde do agente redistribui peso quando falta um sinal** (ex: agente sem respostas de CSAT ainda).
  Uma média simples penalizaria injustamente quem só ainda não acumulou dado suficiente, distorcendo o ranking.
- **Tudo roda no navegador, sem backend.** Um export de chamados carrega dado sensível (nome, e-mail, departamento
  do solicitante) — manter o processamento 100% local evita ter que resolver "onde esse dado fica armazenado" em
  um projeto de portfólio público.

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

## Testes

Suíte automatizada com [Vitest](https://vitest.dev/), rodada no CI a cada push (bloqueia o deploy se falhar):

```bash
npm test
```

Cobre as regras de cálculo mais sensíveis a erro silencioso — as que, se quebrarem, mudam um número que alguém
vai citar numa reunião sem perceber que está errado:

- **`lib/format/duration.test.ts`** e **`lib/csv/parseDuration.test.ts`** — conversão de duração `HH:MM:SS` (do
  export original) para horas decimais, e formatação de volta para exibição
- **`lib/csv/validateColumns.test.ts`** — validação das colunas obrigatórias de um CSV importado
- **`lib/metrics/slaOverall.test.ts`** — cálculo do percentual de SLA, separado por 1ª resposta e resolução
- **`lib/metrics/overdue.test.ts`** — regra de atraso (violou SLA, ou está aberto e passou do prazo) e ordenação
  da lista de atrasados
- **`lib/metrics/unassigned.test.ts`** — chamados sem agente atribuído, horas em aberto
- **`lib/metrics/healthScore.test.ts`** — índice de saúde do agente, incluindo a redistribuição de peso quando
  falta um sinal (ex: sem CSAT ainda)

## Rodando localmente

```bash
npm install
npm run dev     # http://localhost:3000
npm run build   # export estático em out/
npm test        # suíte de testes
```
