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
import { MessageCircle, ExternalLink, Copy, Check } from "lucide-react";

const GRUPO_WHATSAPP_URL = "https://chat.whatsapp.com/GTaXxObr72Z6rhDhTC1BNN";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  contaId: number;
  contaNm: string;
  lojaNm: string;
  endereco: string;
  alarmeDesc: string;
  dispositivoNm: string;
  tempAtual?: number;
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
  tempAtual,
}: Props) {
  const [qr, setQr] = useState<string>("");
  const [copied, setCopied] = useState(false);

  const msg =
    `🚨 *Alerta crítico — Freezer Controle*\n` +
    `Empresa: ${contaNm} (ID ${contaId})\n` +
    `Loja: ${lojaNm}\n` +
    `Endereço: ${endereco}\n` +
    `Equipamento: ${dispositivoNm}\n` +
    (tempAtual !== undefined ? `Temperatura: *${tempAtual}°C*\n` : "") +
    `Problema: ${alarmeDesc}\n\n` +
    `Favor verificar e responder com previsão de atendimento.`;

  useEffect(() => {
    if (!open) return;
    QRCode.toDataURL(GRUPO_WHATSAPP_URL, { width: 256, margin: 1 }).then(setQr).catch(() => setQr(""));
  }, [open]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(msg);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-[oklch(0.65_0.16_150)]" />
            Enviar alerta para o grupo
          </DialogTitle>
          <DialogDescription>
            Escaneie o QR para entrar no grupo e cole a mensagem pronta.
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
            <div><span className="font-semibold">Grupo:</span> Alertas Freezer Controle</div>
            <div className="mt-1"><span className="font-semibold">Loja:</span> {lojaNm}</div>
            <div><span className="font-semibold">Empresa:</span> {contaNm} (ID {contaId})</div>
          </div>
          <div className="rounded-md border border-border/60 bg-muted/30 p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">Mensagem pronta</span>
              <Button size="sm" variant="ghost" className="h-7 gap-1 text-xs" onClick={handleCopy}>
                {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                {copied ? "Copiado" : "Copiar"}
              </Button>
            </div>
            <pre className="max-h-32 overflow-auto whitespace-pre-wrap break-words rounded bg-card p-2 text-[11px] text-muted-foreground">
              {msg}
            </pre>
          </div>
          <Button asChild className="w-full">
            <a href={GRUPO_WHATSAPP_URL} target="_blank" rel="noreferrer">
              <ExternalLink className="mr-2 h-4 w-4" />
              Abrir grupo do WhatsApp
            </a>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
