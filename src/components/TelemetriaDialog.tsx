import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { fetchTelemetria } from "@/lib/api";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";

const COLORS = [
  "oklch(0.55 0.16 230)",
  "oklch(0.6 0.22 25)",
  "oklch(0.65 0.16 150)",
  "oklch(0.75 0.18 70)",
];

export function TelemetriaDialog({
  open,
  onOpenChange,
  dispositivoId,
  dispositivoNome,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  dispositivoId: number | null;
  dispositivoNome: string;
}) {
  const q = useQuery({
    queryKey: ["telemetria", dispositivoId],
    queryFn: () => fetchTelemetria(dispositivoId!),
    enabled: !!dispositivoId && open,
  });

  const chartData = (() => {
    if (!q.data) return [];
    const { labels, datasets } = q.data;
    return labels.map((label, i) => {
      const row: Record<string, string | number> = { label };
      datasets.forEach((d, j) => {
        row[d.label ?? `Série ${j + 1}`] = d.data[i] ?? 0;
      });
      return row;
    });
  })();

  const seriesNames =
    q.data?.datasets.map((d, j) => d.label ?? `Série ${j + 1}`) ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Telemetria · {dispositivoNome}</DialogTitle>
          <DialogDescription>
            Dispositivo {dispositivoId} — temperatura registrada
          </DialogDescription>
        </DialogHeader>
        <div className="h-80 w-full">
          {q.isLoading ? (
            <div className="grid h-full place-items-center text-sm text-muted-foreground">
              Carregando telemetria...
            </div>
          ) : !q.data || seriesNames.length === 0 ? (
            <div className="grid h-full place-items-center text-sm text-muted-foreground">
              Sem dados de temperatura disponíveis para este dispositivo.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.9 0.02 225)" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} minTickGap={30} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                {seriesNames.map((n, i) => (
                  <Line
                    key={n}
                    type="monotone"
                    dataKey={n}
                    stroke={COLORS[i % COLORS.length]}
                    dot={false}
                    strokeWidth={2}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
