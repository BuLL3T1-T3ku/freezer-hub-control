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

      <CriticosDialog
        open={showCriticos}
        onOpenChange={setShowCriticos}
        alarmes={criticosList}
      />

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
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  tone?: "warning" | "danger";
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
      <div>
        <div className="text-2xl font-bold leading-none">{value}</div>
        <div className="mt-1 text-xs text-muted-foreground">{label}</div>
      </div>
    </Card>
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
