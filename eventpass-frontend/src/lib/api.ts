const accessToken = {
  value: null as string | null,
  set(token: string | null) {
    this.value = token;
  },
  get() {
    return this.value;
  },
};

export const tokenStore = accessToken;

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

export class ApiClientError extends Error {
  status: number;
  code?: string;
  details?: unknown[];
  constructor(message: string, status: number, code?: string, details?: unknown[]) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

let refreshPromise: Promise<boolean> | null = null;

async function attemptRefresh(): Promise<boolean> {
  try {
    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      credentials: "include",
    });
    if (!res.ok) return false;
    const body = await res.json();
    const token = body?.data?.token as string | undefined;
    if (!token) return false;
    accessToken.set(token);
    return true;
  } catch {
    return false;
  }
}

function refresh(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = attemptRefresh().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
  skipAuth?: boolean;
  signal?: AbortSignal;
}

async function rawFetch(path: string, options: RequestOptions): Promise<Response> {
  const headers: Record<string, string> = { ...options.headers };
  if (options.body !== undefined && !(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }
  const token = accessToken.get();
  if (token && !options.skipAuth) headers["Authorization"] = `Bearer ${token}`;

  return fetch(`${API_URL}${path}`, {
    method: options.method ?? "GET",
    headers,
    credentials: "include",
    body:
      options.body instanceof FormData
        ? options.body
        : options.body !== undefined
          ? JSON.stringify(options.body)
          : undefined,
    signal: options.signal,
  });
}

async function parseError(res: Response): Promise<ApiClientError> {
  let message = res.statusText;
  let code: string | undefined;
  let details: unknown[] | undefined;
  try {
    const body = await res.json();
    message = body?.error?.message ?? body?.message ?? message;
    code = body?.error?.code;
    details = body?.error?.details;
  } catch {
    // ignore
  }
  return new ApiClientError(message, res.status, code, details);
}

/** Core request helper. Unwraps the { success, data, meta? } envelope. */
export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<{ data: T; meta?: import("./types").PaginationMeta }> {
  let res = await rawFetch(path, options);

  if (res.status === 401 && !options.skipAuth && !path.startsWith("/auth/login") && !path.startsWith("/auth/register")) {
    const ok = await refresh();
    if (ok) {
      res = await rawFetch(path, options);
    }
  }

  if (!res.ok) throw await parseError(res);

  const body = await res.json();
  return { data: body?.data as T, meta: body?.meta };
}

/** Downloads a binary payload (CSV/XLSX/ZIP/PNG) with the auth header attached. */
export async function downloadFile(path: string, fallbackFilename: string): Promise<void> {
  const token = accessToken.get();
  const res = await fetch(`${API_URL}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    credentials: "include",
  });
  if (res.status === 401 && token) {
    const ok = await refresh();
    if (!ok) throw new ApiClientError("Session expired.", 401);
    return downloadFile(path, fallbackFilename);
  }
  if (!res.ok) throw await parseError(res);

  const blob = await res.blob();
  const disposition = res.headers.get("content-disposition") ?? "";
  const match = disposition.match(/filename="?([^";]+)"?/i);
  const filename = match?.[1] ?? fallbackFilename;

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** Opens a URL that requires a token in the query string for image/static downloads. */
export function imageUrl(path: string): string {
  const token = accessToken.get();
  const sep = path.includes("?") ? "&" : "?";
  return token ? `${API_URL}${path}${sep}token=${encodeURIComponent(token)}` : `${API_URL}${path}`;
}
