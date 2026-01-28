import axios, { AxiosError, type AxiosRequestConfig, type AxiosResponse } from 'axios';
import { toast } from 'sonner';

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

const instance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8000",
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Response interceptor for error handling
instance.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response) {
      const data = error.response.data as { detail?: string; error_type?: string };
      const apiError = new ApiError(
        error.response.status,
        data?.detail || error.message,
        data?.error_type
      );

      // Show user-friendly toast for specific errors
      if (apiError.status >= 500) {
        toast.error('Server error. Please try again later.');
      } else if (apiError.status === 404) {
        toast.error(apiError.detail || 'Resource not found');
      } else if (apiError.status === 403) {
        toast.error('You do not have permission to perform this action');
      } else if (apiError.status === 400) {
        toast.error(apiError.detail || 'Invalid request');
      }

      // Log errors in development
      if (import.meta.env.DEV) {
        console.error('API Error:', {
          status: apiError.status,
          detail: apiError.detail,
          type: apiError.errorType,
          url: error.config?.url,
        });
      }

      throw apiError;
    }

    // Network error (no response received)
    if (error.request) {
      toast.error('Network error. Please check your connection.');
      const networkError = new ApiError(
        0,
        'Network error. Please check your connection.',
        'network_error'
      );

      if (import.meta.env.DEV) {
        console.error('Network Error:', error.message);
      }

      throw networkError;
    }

    // Request setup error
    if (import.meta.env.DEV) {
      console.error('Request Error:', error.message);
    }
    throw error;
  }
);

// Mutator function for orval
export const axiosInstance = <T>(
  config: AxiosRequestConfig
): Promise<AxiosResponse<T>> => {
  return instance.request<T>(config);
};
