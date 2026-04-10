export function hasClerkPublishableKey() {
  return Boolean(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY);
}

export function isRailwayPublicHost() {
  if (typeof window === "undefined") return false;
  return /\.up\.railway\.app$/i.test(window.location.hostname);
}

export function isRailwayPreviewWithoutClerk() {
  return isRailwayPublicHost() && !hasClerkPublishableKey();
}
