import type { Unidade } from "./api";

const KEY = "freezer-controle:empresas-custom";

export interface CustomEmpresa {
  contaId: number;
  contaNm: string;
  lojas: {
    lojaId: number;
    lojaNm: string;
    tpContratoNm: string;
    nrPedido: string;
    telefone: string;
    endereco: string;
    cnpj: string;
    dtValContrato: string;
  }[];
}

export function loadCustom(): CustomEmpresa[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

export function saveCustom(list: CustomEmpresa[]) {
  localStorage.setItem(KEY, JSON.stringify(list));
}

export function customAsUnidades(list: CustomEmpresa[]): Unidade[] {
  const out: Unidade[] = [];
  for (const e of list) {
    for (const l of e.lojas) {
      out.push({
        lojaId: l.lojaId,
        lojaNm: l.lojaNm,
        lojaApelido: null,
        ativo: true,
        tpContratoNm: l.tpContratoNm,
        dtValContrato: l.dtValContrato,
        contaId: e.contaId,
        contaNm: e.contaNm,
        cnpj: l.cnpj,
        nrPedido: l.nrPedido,
        telefone: l.telefone,
        dhSinalVida: new Date().toISOString(),
        endereco: l.endereco,
      });
    }
  }
  return out;
}
