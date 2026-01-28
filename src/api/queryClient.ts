import { QueryClient } from "@tanstack/react-query";
import { ApiError } from "@/api/axiosInstance";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
          return false;
        }
        // Retry 1 time for server errors (5xx) or network errors
        return failureCount < 1;
      },
    },
    mutations: {
      retry: false,
    },
  },
});
