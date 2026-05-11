import { motion } from 'framer-motion';
import Lottie from 'lottie-react';
import { useLocation } from 'wouter';
import error404Animation from '@/assets/lottie/error-404.json';

export default function NotFound() {
  const [, setLocation] = useLocation();

  return (
    <div className="flex min-h-screen items-center justify-center overflow-hidden bg-background px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-2xl text-center"
      >
        <div className="pointer-events-none absolute inset-x-8 top-8 h-40 rounded-full bg-foreground/10 blur-3xl" />
        <div className="relative mx-auto mb-2 h-72 w-full max-w-md sm:h-80">
          <Lottie
            animationData={error404Animation}
            loop
            autoplay
            className="h-full w-full"
            rendererSettings={{
              preserveAspectRatio: 'xMidYMid meet',
            }}
          />
        </div>

        <div className="relative mx-auto max-w-xl rounded-[32px] border border-border bg-card/80 p-7 shadow-2xl shadow-black/20 backdrop-blur">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.35em] text-muted-foreground">
            Erro 404
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Essa rota saiu do mapa.
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted-foreground">
            A página que você tentou abrir não existe ou foi movida. Vamos voltar
            para o painel e retomar seu mês com segurança.
          </p>
        </div>

        <button
          onClick={() => setLocation('/')}
          className="relative mt-6 rounded-2xl bg-foreground px-6 py-3 font-medium text-background transition-colors hover:bg-foreground/90"
        >
          Voltar ao Dashboard
        </button>
      </motion.div>
    </div>
  );
}
