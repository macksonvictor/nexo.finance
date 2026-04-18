import { BRAND_NAME } from "@/lib/branding";
import { BrandLogo } from "./BrandLogo";
import { EntryShell } from "./EntryShell";

export function AuthLoadingScreen() {
  return (
    <EntryShell
      eyebrow="Acesso"
      title="Seu mês está quase pronto."
      description="Estamos validando sua sessão e preparando o NEXO para você voltar com o contexto certo."
      panelClassName="min-h-[420px] flex items-center"
    >
      <div className="w-full">
        <BrandLogo alt={BRAND_NAME} className="mx-auto h-16 w-16" />

        <div className="mt-4 text-center">
          <p className="text-sm font-medium leading-none text-[#D8D8D8]">
            {BRAND_NAME}
          </p>
          <p className="text-xs font-medium uppercase tracking-[0.3em] text-[#6F6F6F]">
            quase lá
          </p>
          <h2 className="mt-2 text-[28px] font-semibold tracking-tight text-[#F5F5F5]">
            Abrindo o NEXO
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[#8C8C8C]">
            Estamos conectando sua conta, seu mês atual e a Nexo IA para você
            continuar com clareza.
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
