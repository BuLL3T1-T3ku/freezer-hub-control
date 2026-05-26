import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Thermometer, AlertTriangle, Wrench, MessageCircle } from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceArea,
} from "recharts";
import { incidenteDoAlarme } from "@/api's/temperatura";
import type { Alarme } from "@/api's/api";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  alarme: Alarme | null;
  endereco?: string;
  contaNm?: string;
  onWhatsApp?: (tempAtual: number) => void;
}

export function IncidenteDialog({
  open,
  onOpenChange,
  alarme,
  onWhatsApp,
}: Props) {
  if (!alarme) return null;
  const inc = incidenteDoAlarme(alarme.alarmeId, alarme.grupoNm, alarme.subgrupoNm, alarme.alarmeDesc);
  const acima = inc.tempAtual > inc.faixa.max;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Incidente de temperatura
          </DialogTitle>
          <DialogDescription>
            {alarme.lojaNm} · {alarme.dispositivoNm} ({alarme.grupoNm} / {alarme.subgrupoNm})
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Thermometer className="h-3 w-3" /> Temperatura atual
            </div>
            <div className="mt-1 text-3xl font-bold text-destructive tabular-nums">
              {inc.tempAtual}°C
            </div>
            <Badge variant="destructive" className="mt-2">
              {acima ? "+" : "-"}{inc.desvio}°C fora da faixa
            </Badge>
          </div>
          <div className="rounded-lg border border-border/60 bg-muted/30 p-4">
            <div className="text-xs text-muted-foreground">Faixa segura</div>
            <div className="mt-1 text-2xl font-bold tabular-nums">
              {inc.faixa.min}° / {inc.faixa.max}°C
            </div>
            <div className="mt-1 text-xs text-muted-foreground">{inc.faixa.tipo}</div>
          </div>
          <div className="rounded-lg border border-border/60 bg-muted/30 p-4">
            <div className="text-xs text-muted-foreground">Há</div>
            <div className="mt-1 text-2xl font-bold tabular-nums">{alarme.tempo}</div>
            <div className="mt-1 text-xs text-muted-foreground">desde o disparo</div>
          </div>
        </div>

        <div className="rounded-lg border border-border/60 bg-card">
          <div className="border-b border-border/60 px-4 py-2 text-xs font-semibold text-muted-foreground">
            Evolução nas últimas 2 horas
          </div>
          <div className="h-56 w-full p-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={inc.historico}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.9 0.02 225)" />
                <XAxis dataKey="t" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} domain={["dataMin - 2", "dataMax + 2"]} />
                <Tooltip formatter={(v: number) => `${v}°C`} />
                <ReferenceArea
                  y1={inc.faixa.min}
                  y2={inc.faixa.max}
                  fill="oklch(0.65 0.16 150)"
                  fillOpacity={0.12}
                />
                <Line
                  type="monotone"
                  dataKey="temp"
                  stroke="oklch(0.6 0.22 25)"
                  strokeWidth={2}
                  dot={{ r: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-border/60 p-3 text-sm">
            <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
              <AlertTriangle className="h-3 w-3" /> Causa provável
            </div>
            {inc.causaProvavel}
          </div>
          <div className="rounded-lg border border-border/60 p-3 text-sm">
            <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
              <Wrench className="h-3 w-3" /> Ação sugerida
            </div>
            {inc.acaoSugerida}
          </div>
        </div>

        {onWhatsApp && (
          <Button
            className="w-full bg-[oklch(0.65_0.16_150)] hover:bg-[oklch(0.6_0.16_150)]"
            onClick={() => onWhatsApp(inc.tempAtual)}
          >
            <MessageCircle className="mr-2 h-4 w-4" />
            Gerar QR e enviar para WhatsApp do responsável
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
}
