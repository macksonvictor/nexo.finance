import { useAuth } from "@/_core/hooks/useAuth";
import { useTheme, type Theme } from "@/contexts/ThemeContext";
import { lottieAnimations } from "@/lib/lottieAnimations";
import { LogOut, Moon, Settings, Sun } from "lucide-react";
import { toast } from "sonner";
import { AnimatedLottieIcon } from "./AnimatedLottieIcon";

const THEME_OPTIONS: Array<{
  id: Theme;
  title: string;
  description: string;
  icon: typeof Moon;
}> = [
  {
    id: "dark",
    title: "Escuro",
    description: "Experiência principal do NEXO, com foco e contraste alto.",
    icon: Moon,
  },
  {
    id: "light",
    title: "Claro",
    description: "Uma versão mais leve para usar o app em ambientes iluminados.",
    icon: Sun,
  },
];

export function ConfiguracoesView() {
  const { theme, setTheme } = useTheme();
  const { logout } = useAuth();

  const handleLogout = () => {
    toast.success("Sessão encerrada com sucesso");
    void logout();
  };

  return (
    <div className="space-y-8">
      <section className="rounded-[32px] border border-border bg-card p-6 shadow-[0_18px_60px_rgba(0,0,0,0.22)]">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-border bg-secondary text-foreground">
            <AnimatedLottieIcon
              animationData={lottieAnimations.settings}
              size={20}
              fallback={<Settings size={20} />}
            />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Configurações
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
              Aparência do aplicativo
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Escolha o visual do NEXO. A IA acompanha automaticamente para manter a
              experiência consistente.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-2">
          {THEME_OPTIONS.map((option) => {
            const Icon = option.icon;
            const active = theme === option.id;

            return (
              <button
                key={option.id}
                type="button"
                onClick={() => setTheme?.(option.id)}
                className={`rounded-[24px] border p-4 text-left transition-all ${
                  active
                    ? "border-foreground bg-foreground text-background shadow-[0_18px_44px_rgba(0,0,0,0.22)]"
                    : "border-border bg-secondary/60 text-foreground hover:border-ring"
                }`}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span
                      className={`flex h-10 w-10 items-center justify-center rounded-2xl border ${
                        active
                          ? "border-background/20 bg-background/10"
                          : "border-border bg-card"
                      }`}
                    >
                      <Icon size={18} />
                    </span>
                    <div>
                      <p className="font-semibold">{option.title}</p>
                      <p
                        className={`mt-1 text-xs leading-relaxed ${
                          active ? "text-background/70" : "text-muted-foreground"
                        }`}
                      >
                        {option.description}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`h-3 w-3 rounded-full ${
                      active ? "bg-background" : "bg-muted-foreground/40"
                    }`}
                  />
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <section className="rounded-[32px] border border-border bg-card p-6 shadow-[0_18px_60px_rgba(0,0,0,0.18)]">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Conta
            </p>
            <h2 className="mt-2 text-xl font-semibold tracking-tight text-foreground">
              Sessão e acesso
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
              Saia da conta atual apenas quando quiser trocar de usuário ou encerrar
              esta sessão no dispositivo.
            </p>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-border bg-secondary px-4 py-3 text-sm font-semibold text-foreground transition-colors hover:border-[#8B2500]/45 hover:bg-[#8B2500]/10 hover:text-[#FF9A75]"
          >
            <LogOut size={17} />
            Sair da conta
          </button>
        </div>
      </section>
    </div>
  );
}
