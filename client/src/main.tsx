import { ClerkProvider } from "@clerk/react";
import { trpc } from "@/lib/trpc";
import { UNAUTHED_ERR_MSG } from '@shared/const';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, TRPCClientError } from "@trpc/client";
import { createRoot } from "react-dom/client";
import superjson from "superjson";
import App from "./App";
import { getLoginUrl } from "./const";
import { hasClerkPublishableKey, isRailwayPreviewWithoutClerk } from "./lib/runtime";
import "./index.css";

const queryClient = new QueryClient();
const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const analyticsEndpoint = import.meta.env.VITE_ANALYTICS_ENDPOINT;
const analyticsWebsiteId = import.meta.env.VITE_ANALYTICS_WEBSITE_ID;
const previewWithoutClerk = isRailwayPreviewWithoutClerk();
const canUseClerk = hasClerkPublishableKey();

if (analyticsEndpoint && analyticsWebsiteId && typeof document !== "undefined") {
  const analyticsScript = document.createElement("script");
  analyticsScript.defer = true;
  analyticsScript.src = `${analyticsEndpoint.replace(/\/$/, "")}/umami`;
  analyticsScript.dataset.websiteId = analyticsWebsiteId;
  document.head.appendChild(analyticsScript);
}

const redirectToLoginIfUnauthorized = (error: unknown) => {
  if (!(error instanceof TRPCClientError)) return;
  if (typeof window === "undefined") return;

  const isUnauthorized = error.message === UNAUTHED_ERR_MSG;

  if (!isUnauthorized) return;

  window.location.href = getLoginUrl();
};

queryClient.getQueryCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.query.state.error;
    redirectToLoginIfUnauthorized(error);
    console.error("[API Query Error]", error);
  }
});

queryClient.getMutationCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.mutation.state.error;
    redirectToLoginIfUnauthorized(error);
    console.error("[API Mutation Error]", error);
  }
});

const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: "/api/trpc",
      transformer: superjson,
      fetch(input, init) {
        return globalThis.fetch(input, {
          ...(init ?? {}),
          credentials: "include",
        });
      },
    }),
  ],
});

const appTree = (
  <trpc.Provider client={trpcClient} queryClient={queryClient}>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </trpc.Provider>
);

const root = createRoot(document.getElementById("root")!);

if (!canUseClerk && !previewWithoutClerk) {
  root.render(
    <div className="flex min-h-screen items-center justify-center bg-[#0D0D0D] px-6 text-[#F5F5F5]">
      <div className="max-w-md rounded-3xl border border-[#2E2E2E] bg-[#141414] p-8 text-center shadow-[0_30px_80px_rgba(0,0,0,0.45)]">
        <h1 className="text-2xl font-semibold tracking-tight">
          Configuração incompleta
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-[#BFBFBF]">
          A chave <code>VITE_CLERK_PUBLISHABLE_KEY</code> não foi encontrada
          neste ambiente. No link público do Railway, o NEXO entra em modo
          preview automaticamente; fora dele, essa chave precisa existir para o
          login funcionar.
        </p>
      </div>
    </div>
  );
} else if (previewWithoutClerk) {
  root.render(appTree);
} else {
  root.render(
    <ClerkProvider publishableKey={clerkPublishableKey}>
      {appTree}
    </ClerkProvider>
  );
}
