// Storage local de chamados abertos.
export interface Chamado {
  id: string;
  abertoEm: string; // ISO
  equipe: string;
  contaId: number;
  contaNm: string;
  lojaId: number;
  lojaNm: string;
  endereco: string;
  dispositivoId: number;
  tag: string;
  motivo: string;
  tempAtual?: number;
  requerTecnico: boolean;
  status: "aberto" | "em_andamento" | "fechado";
}

const KEY = "fc.chamados.v1";

export function loadChamados(): Chamado[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export function saveChamados(list: Chamado[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(list));
}

export function addChamado(c: Omit<Chamado, "id" | "abertoEm" | "status">): Chamado {
  const novo: Chamado = {
    ...c,
    id: `CH-${Date.now().toString(36).toUpperCase()}`,
    abertoEm: new Date().toISOString(),
    status: "aberto",
  };
  const list = loadChamados();
  saveChamados([novo, ...list]);
  return novo;
}

export function removeChamado(id: string) {
  saveChamados(loadChamados().filter((c) => c.id !== id));
}

export function updateChamadoStatus(id: string, status: Chamado["status"]) {
  saveChamados(
    loadChamados().map((c) => (c.id === id ? { ...c, status } : c)),
  );
}

export const TELEFONE_CHAMADOS = "41992097489";
