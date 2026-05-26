import { Card } from "@/components/ui/card";
import { Thermometer, Snowflake } from "lucide-react";
import { PARAMETROS_TEMPERATURA } from "@/api's/temperatura";

export function ParametrosPanel() {
  return (
    <Card className="p-5">
      <div className="mb-4 flex items-center gap-2">
        <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary">
          <Thermometer className="h-4 w-4" />
        </div>
        <div>
          <h2 className="text-sm font-semibold">Parâmetros de temperatura</h2>
          <p className="text-xs text-muted-foreground">
            Faixas operacionais de referência por tipo de equipamento.
          </p>
        </div>
      </div>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {PARAMETROS_TEMPERATURA.map((p) => {
          const frio = p.max <= 0;
          return (
            <div
              key={p.tipo}
              className="rounded-lg border border-border/60 bg-muted/30 p-3 text-xs"
            >
              <div className="flex items-center gap-1.5 font-semibold text-foreground">
                {frio && <Snowflake className="h-3 w-3 text-primary" />}
                {p.tipo}
              </div>
              <div className="mt-1 text-base font-bold tabular-nums text-primary">
                {p.min}° a {p.max}°C
              </div>
              <div className="mt-0.5 text-[11px] text-muted-foreground">{p.descricao}</div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
