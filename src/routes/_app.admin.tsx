import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Building2, Plus, Trash2, Store } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { type CustomEmpresa, loadCustom, saveCustom } from "@/api's/custom-empresas";

export const Route = createFileRoute("/_app/admin")({
  component: AdminPage,
  head: () => ({
    meta: [{ title: "Freezer Controle — Admin" }],
  }),
});

const emptyLoja = () => ({
  lojaId: Math.floor(Math.random() * 90000) + 10000,
  lojaNm: "",
  tpContratoNm: "Monitoramento | Turno 30",
  nrPedido: "",
  telefone: "",
  endereco: "",
  cnpj: "",
  dtValContrato: new Date(Date.now() + 365 * 86400000).toISOString(),
});

function AdminPage() {
  const [list, setList] = useState<CustomEmpresa[]>(() => loadCustom());
  const [form, setForm] = useState<CustomEmpresa>({
    contaId: Math.floor(Math.random() * 9000) + 1000,
    contaNm: "",
    lojas: [emptyLoja()],
  });

  function persist(next: CustomEmpresa[]) {
    setList(next);
    saveCustom(next);
  }

  function addEmpresa() {
    if (!form.contaNm.trim()) {
      toast.error("Informe o nome da empresa");
      return;
    }
    const lojasValidas = form.lojas.filter((l) => l.lojaNm.trim());
    if (lojasValidas.length === 0) {
      toast.error("Adicione ao menos uma loja com nome");
      return;
    }
    persist([...list, { ...form, lojas: lojasValidas }]);
    setForm({
      contaId: Math.floor(Math.random() * 9000) + 1000,
      contaNm: "",
      lojas: [emptyLoja()],
    });
    toast.success("Empresa adicionada com sucesso");
  }

  function removeEmpresa(contaId: number) {
    persist(list.filter((e) => e.contaId !== contaId));
    toast.success("Empresa removida");
  }

  function updateLoja(i: number, patch: Partial<CustomEmpresa["lojas"][number]>) {
    const lojas = form.lojas.map((l, idx) => (idx === i ? { ...l, ...patch } : l));
    setForm({ ...form, lojas });
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Administração</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Cadastre novas empresas e lojas para serem monitoradas no dashboard.
        </p>
      </div>

      <Card className="p-6">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <Building2 className="h-5 w-5 text-primary" />
          Nova empresa
        </h2>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="contaNm">Nome da empresa *</Label>
            <Input
              id="contaNm"
              value={form.contaNm}
              onChange={(e) => setForm({ ...form, contaNm: e.target.value })}
              placeholder="Ex: Supermercados Bela Vista"
            />
          </div>
          <div>
            <Label htmlFor="contaId">ID da conta</Label>
            <Input
              id="contaId"
              type="number"
              value={form.contaId}
              onChange={(e) => setForm({ ...form, contaId: Number(e.target.value) })}
            />
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <Store className="h-4 w-4 text-primary" />
              Lojas
            </h3>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setForm({ ...form, lojas: [...form.lojas, emptyLoja()] })}
            >
              <Plus className="mr-1 h-4 w-4" />
              Loja
            </Button>
          </div>

          {form.lojas.map((l, i) => (
            <div key={i} className="rounded-lg border border-border/60 bg-muted/30 p-4">
              <div className="grid gap-3 md:grid-cols-2">
                <Field label="Nome da loja *" value={l.lojaNm} onChange={(v) => updateLoja(i, { lojaNm: v })} />
                <Field label="Tipo de contrato" value={l.tpContratoNm} onChange={(v) => updateLoja(i, { tpContratoNm: v })} />
                <Field label="Nº pedido" value={l.nrPedido} onChange={(v) => updateLoja(i, { nrPedido: v })} />
                <Field label="Telefone" value={l.telefone} onChange={(v) => updateLoja(i, { telefone: v })} />
                <Field label="CNPJ" value={l.cnpj} onChange={(v) => updateLoja(i, { cnpj: v })} />
                <Field label="Endereço" value={l.endereco} onChange={(v) => updateLoja(i, { endereco: v })} />
              </div>
              {form.lojas.length > 1 && (
                <div className="mt-3 flex justify-end">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      setForm({ ...form, lojas: form.lojas.filter((_, idx) => idx !== i) })
                    }
                  >
                    <Trash2 className="mr-1 h-4 w-4" />
                    Remover loja
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>

        <Button onClick={addEmpresa} className="mt-6">
          <Plus className="mr-2 h-4 w-4" />
          Adicionar empresa
        </Button>
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-semibold">Empresas cadastradas localmente</h2>
        {list.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            Nenhuma empresa personalizada ainda. As empresas vindas da API aparecem no
            dashboard automaticamente.
          </p>
        ) : (
          <div className="mt-4 divide-y divide-border/60">
            {list.map((e) => (
              <div key={e.contaId} className="flex items-center justify-between gap-4 py-3">
                <div>
                  <div className="font-medium">{e.contaNm}</div>
                  <div className="text-xs text-muted-foreground">
                    ID {e.contaId} · {e.lojas.length} loja{e.lojas.length !== 1 ? "s" : ""}
                  </div>
                </div>
                <Button size="sm" variant="ghost" onClick={() => removeEmpresa(e.contaId)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <Label className="text-xs">{label}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
