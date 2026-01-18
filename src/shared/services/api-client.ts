// Base API client with error handling and request cancellation

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

// Custom error class for API errors
export class ApiError extends Error {
  status: number;
  detail: string;
  errorType?: string;

  constructor(status: number, detail: string, errorType?: string) {
    super(detail);
    this.name = "ApiError";
    this.status = status;
    this.detail = detail;
    this.errorType = errorType;
  }
}

// Request options with abort controller support
interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  signal?: AbortSignal;
}

// Generic request function with typed response
async function request<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { body, signal, ...init } = options;

  const config: RequestInit = {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init.headers,
    },
    signal,
  };

  if (body !== undefined) {
    config.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

  // Handle 204 No Content
  if (response.status === 204) {
    return undefined as T;
  }

  // Try to parse JSON response
  let data: unknown;
  try {
    data = await response.json();
  } catch {
    // If JSON parsing fails and response is not OK, throw generic error
    if (!response.ok) {
      throw new ApiError(response.status, response.statusText);
    }
    return undefined as T;
  }

  // Handle error responses
  if (!response.ok) {
    const errorData = data as { detail?: string; error_type?: string };
    throw new ApiError(
      response.status,
      errorData.detail || response.statusText,
      errorData.error_type
    );
  }

  return data as T;
}

// HTTP method helpers
export const apiClient = {
  get<T>(endpoint: string, signal?: AbortSignal): Promise<T> {
    return request<T>(endpoint, { method: "GET", signal });
  },

  post<T>(endpoint: string, body?: unknown, signal?: AbortSignal): Promise<T> {
    return request<T>(endpoint, { method: "POST", body, signal });
  },

  patch<T>(endpoint: string, body?: unknown, signal?: AbortSignal): Promise<T> {
    return request<T>(endpoint, { method: "PATCH", body, signal });
  },

  delete<T>(endpoint: string, signal?: AbortSignal): Promise<T> {
    return request<T>(endpoint, { method: "DELETE", signal });
  },
};

// Helper to create abort controller with cleanup
export function createAbortController(): {
  controller: AbortController;
  cleanup: () => void;
} {
  const controller = new AbortController();
  return {
    controller,
    cleanup: () => controller.abort(),
  };
}
