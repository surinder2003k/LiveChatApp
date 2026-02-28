import { env } from "@/lib/env";

export async function apiFetch<T>(
  path: string,
  opts: Omit<RequestInit, "body"> & { body?: any; token?: string | null } = {}
): Promise<T> {
  const url = `${env.backendUrl}${path}`;
  const headers = new Headers(opts.headers);

  if (opts.token) {
    headers.set("Authorization", `Bearer ${opts.token}`);
  }

  const isFormData = opts.body instanceof FormData;
  const isBlob = opts.body instanceof Blob;

  // IMPORTANT: For FormData, we must NOT set Content-Type
  // The browser will automatically set it with the correct boundary.
  if (!isFormData && !isBlob) {
    headers.set("Content-Type", "application/json");
  }

  const body =
    opts.body && typeof opts.body === "object" && !isFormData && !isBlob
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
