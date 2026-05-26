import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";

const SYSTEM = `Você é o assistente do Freezer Controle, um sistema de monitoramento de refrigeração em supermercados.
Ajude o operador a interpretar alertas críticos, sugerir ações de manutenção e priorizar visitas técnicas.

Conhecimento de domínio:
- Freezer/congelados: -22°C a -18°C
- Câmara de congelados: -25°C a -20°C
- Geladeira/refrigerados: 2°C a 8°C
- Açougue: 0°C a 4°C
- Padaria fria: 4°C a 10°C
- Ilha de bebidas: 4°C a 7°C

Causas comuns de temperatura alta: compressor falhando, baixa carga de gás, vedação da porta, degelo prolongado, evaporadora bloqueada, sensor descalibrado, sobrecarga térmica.

Responda em português, de forma direta, com bullets curtos quando útil.`;

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json()) as { messages?: UIMessage[] };
        if (!Array.isArray(body.messages)) {
          return new Response("Messages are required", { status: 400 });
        }
        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        const gateway = createLovableAiGatewayProvider(key);
        const result = streamText({
          model: gateway("google/gemini-3-flash-preview"),
          system: SYSTEM,
          messages: await convertToModelMessages(body.messages),
        });
        return result.toUIMessageStreamResponse({ originalMessages: body.messages });
      },
    },
  },
});
