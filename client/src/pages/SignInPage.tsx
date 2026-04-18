import { SignIn, useAuth } from "@clerk/react";
import { useEffect } from "react";
import { useLocation } from "wouter";
import { EntryShell } from "@/components/EntryShell";

export default function SignInPage() {
  const { isLoaded, isSignedIn } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      setLocation("/");
    }
  }, [isLoaded, isSignedIn, setLocation]);

  return (
    <EntryShell
      eyebrow="Entrar"
      title="Entre no NEXO e retome seu mês com clareza."
      description="Suas caixas, metas, histórico e a Nexo IA ficam prontos assim que você voltar para a sua conta."
      panelClassName="min-h-[420px] flex items-center"
    >
      <div className="w-full space-y-4">
        <div className="flex items-center justify-between text-xs uppercase tracking-[0.22em] text-[#6F6F6F]">
          <span>sua conta</span>
          <a
            href="/"
            className="tracking-[0.12em] text-[#9A9A9A] transition-colors hover:text-[#F5F5F5]"
          >
            voltar
          </a>
        </div>
        <SignIn
          routing="path"
          path="/sign-in"
          signUpUrl="/sign-up"
          fallbackRedirectUrl="/"
        />
      </div>
    </EntryShell>
  );
}
