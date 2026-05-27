import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Building2,
  Search,
  Store,
  Activity,
  ShieldCheck,
} from "lucide-react";
import { fetchAlarmes, fetchUnidades, criticidadeLabel, type Alarme } from "@/api's/api";
import { customAsUnidades, loadCustom } from "@/api's/custom-empresas";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ParametrosPanel } from "@/components/ParametrosPanel";
import { IncidenteDialog } from "@/components/IncidenteDialog";
import { WhatsAppQRDialog } from "@/components/WhatsAppQRDialog";
import { enrichLoja } from "@/api's/loja-enrichment";
import { Thermometer, MessageCircle } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";

export const Route = createFileRoute("/_app/")({
  component: Dashboard,
  head: () => ({
    meta: [
      { title: "Freezer Controle — Dashboard" },
      { name: "description", content: "Monitoramento de refrigeração por empresa" },
    ],
  }),
});

function Dashboard() {
  const unidadesQ = useQuery({ queryKey: ["unidades"], queryFn: fetchUnidades });
  const alarmesQ = useQuery({ queryKey: ["alarmes"], queryFn: fetchAlarmes });
  const [q, setQ] = useState("");
  const [showCriticos, setShowCriticos] = useState(false);

  const criticosList = useMemo(
    () => (alarmesQ.data ?? []).filter((a) => a.criticidade === "A"),
    [alarmesQ.data],
  );

  const empresas = useMemo(() => {
    const list = [...(unidadesQ.data ?? []), ...customAsUnidades(loadCustom())];
    const alarms = alarmesQ.data ?? [];
    const byConta = new Map<
      number,
      { contaId: number; contaNm: string; lojas: typeof list; alarmes: number; criticos: number }
    >();
    for (const u of list) {
      if (!byConta.has(u.contaId)) {
        byConta.set(u.contaId, {
          contaId: u.contaId,
          contaNm: u.contaNm,
          lojas: [],
          alarmes: 0,
          criticos: 0,
        });
      }
      byConta.get(u.contaId)!.lojas.push(u);
    }
    for (const a of alarms) {
      const e = byConta.get(a.contaId);
      if (!e) continue;
      e.alarmes++;
      if (a.criticidade === "A") e.criticos++;
    }
    const arr = Array.from(byConta.values()).sort((a, b) =>
      a.contaNm.localeCompare(b.contaNm),
    );
    const term = q.trim().toLowerCase();
    return term ? arr.filter((e) => e.contaNm.toLowerCase().includes(term)) : arr;
  }, [unidadesQ.data, alarmesQ.data, q]);

  const totals = useMemo(() => {
    const lojas = empresas.reduce((s, e) => s + e.lojas.length, 0);
    const alarmes = empresas.reduce((s, e) => s + e.alarmes, 0);
    const criticos = empresas.reduce((s, e) => s + e.criticos, 0);
    return { lojas, alarmes, criticos, empresas: empresas.length };
  }, [empresas]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Visão geral</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Monitoramento em tempo real organizado por empresa.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard icon={Building2} label="Empresas" value={totals.empresas} />
        <StatCard icon={Store} label="Lojas" value={totals.lojas} />
        <StatCard icon={Activity} label="Alarmes 30d" value={totals.alarmes} tone="warning" />
        <StatCard
          icon={AlertTriangle}
          label="Críticos"
          value={totals.criticos}
          tone="danger"
          action={
            totals.criticos > 0 ? (
              <Button
                size="sm"
                variant="destructive"
                className="mt-2 h-7 px-2 text-xs"
                onClick={() => setShowCriticos(true)}
              >
                Ver todos
              </Button>
            ) : null
          }
        />
      </div>

      <CriticosChart empresas={empresas} />

      <CriticosDialog
        open={showCriticos}
        onOpenChange={setShowCriticos}
        alarmes={criticosList}
      />

      <ParametrosPanel />

      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar empresa..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="pl-9"
        />
      </div>

      {unidadesQ.isLoading ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center text-muted-foreground">
          Carregando empresas...
        </div>
      ) : unidadesQ.isError ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive">
          Erro ao carregar dados da API.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {empresas.map((e) => (
            <Link
              key={e.contaId}
              to="/empresa/$contaId"
              params={{ contaId: String(e.contaId) }}
              className="group"
            >
              <Card className="h-full overflow-hidden border-border/70 p-5 transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-primary" />
                      <h3 className="truncate font-semibold">{e.contaNm}</h3>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      ID conta {e.contaId}
                    </p>
                  </div>
                  {e.criticos > 0 ? (
                    <Badge variant="destructive" className="shrink-0">
                      {e.criticos} crítico{e.criticos > 1 ? "s" : ""}
                    </Badge>
                  ) : e.alarmes === 0 ? (
                    <Badge className="shrink-0 bg-[oklch(0.65_0.16_150)] text-white hover:bg-[oklch(0.65_0.16_150)]">
                      <ShieldCheck className="mr-1 h-3 w-3" />
                      OK
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="shrink-0">
                      {e.alarmes} alarme{e.alarmes > 1 ? "s" : ""}
                    </Badge>
                  )}
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2 border-t border-border/60 pt-4 text-center">
                  <Mini label="Lojas" value={e.lojas.length} />
                  <Mini label="Alarmes" value={e.alarmes} />
                  <Mini label="Críticos" value={e.criticos} tone={e.criticos ? "danger" : undefined} />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  tone,
  action,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  tone?: "warning" | "danger";
  action?: React.ReactNode;
}) {
  const color =
    tone === "danger"
      ? "text-destructive bg-destructive/10"
      : tone === "warning"
      ? "text-[oklch(0.65_0.18_70)] bg-[oklch(0.95_0.05_80)]"
      : "text-primary bg-primary/10";
  return (
    <Card className="flex items-center gap-4 p-5">
      <div className={`grid h-12 w-12 place-items-center rounded-xl ${color}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <div className="text-2xl font-bold leading-none">{value}</div>
        <div className="mt-1 text-xs text-muted-foreground">{label}</div>
        {action}
      </div>
    </Card>
  );
}

function CriticosDialog({
  open,
  onOpenChange,
  alarmes,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  alarmes: Alarme[];
}) {
  const [incidente, setIncidente] = useState<Alarme | null>(null);
  const [whats, setWhats] = useState<{ a: Alarme; temp?: number } | null>(null);

  const grouped = useMemo(() => {
    const map = new Map<number, { contaNm: string; contaId: number; items: Alarme[] }>();
    for (const a of alarmes) {
      if (!map.has(a.contaId)) map.set(a.contaId, { contaNm: a.contaNm, contaId: a.contaId, items: [] });
      map.get(a.contaId)!.items.push(a);
    }
    return Array.from(map.values()).sort((a, b) => b.items.length - a.items.length);
  }, [alarmes]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-3xl overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Alertas críticos ({alarmes.length})
          </DialogTitle>
          <DialogDescription>
            Todos os alarmes de criticidade alta em monitoramento.
          </DialogDescription>
        </DialogHeader>
        <div className="-mx-6 max-h-[65vh] overflow-y-auto px-6">
          {grouped.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              Nenhum alerta crítico no momento.
            </div>
          ) : (
            <div className="space-y-5">
              {grouped.map((g) => (
                <div key={g.contaId}>
                  <div className="mb-2 flex items-center justify-between">
                    <Link
                      to="/empresa/$contaId"
                      params={{ contaId: String(g.contaId) }}
                      onClick={() => onOpenChange(false)}
                      className="flex items-center gap-2 text-sm font-semibold hover:text-primary"
                    >
                      <Building2 className="h-4 w-4 text-primary" />
                      {g.contaNm}
                    </Link>
                    <Badge variant="destructive">{g.items.length}</Badge>
                  </div>
                  <div className="space-y-2">
                    {g.items.map((a) => (
                      <div
                        key={a.alarmeId}
                        className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="truncate font-medium">{a.lojaNm}</div>
                            <div className="mt-0.5 text-xs text-muted-foreground">
                              {a.dispositivoNm} · {a.grupoNm}
                              {a.subgrupoNm ? ` / ${a.subgrupoNm}` : ""}
                            </div>
                            <div className="mt-1 text-xs">{a.alarmeDesc}</div>
                          </div>
                          <div className="shrink-0 text-right">
                            <Badge variant="destructive" className="text-[10px]">
                              {criticidadeLabel(a.criticidade)}
                            </Badge>
                            <div className="mt-1 text-[10px] text-muted-foreground">{a.tempo}</div>
                          </div>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 px-2 text-xs"
                            onClick={() => setIncidente(a)}
                          >
                            <Thermometer className="mr-1 h-3 w-3" />
                            Ver temperatura
                          </Button>
                          <Button
                            size="sm"
                            className="h-7 bg-[oklch(0.65_0.16_150)] px-2 text-xs hover:bg-[oklch(0.6_0.16_150)]"
                            onClick={() => setWhats({ a })}
                          >
                            <MessageCircle className="mr-1 h-3 w-3" />
                            QR WhatsApp
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
      <IncidenteDialog
        open={!!incidente}
        onOpenChange={(o) => !o && setIncidente(null)}
        alarme={incidente}
        onWhatsApp={(temp) => {
          if (incidente) {
            setWhats({ a: incidente, temp });
            setIncidente(null);
          }
        }}
      />
      {whats && (
        <WhatsAppQRDialog
          open={!!whats}
          onOpenChange={(o) => !o && setWhats(null)}
          contaId={whats.a.contaId}
          contaNm={whats.a.contaNm}
          lojaNm={whats.a.lojaNm}
          endereco={enrichLoja(whats.a.lojaId).endereco}
          telefoneContato={enrichLoja(whats.a.lojaId).telefone}
          alarmeDesc={whats.a.alarmeDesc}
          dispositivoNm={whats.a.dispositivoNm}
          tempAtual={whats.temp}
        />
      )}
    </Dialog>
  );
}

function Mini({ label, value, tone }: { label: string; value: number; tone?: "danger" }) {
  return (
    <div>
      <div className={`text-lg font-semibold ${tone === "danger" ? "text-destructive" : ""}`}>
        {value}
      </div>
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
    </div>
  );
}

function CriticosChart({
  empresas,
}: {
  empresas: { contaNm: string; alarmes: number; criticos: number }[];
}) {
  const data = empresas
    .filter((e) => e.alarmes > 0)
    .sort((a, b) => b.criticos - a.criticos || b.alarmes - a.alarmes)
    .slice(0, 8)
    .map((e) => ({
      nome: e.contaNm.length > 18 ? e.contaNm.slice(0, 16) + "…" : e.contaNm,
      Críticos: e.criticos,
      Outros: Math.max(0, e.alarmes - e.criticos),
    }));
  if (data.length === 0) return null;
  return (
    <Card className="p-5">
      <div className="mb-3">
        <h2 className="text-sm font-semibold">Alarmes por empresa (top 8)</h2>
        <p className="text-xs text-muted-foreground">
          Distribuição entre alarmes críticos e demais ocorrências.
        </p>
      </div>
      <div className="h-64 w-full">
        <ChartView data={data} />
      </div>
    </Card>
  );
}

function ChartView({
  data,
}: {
  data: { nome: string; Críticos: number; Outros: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 5, right: 12, left: -8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.02 225)" />
        <XAxis dataKey="nome" tick={{ fontSize: 10 }} interval={0} angle={-15} textAnchor="end" height={50} />
        <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
        <Tooltip />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        <Bar dataKey="Críticos" stackId="a" fill="oklch(0.6 0.22 25)" radius={[0, 0, 0, 0]} />
        <Bar dataKey="Outros" stackId="a" fill="oklch(0.75 0.18 70)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

