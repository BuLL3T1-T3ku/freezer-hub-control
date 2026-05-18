export interface Unidade {
  lojaId: number;
  lojaNm: string;
  lojaApelido: string | null;
  ativo: boolean;
  tpContratoNm: string;
  dtValContrato: string;
  contaId: number;
  contaNm: string;
  cnpj: string | null;
  nrPedido: string;
  telefone: string | null;
  dhSinalVida: string;
  endereco: string | null;
}

export interface Alarme {
  contaId: number;
  contaNm: string;
  lojaId: number;
  lojaNm: string;
  dispositivoId: number;
  dispositivoNm: string;
  grupoNm: string;
  subgrupoNm: string;
  alarmeId: number;
  alarmeDhCad: string;
  alarmeDesc: string;
  criticidade: string; // A, M, B
  tempo: string;
}

export interface Telemetria {
  labels: string[];
  datasets: { label?: string; data: number[] }[];
}

const base = (route: string, extra = "") =>
  `/api/proxy/_?route=${route}${extra}`;

export async function fetchUnidades(): Promise<Unidade[]> {
  const r = await fetch(base("unidades"));
  return r.json();
}

export async function fetchAlarmes(): Promise<Alarme[]> {
  const r = await fetch(base("alarmes"));
  return r.json();
}

export async function fetchTelemetria(dispositivoId: number): Promise<Telemetria> {
  const r = await fetch(base("telemetria", `&dispositivoId=${dispositivoId}`));
  return r.json();
}

export interface AbrirChamadoPayload {
  equipe: string;
  lojaId: number;
  lojaNome: string;
  dispositivoId: number;
  tag: string;
  motivoIA: string;
  requerTecnico: boolean;
}

export async function abrirChamado(payload: AbrirChamadoPayload) {
  const r = await fetch(base("abrir-chamado"), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  return r.json();
}

export const criticidadeLabel = (c: string) =>
  c === "A" ? "Alta" : c === "M" ? "Média" : c === "B" ? "Baixa" : c;
