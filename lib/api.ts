const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

interface FetchOptions extends RequestInit {
  params?: Record<string, string | number | undefined>;
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<{ success: boolean; message: string; data?: T; error?: { code: string; details: any } }> {
  const token = typeof window !== "undefined" ? localStorage.getItem("sa_admin_token") : null;

  const headers = new Headers(options.headers || {});
  headers.set("Content-Type", "application/json");
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  let url = `${API_BASE}${endpoint}`;

  if (options.params) {
    const queryParams = new URLSearchParams();
    Object.entries(options.params).forEach(([key, val]) => {
      if (val !== undefined && val !== null) {
        queryParams.append(key, String(val));
      }
    });
    const queryString = queryParams.toString();
    if (queryString) {
      url += `?${queryString}`;
    }
  }

  try {
    const res = await fetch(url, {
      ...options,
      headers,
    });

    const body = await res.json();
    return body;
  } catch (error: any) {
    console.error("apiRequest error:", error);
    return {
      success: false,
      message: error.message || "Failed to make network request.",
      error: {
        code: "NETWORK_ERROR",
        details: error,
      },
    };
  }
}
