import { Link, Outlet, createFileRoute, useRouterState } from "@tanstack/react-router";
import { Snowflake, LayoutDashboard, Settings } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import { Chatbot } from "@/components/Chatbot";

export const Route = createFileRoute("/_app")({
  component: AppLayout,
});

function AppLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const nav = [
    { to: "/", label: "Dashboard", icon: LayoutDashboard },
    { to: "/admin", label: "Admin", icon: Settings },
  ];
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link to="/" className="flex items-center gap-3">
            <div
              className="grid h-10 w-10 place-items-center rounded-xl text-primary-foreground shadow-lg shadow-primary/20"
              style={{ background: "var(--gradient-frost)" }}
            >
              <Snowflake className="h-5 w-5" />
            </div>
            <div className="leading-tight">
              <div className="text-base font-bold tracking-tight">Freezer Controle</div>
              <div className="text-xs text-muted-foreground">Monitoramento de refrigeração</div>
            </div>
          </Link>
          <nav className="flex items-center gap-1">
            {nav.map((n) => {
              const active = pathname === n.to;
              const Icon = n.icon;
              return (
                <Link
                  key={n.to}
                  to={n.to}
                  className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${
                    active
                      ? "bg-primary text-primary-foreground shadow shadow-primary/25"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {n.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-6 py-8">
        <Outlet />
      </main>
      <Toaster richColors position="top-right" />
      <Chatbot />
    </div>
  );
}
