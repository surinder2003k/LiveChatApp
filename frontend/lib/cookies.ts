"use client";

export function setTokenCookie(token: string) {
  // NOTE: Non-httpOnly cookie for simple demo/SPA auth. For production, prefer httpOnly set by a Next route handler.
  document.cookie = `token=${encodeURIComponent(token)}; path=/; max-age=${60 * 60 * 24 * 7}; samesite=lax`;
}

export function clearTokenCookie() {
  document.cookie = "token=; path=/; max-age=0; samesite=lax";
}

export function getTokenFromCookie(): string | null {
  const match = document.cookie.match(/(?:^|;\s*)token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

