import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  Building2,
  Calendar,
  FileText,
  MapPin,
  Phone,
  Radio,
  AlertTriangle,
  User,
  Siren,
} from "lucide-react";
import { fetchAlarmes, fetchUnidades, criticidadeLabel } from "@/lib/api";
import { customAsUnidades, loadCustom } from "@/lib/custom-empresas";
import { enrichLoja, descreverProblema } from "@/lib/loja-enrichment";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TelemetriaDialog } from "@/components/TelemetriaDialog";
import { AbrirChamadoDialog } from "@/components/AbrirChamadoDialog";

export const Route = createFileRoute("/_app/empresa/$contaId")({
  component: EmpresaPage,
});

function EmpresaPage() {
  const { contaId } = Route.useParams();
  const id = Number(contaId);
  const navigate = useNavigate();
  const unidadesQ = useQuery({ queryKey: ["unidades"], queryFn: fetchUnidades });
  const alarmesQ = useQuery({ queryKey: ["alarmes"], queryFn: fetchAlarmes });
  const [tel, setTel] = useState<{ id: number; nome: string } | null>(null);
  const [chamado, setChamado] = useState<{
    lojaId: number;
    lojaNome: string;
    dispositivoId: number;
    tag: string;
    motivoIA: string;
  } | null>(null);

  const data = useMemo(() => {
    const todas = [...(unidadesQ.data ?? []), ...customAsUnidades(loadCustom())];
    const lojas = todas.filter((u) => u.contaId === id);
    const alarmes = (alarmesQ.data ?? []).filter((a) => a.contaId === id);
    return { lojas, alarmes, nome: lojas[0]?.contaNm ?? `Empresa ${id}` };
  }, [unidadesQ.data, alarmesQ.data, id]);

  const alarmesPorLoja = useMemo(() => {
    const m = new Map<number, typeof data.alarmes>();
    for (const a of data.alarmes) {
      if (!m.has(a.lojaId)) m.set(a.lojaId, []);
      m.get(a.lojaId)!.push(a);
    }
    return m;
  }, [data.alarmes]);

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" onClick={() => navigate({ to: "/" })}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Voltar
      </Button>

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div
              className="grid h-12 w-12 place-items-center rounded-xl text-primary-foreground"
              style={{ background: "var(--gradient-frost)" }}
            >
              <Building2 className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{data.nome}</h1>
              <p className="text-sm text-muted-foreground">
                {data.lojas.length} loja{data.lojas.length !== 1 ? "s" : ""} ·{" "}
                {data.alarmes.length} alarmes nos últimos 30d
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4">
        {data.lojas.map((l) => {
          const lojaAlarmes = alarmesPorLoja.get(l.lojaId) ?? [];
          const dispositivos = new Map<number, string>();
          lojaAlarmes.forEach((a) => dispositivos.set(a.dispositivoId, a.dispositivoNm));
          const criticos = lojaAlarmes.filter((a) => a.criticidade === "A").length;
          return (
            <Card key={l.lojaId} className="overflow-hidden p-0">
              <div className="flex items-start justify-between gap-4 border-b border-border/60 bg-muted/30 p-5">
                <div className="min-w-0">
                  <h3 className="truncate text-lg font-semibold">{l.lojaNm}</h3>
                  <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <FileText className="h-3 w-3" />
                      {l.tpContratoNm}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Pedido {l.nrPedido}
                    </span>
                    {l.endereco && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {l.endereco}
                      </span>
                    )}
                    {l.telefone && (
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {l.telefone}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  {criticos > 0 && (
                    <Badge variant="destructive">
                      <AlertTriangle className="mr-1 h-3 w-3" />
                      {criticos} crítico{criticos > 1 ? "s" : ""}
                    </Badge>
                  )}
                  <span className="text-xs text-muted-foreground">
                    Sinal: {new Date(l.dhSinalVida).toLocaleString("pt-BR")}
                  </span>
                </div>
              </div>

              {lojaAlarmes.length === 0 ? (
                <div className="p-5 text-sm text-muted-foreground">
                  Sem alarmes ativos nos últimos 30 dias.
                </div>
              ) : (
                <div className="divide-y divide-border/60">
                  {lojaAlarmes.slice(0, 8).map((a) => (
                    <div
                      key={a.alarmeId}
                      className="flex items-center justify-between gap-4 p-4 text-sm"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <CritDot c={a.criticidade} />
                        <div className="min-w-0">
                          <div className="truncate font-medium">{a.alarmeDesc}</div>
                          <div className="truncate text-xs text-muted-foreground">
                            <Radio className="mr-1 inline h-3 w-3" />
                            {a.dispositivoNm} · {a.grupoNm} / {a.subgrupoNm} · há {a.tempo}
                          </div>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <Badge variant="outline">{criticidadeLabel(a.criticidade)}</Badge>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setTel({ id: a.dispositivoId, nome: a.dispositivoNm })}
                        >
                          Telemetria
                        </Button>
                        <Button
                          size="sm"
                          onClick={() =>
                            setChamado({
                              lojaId: l.lojaId,
                              lojaNome: l.lojaNm,
                              dispositivoId: a.dispositivoId,
                              tag: a.dispositivoNm,
                              motivoIA: a.alarmeDesc,
                            })
                          }
                        >
                          Abrir chamado
                        </Button>
                      </div>
                    </div>
                  ))}
                  {lojaAlarmes.length > 8 && (
                    <div className="p-3 text-center text-xs text-muted-foreground">
                      +{lojaAlarmes.length - 8} alarmes adicionais
                    </div>
                  )}
                </div>
              )}

              {dispositivos.size > 0 && lojaAlarmes.length === 0 && (
                <div className="p-3" />
              )}
            </Card>
          );
        })}
      </div>

      <TelemetriaDialog
        open={!!tel}
        onOpenChange={(o) => !o && setTel(null)}
        dispositivoId={tel?.id ?? null}
        dispositivoNome={tel?.nome ?? ""}
      />
      <AbrirChamadoDialog
        open={!!chamado}
        onOpenChange={(o) => !o && setChamado(null)}
        data={chamado}
      />
    </div>
  );
}

function CritDot({ c }: { c: string }) {
  const cls =
    c === "A"
      ? "bg-destructive"
      : c === "M"
      ? "bg-[oklch(0.75_0.18_70)]"
      : "bg-[oklch(0.65_0.16_150)]";
  return <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${cls}`} aria-hidden />;
}
