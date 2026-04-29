import { BRAND_NAME } from "@/lib/branding";
import { BrandLogo } from "./BrandLogo";
import { EntryShell } from "./EntryShell";

export function AuthLoadingScreen() {
  return (
    <EntryShell
      eyebrow="Acesso"
      title="Seu NEXO está quase pronto."
      description="Estamos validando sua sessão e trazendo seu mês com caixas, metas e IA no contexto certo."
      panelClassName="min-h-[420px] flex items-center"
    >
      <div className="w-full">
        <div className="mx-auto flex w-fit items-center gap-3 rounded-3xl border border-[#262626] bg-[#171717]/70 px-4 py-3">
          <BrandLogo alt={BRAND_NAME} className="h-11 w-11" />
          <div className="text-left">
            <p className="text-sm font-semibold leading-none text-[#E8E8E8]">
              {BRAND_NAME}
            </p>
            <p className="mt-1.5 text-[10px] font-medium uppercase tracking-[0.28em] text-[#777]">
              Quase lá
            </p>
          </div>
        </div>

        <div className="mt-7 text-center">
          <h2 className="text-[28px] font-semibold tracking-tight text-[#F5F5F5]">
            Preparando seu NEXO
          </h2>
          <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-[#8C8C8C]">
            Conta, mês atual e Nexo IA estão sendo sincronizados para você
            continuar sem perder contexto.
          </p>
        </div>

        <div className="mt-10 space-y-3">
          <div className="skeleton h-12 rounded-2xl" />
          <div className="skeleton h-24 rounded-[24px]" />
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="skeleton h-24 rounded-[24px]" />
            <div className="skeleton h-24 rounded-[24px]" />
          </div>
        </div>
      </div>
    </EntryShell>
  );
}
