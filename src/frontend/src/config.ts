// Environment detection
export const IS_LOCAL = window.location.hostname === "localhost" ||
  window.location.hostname.endsWith(".localhost");

// Canister IDs (populated by the build environment)
export const BACKEND_CANISTER_ID =
  (import.meta as unknown as { env: Record<string, string> }).env
    ?.VITE_BACKEND_CANISTER_ID ?? "";

export const IC_HOST = IS_LOCAL
  ? `http://localhost:4943`
  : `https://ic0.app`;
