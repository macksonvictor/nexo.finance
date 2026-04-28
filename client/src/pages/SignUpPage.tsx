import { SignUp, useAuth } from "@clerk/react";
import { useEffect } from "react";
import { useLocation } from "wouter";
import { EntryShell } from "@/components/EntryShell";

export default function SignUpPage() {
  const { isLoaded, isSignedIn } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      setLocation("/");
    }
  }, [isLoaded, isSignedIn, setLocation]);

  return (
    <EntryShell
      eyebrow="Criar conta"
      title="Comece seu controle financeiro com clareza."
      description="Crie sua conta, defina a receita do mês e deixe o NEXO organizar caixas, metas e decisões em um só lugar."
      panelClassName="min-h-[420px] flex items-center"
    >
      <div className="w-full space-y-4">
        <div className="flex items-center justify-between text-xs uppercase tracking-[0.22em] text-[#6F6F6F]">
          <span>primeiro acesso</span>
          <a
            href="/"
            className="tracking-[0.12em] text-[#9A9A9A] transition-colors hover:text-[#F5F5F5]"
          >
            voltar
          </a>
        </div>
        <SignUp
          routing="path"
          path="/sign-up"
          signInUrl="/sign-in"
          fallbackRedirectUrl="/"
        />
      </div>
    </EntryShell>
  );
}
