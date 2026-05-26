// Parâmetros fixos de temperatura por tipo de equipamento e geração
// de "incidente de temperatura" determinístico por alarme.

export interface FaixaTemp {
  tipo: string;
  min: number;
  max: number;
  unidade: "°C";
  descricao: string;
}

export const PARAMETROS_TEMPERATURA: FaixaTemp[] = [
  { tipo: "Freezer / Congelados", min: -22, max: -18, unidade: "°C", descricao: "Sorvetes, congelados, carnes" },
  { tipo: "Câmara fria de congelados", min: -25, max: -20, unidade: "°C", descricao: "Estocagem profunda" },
  { tipo: "Geladeira / Refrigerados", min: 2, max: 8, unidade: "°C", descricao: "Laticínios, frios, FLV" },
  { tipo: "Câmara fria de resfriados", min: 0, max: 4, unidade: "°C", descricao: "Carnes resfriadas" },
  { tipo: "Açougue / Balcão de carnes", min: 0, max: 4, unidade: "°C", descricao: "Exposição de carnes" },
  { tipo: "Padaria / Confeitaria fria", min: 4, max: 10, unidade: "°C", descricao: "Tortas, doces refrigerados" },
  { tipo: "Ilha de bebidas", min: 4, max: 7, unidade: "°C", descricao: "Bebidas geladas" },
  { tipo: "Ambiente climatizado", min: 18, max: 24, unidade: "°C", descricao: "Sala de vendas" },
];

function hash(n: number) {
  let h = (n * 2654435761) >>> 0;
  h ^= h >>> 16;
  h = (h * 0x85ebca6b) >>> 0;
  h ^= h >>> 13;
  return h >>> 0;
}

export function faixaParaDispositivo(grupoNm: string, subgrupoNm: string): FaixaTemp {
  const t = `${grupoNm} ${subgrupoNm}`.toLowerCase();
  if (t.includes("conge") || t.includes("freezer") || t.includes("sorvet")) return PARAMETROS_TEMPERATURA[0];
  if (t.includes("câmara") && t.includes("conge")) return PARAMETROS_TEMPERATURA[1];
  if (t.includes("açoug") || t.includes("acoug") || t.includes("carne")) return PARAMETROS_TEMPERATURA[4];
  if (t.includes("padar") || t.includes("confeit")) return PARAMETROS_TEMPERATURA[5];
  if (t.includes("bebid")) return PARAMETROS_TEMPERATURA[6];
  if (t.includes("ambient") || t.includes("clima")) return PARAMETROS_TEMPERATURA[7];
  if (t.includes("resfri")) return PARAMETROS_TEMPERATURA[3];
  return PARAMETROS_TEMPERATURA[2]; // geladeira default
}

export interface IncidenteTemp {
  faixa: FaixaTemp;
  tempAtual: number;
  desvio: number;
  causaProvavel: string;
  acaoSugerida: string;
  historico: { t: string; temp: number }[];
}

const CAUSAS = [
  {
    k: "compressor",
    causa: "Compressor com baixa performance ou intermitência no acionamento.",
    acao: "Verificar pressostatos, contatora e capacitor de partida. Medir corrente do compressor.",
  },
  {
    k: "degelo",
    causa: "Ciclo de degelo prolongado / resistência presa ligada.",
    acao: "Inspecionar timer/placa de degelo, resistência e sensor de evaporadora.",
  },
  {
    k: "vedacao",
    causa: "Vedação da porta comprometida — entrada constante de ar quente.",
    acao: "Trocar borracha de vedação, alinhar dobradiças e confirmar fechamento automático.",
  },
  {
    k: "gas",
    causa: "Baixa carga de gás refrigerante (possível vazamento).",
    acao: "Teste de estanqueidade no circuito, recolher gás e recarregar conforme placa.",
  },
  {
    k: "evaporadora",
    causa: "Evaporadora bloqueada por gelo ou ventilador parado.",
    acao: "Forçar degelo manual, verificar motor do ventilador e dreno.",
  },
  {
    k: "termostato",
    causa: "Termostato/sensor descalibrado reportando leitura incorreta.",
    acao: "Comparar com termômetro aferido e substituir sensor se necessário.",
  },
  {
    k: "carga",
    causa: "Sobrecarga térmica — reposição recente de produtos não pré-resfriados.",
    acao: "Confirmar procedimento de abastecimento e aguardar recuperação por 30–60 min.",
  },
];

export function incidenteDoAlarme(
  alarmeId: number,
  grupoNm: string,
  subgrupoNm: string,
  alarmeDesc: string,
): IncidenteTemp {
  const faixa = faixaParaDispositivo(grupoNm, subgrupoNm);
  const h1 = hash(alarmeId);
  const h2 = hash(alarmeId + 1009);

  // Desvio entre 1.5 e 7°C
  const desvio = 1.5 + ((h1 % 550) / 100);
  const acima = (h2 & 1) === 0;
  const tempAtual = +(acima ? faixa.max + desvio : faixa.min - desvio).toFixed(1);

  const desc = alarmeDesc.toLowerCase();
  let causaIdx = h1 % CAUSAS.length;
  if (desc.includes("degelo")) causaIdx = 1;
  else if (desc.includes("porta")) causaIdx = 2;
  else if (desc.includes("compressor")) causaIdx = 0;
  else if (desc.includes("gás") || desc.includes("gas") || desc.includes("pressão")) causaIdx = 3;

  // Histórico de 12 pontos (últimas 2h, intervalos de 10min)
  const historico: { t: string; temp: number }[] = [];
  const base = (faixa.min + faixa.max) / 2;
  for (let i = 11; i >= 0; i--) {
    const noise = ((hash(alarmeId + i * 31) % 100) / 100 - 0.5) * 0.8;
    // Curva crescente até tempAtual
    const progress = (11 - i) / 11;
    const v = base + (tempAtual - base) * progress + noise;
    const d = new Date(Date.now() - i * 10 * 60 * 1000);
    historico.push({
      t: d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
      temp: +v.toFixed(1),
    });
  }

  return {
    faixa,
    tempAtual,
    desvio: +desvio.toFixed(1),
    causaProvavel: CAUSAS[causaIdx].causa,
    acaoSugerida: CAUSAS[causaIdx].acao,
    historico,
  };
}
