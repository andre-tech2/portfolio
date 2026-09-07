import type { Shipment, ShipmentStatus } from "@/lib/types/shipment";

interface CarrierProfile {
  name: string;
  volumeWeight: number;
  /** 0-1: probabilidade de um envio chegar dentro do prazo, quando não houve ocorrência. */
  onTimeQuality: number;
  /** 0-1: probabilidade de o envio virar uma ocorrência (avaria/insucesso/extravio/devolução). */
  occurrenceRate: number;
}

// "Norte Sul Transportes" é deliberadamente pior (baixo onTimeQuality, occurrenceRate alto) — dá
// pra Recomendações e o ranking de transportadoras terem o que mostrar, igual ao Insight SD faz
// com o agente sobrecarregado.
const CARRIERS: CarrierProfile[] = [
  { name: "Rota Expressa", volumeWeight: 140, onTimeQuality: 0.93, occurrenceRate: 0.03 },
  { name: "TransBrasil Log", volumeWeight: 120, onTimeQuality: 0.88, occurrenceRate: 0.04 },
  { name: "VeloCarga", volumeWeight: 100, onTimeQuality: 0.85, occurrenceRate: 0.05 },
  { name: "Ágil Entregas", volumeWeight: 70, onTimeQuality: 0.9, occurrenceRate: 0.035 },
  { name: "Norte Sul Transportes", volumeWeight: 80, onTimeQuality: 0.58, occurrenceRate: 0.16 },
];

interface RegionProfile {
  uf: string;
  baseCost: number;
  baseTransitDays: number;
}

// "AM" é deliberadamente cara/distante — dá pro alerta de custo de frete por região ter o que mostrar.
const REGIONS: RegionProfile[] = [
  { uf: "SP", baseCost: 24, baseTransitDays: 2 },
  { uf: "RJ", baseCost: 27, baseTransitDays: 2.5 },
  { uf: "MG", baseCost: 29, baseTransitDays: 3 },
  { uf: "PR", baseCost: 31, baseTransitDays: 3 },
  { uf: "RS", baseCost: 37, baseTransitDays: 4 },
  { uf: "BA", baseCost: 44, baseTransitDays: 5 },
  { uf: "PE", baseCost: 47, baseTransitDays: 5.5 },
  { uf: "CE", baseCost: 46, baseTransitDays: 5.5 },
  { uf: "DF", baseCost: 33, baseTransitDays: 3.5 },
  { uf: "AM", baseCost: 92, baseTransitDays: 9 },
];

const OCCURRENCE_STATUSES: [ShipmentStatus, number][] = [
  ["Avariado", 0.3],
  ["Insucesso", 0.3],
  ["Devolvido", 0.2],
  ["Extraviado", 0.2],
];

const OCCURRENCE_REASONS: Record<string, string[]> = {
  Avariado: ["Caixa amassada no transporte", "Produto quebrado dentro da embalagem", "Embalagem violada"],
  Insucesso: ["Cliente ausente na entrega", "Endereço não localizado", "Recusa do destinatário"],
  Devolvido: ["Recusa do destinatário", "Endereço incorreto informado", "Prazo de retirada expirado"],
  Extraviado: ["Extravio na triagem", "Sem rastreio após postagem", "Perdido em trânsito"],
};

const CITIES: Record<string, string[]> = {
  SP: ["São Paulo", "Campinas", "Santos"],
  RJ: ["Rio de Janeiro", "Niterói"],
  MG: ["Belo Horizonte", "Uberlândia"],
  PR: ["Curitiba", "Londrina"],
  RS: ["Porto Alegre", "Caxias do Sul"],
  BA: ["Salvador", "Feira de Santana"],
  PE: ["Recife", "Caruaru"],
  CE: ["Fortaleza", "Sobral"],
  DF: ["Brasília"],
  AM: ["Manaus"],
};

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randFloat(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function pick<T>(arr: T[]): T {
  return arr[randInt(0, arr.length - 1)];
}

function weightedPick<T>(items: [T, number][]): T {
  const total = items.reduce((sum, [, w]) => sum + w, 0);
  let roll = Math.random() * total;
  for (const [item, w] of items) {
    if (roll < w) return item;
    roll -= w;
  }
  return items[items.length - 1][0];
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

let shipmentCounter = 500000;
function nextId(): string {
  shipmentCounter += 1;
  return `FR-${shipmentCounter}`;
}

function buildShipment(carrier: CarrierProfile, now: Date): Shipment {
  const region = pick(REGIONS);
  const daysAgo = Math.pow(Math.random(), 1.3) * 60;
  const shippedAt = addDays(now, -daysAgo);
  const transitDays = region.baseTransitDays * randFloat(0.85, 1.15);
  const dueAt = addDays(shippedAt, transitDays);

  const expectedArrival = addDays(shippedAt, transitDays);
  const stillInTransitWindow = expectedArrival.getTime() > now.getTime() - randFloat(0, 1) * 24 * 60 * 60 * 1000;

  const freightCost = region.baseCost * randFloat(0.85, 1.25);
  const weightKg = randFloat(0.3, 15);
  const customerCity = pick(CITIES[region.uf] ?? [region.uf]);

  // Ainda não deu tempo de chegar — envio em trânsito. Uma fração fica deliberadamente vencida
  // (backlog de atraso ainda não resolvido), o resto está dentro do prazo esperado.
  if (stillInTransitWindow) {
    return {
      id: nextId(),
      carrier: carrier.name,
      region: region.uf,
      status: "Em trânsito",
      shippedAt,
      dueAt,
      deliveredAt: null,
      occurrenceReason: null,
      freightCost,
      weightKg,
      customerCity,
    };
  }

  const hadOccurrence = Math.random() < carrier.occurrenceRate;
  if (hadOccurrence) {
    const status = weightedPick(OCCURRENCE_STATUSES);
    const reasons = OCCURRENCE_REASONS[status] ?? ["Motivo não informado"];
    // Avaria e devolução em geral ainda geram uma tentativa de entrega (têm data); insucesso e
    // extravio, na maioria das vezes, não chegam a ter uma data de entrega registrada.
    const hasDeliveredDate = status === "Avariado" || status === "Devolvido" || Math.random() < 0.3;
    const deliveredAt = hasDeliveredDate ? addDays(shippedAt, transitDays * randFloat(0.9, 1.6)) : null;

    return {
      id: nextId(),
      carrier: carrier.name,
      region: region.uf,
      status,
      shippedAt,
      dueAt,
      deliveredAt,
      occurrenceReason: pick(reasons),
      freightCost,
      weightKg,
      customerCity,
    };
  }

  const onTime = Math.random() < carrier.onTimeQuality;
  const deliveredAt = onTime
    ? addDays(shippedAt, transitDays * randFloat(0.6, 0.98))
    : addDays(shippedAt, transitDays * randFloat(1.05, 1.8));

  return {
    id: nextId(),
    carrier: carrier.name,
    region: region.uf,
    status: "Entregue",
    shippedAt,
    dueAt,
    deliveredAt,
    occurrenceReason: null,
    freightCost,
    weightKg,
    customerCity,
  };
}

/**
 * Monta um dataset sintético do zero, ancorado em `now` — sempre "atual" no momento em que o
 * visitante abre a demo pela primeira vez. Os desequilíbrios ("Norte Sul Transportes" com baixo %
 * no prazo e alta ocorrência, região "AM" com frete caro) são propositais — servem pra página de
 * Recomendações e os rankings terem o que mostrar.
 */
export function generateSampleShipments(now: Date = new Date()): Shipment[] {
  shipmentCounter = 500000;
  const shipments: Shipment[] = [];

  for (const carrier of CARRIERS) {
    for (let i = 0; i < carrier.volumeWeight; i++) {
      shipments.push(buildShipment(carrier, now));
    }
  }

  return shipments;
}
