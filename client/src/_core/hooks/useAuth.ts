import {
  useAuth as useClerkAuthState,
  useClerk,
  useUser as useClerkUser,
} from "@clerk/react";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { isRailwayPreviewWithoutClerk } from "@/lib/runtime";
import { useCallback, useEffect, useMemo, useState } from "react";

type UseAuthOptions = {
  redirectOnUnauthenticated?: boolean;
  redirectPath?: string;
};

export function useAuth(options?: UseAuthOptions) {
  const { redirectOnUnauthenticated = false, redirectPath = getLoginUrl() } =
    options ?? {};
  const previewWithoutClerk = isRailwayPreviewWithoutClerk();

  if (previewWithoutClerk) {
    const previewUser = { name: "Modo preview", email: null };

    if (typeof window !== "undefined") {
      localStorage.setItem("nexo-runtime-user-info", JSON.stringify(previewUser));
    }

    return {
      user: previewUser,
      loading: false,
      error: null,
      isAuthenticated: false,
      isGuestPreview: true,
      refresh: async () => null,
      logout: async () => null,
    };
  }

  const { isLoaded, isSignedIn } = useClerkAuthState();
  const { signOut } = useClerk();
  const { user: clerkUser } = useClerkUser();
  const utils = trpc.useUtils();
  const [guestPreviewEnabled, setGuestPreviewEnabled] = useState(false);

  const isRailwayPreviewHost =
    typeof window !== "undefined" &&
    /\.up\.railway\.app$/i.test(window.location.hostname);

  const meQuery = trpc.auth.me.useQuery(undefined, {
    enabled: isLoaded && isSignedIn && !guestPreviewEnabled,
    retry: false,
    refetchOnWindowFocus: false,
  });

  const logout = useCallback(async () => {
    try {
      utils.auth.me.setData(undefined, null);
      await signOut({ redirectUrl: "/" });
    } finally {
      await utils.auth.me.invalidate();
    }
  }, [signOut, utils]);

  const fallbackUser = useMemo(() => {
    if (!clerkUser) return null;

    const primaryEmail =
      clerkUser.primaryEmailAddress?.emailAddress ??
      clerkUser.emailAddresses?.[0]?.emailAddress ??
      null;

    return {
      name: clerkUser.fullName ?? clerkUser.username ?? primaryEmail,
      email: primaryEmail,
    };
  }, [clerkUser]);

  useEffect(() => {
    if (!isRailwayPreviewHost) return;
    if (isLoaded) {
      setGuestPreviewEnabled(false);
      return;
    }

    const timer = window.setTimeout(() => {
      setGuestPreviewEnabled(true);
    }, 2500);

    return () => window.clearTimeout(timer);
  }, [isLoaded, isRailwayPreviewHost]);

  const state = useMemo(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(
        "nexo-runtime-user-info",
        JSON.stringify(
          guestPreviewEnabled
            ? { name: "Modo preview", email: null }
            : meQuery.data ?? fallbackUser
        )
      );
    }

    return {
      user: guestPreviewEnabled
        ? { name: "Modo preview", email: null }
        : meQuery.data ?? fallbackUser,
      loading: guestPreviewEnabled
        ? false
        : !isLoaded || (Boolean(isSignedIn) && meQuery.isLoading),
      error: meQuery.error ?? null,
      isAuthenticated: guestPreviewEnabled ? false : Boolean(isSignedIn),
      isGuestPreview: guestPreviewEnabled,
    };
  }, [
    fallbackUser,
    guestPreviewEnabled,
    isLoaded,
    isSignedIn,
    meQuery.data,
    meQuery.error,
    meQuery.isLoading,
  ]);

  useEffect(() => {
    if (!redirectOnUnauthenticated) return;
    if (guestPreviewEnabled) return;
    if (!isLoaded) return;
    if (isSignedIn) return;
    if (typeof window === "undefined") return;
    if (window.location.pathname === redirectPath) return;

    window.location.href = redirectPath;
  }, [
    guestPreviewEnabled,
    redirectOnUnauthenticated,
    redirectPath,
    isLoaded,
    isSignedIn,
  ]);

  return {
    ...state,
    refresh: () => meQuery.refetch(),
    logout,
  };
}
