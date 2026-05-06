import type { ReactNode } from "react";
import {
  Brain,
  Scale,
  Sparkles,
  Target,
  type LucideIcon,
} from "lucide-react";
import { BRAND_AI_NAME } from "@/lib/branding";
import { cn } from "@/lib/utils";

interface EntryShellProps {
  eyebrow?: string;
  title: string;
  description: string;
  children: ReactNode;
  panelClassName?: string;
}

const FEATURE_ITEMS: Array<{
  icon: LucideIcon;
  title: string;
  description: string;
}> = [
  {
    icon: Scale,
    title: "Base zero com clareza",
    description: "Distribua sua receita com intenção desde o primeiro minuto.",
  },
  {
    icon: Target,
    title: "Metas e histórico real",
    description: "Entenda o mês atual e acompanhe sua evolução sem ruído.",
  },
  {
    icon: Brain,
    title: BRAND_AI_NAME,
    description: "Converse com contexto do mês, metas, caixas e decisões futuras.",
  },
];

export function EntryShell({
  eyebrow,
  title,
  description,
  children,
  panelClassName,
}: EntryShellProps) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#050505] text-[#F5F5F5]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(112,255,61,0.08),transparent_34%),radial-gradient(circle_at_75%_15%,rgba(255,255,255,0.06),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.02),transparent_30%)]" />
        <div className="absolute left-[-12%] top-[12%] h-72 w-72 rounded-full bg-[#2E5F17]/10 blur-[120px]" />
        <div className="absolute bottom-[-14%] right-[-10%] h-80 w-80 rounded-full bg-white/[0.03] blur-[150px]" />
      </div>

      <div className="relative grid min-h-screen lg:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.9fr)]">
        <section className="flex items-center px-6 py-10 sm:px-8 lg:px-14 xl:px-20">
          <div className="mx-auto w-full max-w-[980px]">
            {eyebrow ? (
              <div className="inline-flex items-center gap-2 rounded-full border border-[#232323] bg-[#101010]/80 px-4 py-2 text-[11px] font-medium uppercase tracking-[0.24em] text-[#8A8A8A]">
                <Sparkles size={14} className="text-[#D8D8D8]" />
                {eyebrow}
              </div>
            ) : null}

            <div className={cn("space-y-6", eyebrow ? "mt-9" : "mt-3")}>
              <div className="max-w-3xl">
                <h1 className="text-4xl font-semibold tracking-tight text-[#FAFAF7] sm:text-5xl sm:leading-none lg:text-[58px] lg:leading-[0.96]">
                  {title}
                </h1>

                <p className="mt-5 text-lg text-[#D8D8D8] sm:text-[1.75rem]">
                  Todo real recebe uma missão.
                </p>

                <p className="mt-5 text-base leading-7 text-[#A3A3A3] sm:text-lg">
                  {description}
                </p>
              </div>
            </div>

            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {FEATURE_ITEMS.map(({ icon: Icon, title: featureTitle, description: featureDescription }) => (
                <div
                  key={featureTitle}
                  className="rounded-[24px] border border-[#1F1F1F] bg-[#101010]/72 p-5 shadow-[0_18px_50px_rgba(0,0,0,0.35)]"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[#242424] bg-[#151515]">
                    <Icon size={18} className="text-[#EAEAEA]" />
                  </div>
                  <p className="mt-4 text-sm font-semibold text-[#F5F5F5]">
                    {featureTitle}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[#8E8E8E]">
                    {featureDescription}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="flex items-center px-6 pb-10 sm:px-8 lg:px-10 lg:py-10">
          <div className="mx-auto w-full max-w-lg rounded-[32px] border border-[#232323] bg-[#111111]/88 p-4 shadow-[0_30px_90px_rgba(0,0,0,0.5)] backdrop-blur-xl sm:p-6">
            <div
              className={cn(
                "rounded-[26px] border border-[#1D1D1D] bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.01))] p-5 sm:p-6",
                panelClassName
              )}
            >
              {children}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
