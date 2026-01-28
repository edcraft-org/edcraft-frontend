import { getEdCraftBackendAPI } from './edcraftClient';

// Export singleton instance of API client
export const api = getEdCraftBackendAPI();

// Re-export core API utilities
export { ApiError } from './axiosInstance';
