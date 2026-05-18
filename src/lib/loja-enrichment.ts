// Enriquecimento determinístico de lojas: endereço real-like, contato fictício e telefone.
// Baseado no lojaId (hash) para que cada loja sempre receba os mesmos dados.

const RUAS = [
  "Av. Paulista, 1578",
  "R. Augusta, 2840",
  "Av. Brigadeiro Faria Lima, 3477",
  "R. Oscar Freire, 725",
  "Av. Rebouças, 600",
  "R. Haddock Lobo, 595",
  "Av. Ibirapuera, 2927",
  "R. Teodoro Sampaio, 1020",
  "Av. Nove de Julho, 5017",
  "R. Pamplona, 1188",
  "Av. Sumaré, 1234",
  "R. Voluntários da Pátria, 540",
  "Av. das Nações Unidas, 12901",
  "R. Domingos de Morais, 2187",
  "Av. Santo Amaro, 4154",
  "R. Pedroso Alvarenga, 858",
  "Av. Cidade Jardim, 400",
  "R. Bela Cintra, 1149",
  "Av. Engenheiro Luís Carlos Berrini, 1681",
  "R. Joaquim Floriano, 466",
];

const BAIRROS_CIDADES: [string, string, string][] = [
  ["Bela Vista", "São Paulo - SP", "01310-100"],
  ["Consolação", "São Paulo - SP", "01304-001"],
  ["Itaim Bibi", "São Paulo - SP", "04538-133"],
  ["Jardins", "São Paulo - SP", "01426-001"],
  ["Pinheiros", "São Paulo - SP", "05402-600"],
  ["Cerqueira César", "São Paulo - SP", "01414-001"],
  ["Moema", "São Paulo - SP", "04029-200"],
  ["Vila Madalena", "São Paulo - SP", "05409-002"],
  ["Jardim Paulista", "São Paulo - SP", "01407-200"],
  ["Higienópolis", "São Paulo - SP", "01244-000"],
  ["Perdizes", "São Paulo - SP", "05016-000"],
  ["Santana", "São Paulo - SP", "02012-010"],
  ["Brooklin", "São Paulo - SP", "04578-000"],
  ["Vila Mariana", "São Paulo - SP", "04108-010"],
  ["Campo Belo", "São Paulo - SP", "04611-000"],
];

const NOMES = [
  "Carlos Almeida",
  "Mariana Souza",
  "Ricardo Ferreira",
  "Juliana Martins",
  "Eduardo Pereira",
  "Fernanda Lima",
  "Rafael Oliveira",
  "Patrícia Gomes",
  "Bruno Cavalcanti",
  "Camila Ribeiro",
  "Diego Nascimento",
  "Larissa Andrade",
  "Thiago Barbosa",
  "Aline Cardoso",
  "Marcelo Rocha",
  "Beatriz Mendes",
  "Felipe Araújo",
  "Vanessa Castro",
  "Gustavo Teixeira",
  "Renata Pinto",
];

const CARGOS = [
  "Gerente da loja",
  "Sub-gerente",
  "Encarregado de manutenção",
  "Supervisor operacional",
  "Responsável noturno",
  "Coordenador de açougue",
  "Líder de FLV",
];

function hash(n: number) {
  let h = (n * 2654435761) >>> 0;
  h ^= h >>> 16;
  h = (h * 0x85ebca6b) >>> 0;
  h ^= h >>> 13;
  return h >>> 0;
}

export interface LojaEnrich {
  endereco: string;
  contato: string;
  cargo: string;
  telefone: string;
}

export function enrichLoja(lojaId: number, fallbackEndereco?: string | null, fallbackTelefone?: string | null): LojaEnrich {
  const h1 = hash(lojaId);
  const h2 = hash(lojaId + 7919);
  const h3 = hash(lojaId + 104729);

  const rua = RUAS[h1 % RUAS.length];
  const bc = BAIRROS_CIDADES[h2 % BAIRROS_CIDADES.length];
  const endereco = fallbackEndereco?.trim() || `${rua} - ${bc[0]}, ${bc[1]}, CEP ${bc[2]}`;

  const nome = NOMES[h3 % NOMES.length];
  const cargo = CARGOS[(h1 ^ h3) % CARGOS.length];

  const ddd = 11;
  const p1 = String(90000 + (h2 % 9999)).slice(0, 5);
  const p2 = String(1000 + (h3 % 8999)).slice(0, 4);
  const telefone = fallbackTelefone?.trim() || `(${ddd}) 9${p1.slice(1)}-${p2}`;

  return { endereco, contato: nome, cargo, telefone };
}

// Descrições mais específicas para alarmes críticos, derivadas do texto do alarme.
export function descreverProblema(alarmeDesc: string, dispositivoNm: string, grupoNm: string, subgrupoNm: string): string {
  const d = alarmeDesc.toLowerCase();
  if (d.includes("temperatura") || d.includes("temp"))
    return `Temperatura fora da faixa segura no equipamento ${dispositivoNm} (${subgrupoNm}). Risco imediato de perda de produto — verificar termostato, degelo e vedação das portas.`;
  if (d.includes("comunic") || d.includes("offline") || d.includes("sinal"))
    return `Perda de comunicação com ${dispositivoNm}. Sem leitura de telemetria há vários minutos — checar gateway, energia e cabeamento de rede do ${grupoNm}.`;
  if (d.includes("porta") || d.includes("aberta"))
    return `Porta do ${dispositivoNm} permanece aberta acima do tempo limite. Pode estar mal encostada ou com problema na borracha de vedação.`;
  if (d.includes("degelo"))
    return `Ciclo de degelo prolongado em ${dispositivoNm}. Verificar resistência, dreno e sensor de evaporadora.`;
  if (d.includes("pressão") || d.includes("pressao"))
    return `Pressão anormal detectada em ${dispositivoNm} (${grupoNm}). Possível vazamento de gás ou compressor sobrecarregado — intervenção técnica recomendada.`;
  if (d.includes("compressor"))
    return `Falha no compressor de ${dispositivoNm}. Sistema pode estar inoperante; agendar manutenção emergencial.`;
  if (d.includes("energia") || d.includes("falta"))
    return `Interrupção de energia detectada em ${dispositivoNm}. Confirmar disjuntor, no-break e alimentação do painel.`;
  return `${alarmeDesc} — ocorrência crítica em ${dispositivoNm} (${grupoNm} / ${subgrupoNm}). Necessária inspeção presencial.`;
}
