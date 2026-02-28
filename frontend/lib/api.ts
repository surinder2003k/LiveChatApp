import { env } from "@/lib/env";

export async function apiFetch<T>(
  path: string,
  opts: Omit<RequestInit, "body"> & { body?: any; token?: string | null } = {}
): Promise<T> {
  const url = `${env.backendUrl}${path}`;
  const headers = new Headers(opts.headers);
  headers.set("Content-Type", "application/json");
  if (opts.token) headers.set("Authorization", `Bearer ${opts.token}`);

  const body =
    opts.body && typeof opts.body === "object" && !(opts.body instanceof FormData) && !(opts.body instanceof Blob)
      ? JSON.stringify(opts.body)
      : opts.body;

  const res = await fetch(url, { ...opts, headers, body });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    const message = data?.message || `Request failed (${res.status})`;
    throw new Error(message);
  }
  return data as T;
}

