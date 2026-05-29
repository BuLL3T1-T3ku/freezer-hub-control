import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { abrirChamado } from "@/api's/api";
import { addChamado, type Chamado } from "@/api's/chamados";

export interface AbrirChamadoData {
  contaId: number;
  contaNm: string;
  lojaId: number;
  lojaNome: string;
  endereco: string;
  dispositivoId: number;
  tag: string;
  motivoIA: string;
  tempAtual?: number;
}

export function AbrirChamadoDialog({
  open,
  onOpenChange,
  data,
  onAberto,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  data: AbrirChamadoData | null;
  onAberto?: (chamado: Chamado) => void;
}) {
  const [equipe, setEquipe] = useState("Equipe Freezer Controle");
  const [motivo, setMotivo] = useState("");
  const [requerTecnico, setRequerTecnico] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (data) setMotivo(data.motivoIA);
  }, [data]);

  async function submit() {
    if (!data) return;
    setLoading(true);
    try {
      // chama API (não bloqueia se falhar)
      try {
        await abrirChamado({
          equipe,
          lojaId: data.lojaId,
          lojaNome: data.lojaNome,
          dispositivoId: data.dispositivoId,
          tag: data.tag,
          motivoIA: motivo,
          requerTecnico,
        });
      } catch {
        // ignora erro de proxy — registramos localmente abaixo
      }

      const chamado = addChamado({
        equipe,
        contaId: data.contaId,
        contaNm: data.contaNm,
        lojaId: data.lojaId,
        lojaNm: data.lojaNome,
        endereco: data.endereco,
        dispositivoId: data.dispositivoId,
        tag: data.tag,
        motivo,
        tempAtual: data.tempAtual,
        requerTecnico,
      });

      toast.success(`Chamado ${chamado.id} aberto`, {
        description: "Use o QR do WhatsApp para notificar o responsável.",
      });
      onOpenChange(false);
      onAberto?.(chamado);
    } catch (e) {
      toast.error("Falha ao abrir chamado", { description: String(e) });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Abrir chamado</DialogTitle>
          <DialogDescription>
            {data ? `${data.lojaNome} · ${data.tag}` : ""}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Equipe</Label>
            <Input value={equipe} onChange={(e) => setEquipe(e.target.value)} />
          </div>
          <div>
            <Label>Motivo (IA)</Label>
            <Textarea value={motivo} onChange={(e) => setMotivo(e.target.value)} rows={3} />
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border/60 p-3">
            <div>
              <div className="text-sm font-medium">Requer técnico</div>
              <div className="text-xs text-muted-foreground">
                Marcar se o problema exige visita técnica
              </div>
            </div>
            <Switch checked={requerTecnico} onCheckedChange={setRequerTecnico} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={submit} disabled={loading}>
            {loading ? "Enviando..." : "Abrir chamado e gerar QR"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
