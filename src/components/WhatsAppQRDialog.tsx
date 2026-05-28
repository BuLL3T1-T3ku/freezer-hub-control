import { useEffect, useState } from "react";
import QRCode from "qrcode";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MessageCircle, ExternalLink } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  contaId: number;
  contaNm: string;
  lojaNm: string;
  endereco: string;
  alarmeDesc: string;
  dispositivoNm: string;
  // Telefone do responsável (com ou sem máscara); se vier inválido cai num número padrão.
  telefoneContato?: string;
  tempAtual?: number;
}

function formatPhone(t?: string) {
  if (!t) return "5541998996206";
  const d = t.replace(/\D/g, "");
  if (d.length < 10) return "5541998996206";
  // adiciona 55 se não tiver
  return d.startsWith("55") ? d : `55${d}`;
}

export function WhatsAppQRDialog({
  open,
  onOpenChange,
  contaId,
  contaNm,
  lojaNm,
  endereco,
  alarmeDesc,
  dispositivoNm,
  telefoneContato,
  tempAtual,
}: Props) {
  const [qr, setQr] = useState<string>("");

  const fone = formatPhone(telefoneContato);
  const msg =
    `🚨 *Alerta crítico — Freezer Controle*\n` +
    `Empresa: ${contaNm} (ID ${contaId})\n` +
    `Loja: ${lojaNm}\n` +
    `Endereço: ${endereco}\n` +
    `Equipamento: ${dispositivoNm}\n` +
    (tempAtual !== undefined ? `Temperatura: *${tempAtual}°C*\n` : "") +
    `Problema: ${alarmeDesc}\n\n` +
    `Favor verificar e responder com previsão de atendimento.`;

  const url = `https://wa.me/${fone}?text=${encodeURIComponent(msg)}`;

  useEffect(() => {
    if (!open) return;
    QRCode.toDataURL(url, { width: 256, margin: 1 }).then(setQr).catch(() => setQr(""));
  }, [open, url]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-[oklch(0.65_0.16_150)]" />
            Enviar alerta por WhatsApp
          </DialogTitle>
          <DialogDescription>
            Escaneie o QR com o celular para abrir a conversa já preenchida.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid place-items-center rounded-lg bg-white p-4">
            {qr ? (
              <img src={qr} alt="QR WhatsApp" className="h-56 w-56" />
            ) : (
              <div className="grid h-56 w-56 place-items-center text-xs text-muted-foreground">
                Gerando QR...
              </div>
            )}
          </div>
          <div className="rounded-md border border-border/60 bg-muted/40 p-3 text-xs">
            <div><span className="font-semibold">Para:</span> {fone}</div>
            <div className="mt-1"><span className="font-semibold">Loja:</span> {lojaNm}</div>
            <div><span className="font-semibold">Empresa:</span> {contaNm} (ID {contaId})</div>
          </div>
          <Button asChild className="w-full">
            <a href={url} target="_blank" rel="noreferrer">
              <ExternalLink className="mr-2 h-4 w-4" />
              Abrir WhatsApp Web
            </a>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
