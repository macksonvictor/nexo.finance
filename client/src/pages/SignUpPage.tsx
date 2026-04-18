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
      title="Crie sua conta e comece seu mês do jeito certo."
      description="Comece com seu mês atual, organize suas caixas com clareza e deixe o NEXO acompanhar sua evolução desde o início."
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
