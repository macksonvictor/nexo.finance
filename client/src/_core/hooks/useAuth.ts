import {
  useAuth as useClerkAuthState,
  useClerk,
  useUser as useClerkUser,
} from "@clerk/react";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { useCallback, useEffect, useMemo } from "react";

type UseAuthOptions = {
  redirectOnUnauthenticated?: boolean;
  redirectPath?: string;
};

export function useAuth(options?: UseAuthOptions) {
  const { redirectOnUnauthenticated = false, redirectPath = getLoginUrl() } =
    options ?? {};
  const { isLoaded, isSignedIn } = useClerkAuthState();
  const { signOut } = useClerk();
  const { user: clerkUser } = useClerkUser();
  const utils = trpc.useUtils();

  const meQuery = trpc.auth.me.useQuery(undefined, {
    enabled: isLoaded && isSignedIn,
    retry: false,
    refetchOnWindowFocus: false,
  });

  const logout = useCallback(async (redirectUrl = "/") => {
    try {
      if (typeof window !== "undefined") {
        window.localStorage.removeItem("nexo-runtime-user-info");
      }
      utils.auth.me.setData(undefined, null);
      await signOut({ redirectUrl });
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
      openId: clerkUser.id,
      name: clerkUser.fullName ?? clerkUser.username ?? primaryEmail,
      email: primaryEmail,
    };
  }, [clerkUser]);

  const resolvedUser = useMemo(() => {
    const queryUser = meQuery.data;

    if (!queryUser) {
      return fallbackUser;
    }

    if (clerkUser?.id && queryUser.openId !== clerkUser.id) {
      return fallbackUser;
    }

    return queryUser;
  }, [clerkUser?.id, fallbackUser, meQuery.data]);

  const state = useMemo(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(
        "nexo-runtime-user-info",
        JSON.stringify(resolvedUser)
      );
    }

    return {
      user: resolvedUser,
      loading: !isLoaded || (Boolean(isSignedIn) && meQuery.isLoading),
      error: meQuery.error ?? null,
      isAuthenticated: Boolean(isSignedIn),
    };
  }, [isLoaded, isSignedIn, meQuery.error, meQuery.isLoading, resolvedUser]);

  useEffect(() => {
    if (!redirectOnUnauthenticated) return;
    if (!isLoaded) return;
    if (isSignedIn) return;
    if (typeof window === "undefined") return;
    if (window.location.pathname === redirectPath) return;

    window.location.href = redirectPath;
  }, [redirectOnUnauthenticated, redirectPath, isLoaded, isSignedIn]);

  return {
    ...state,
    refresh: () => meQuery.refetch(),
    logout,
  };
}
