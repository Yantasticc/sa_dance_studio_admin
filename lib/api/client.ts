import { apiRequest } from "../api";

export const apiClient = {
  get: <T = any>(endpoint: string, params?: any) =>
    apiRequest<T>(endpoint, { method: "GET", params }),
  post: <T = any>(endpoint: string, body?: any) =>
    apiRequest<T>(endpoint, { method: "POST", body: JSON.stringify(body) }),
  put: <T = any>(endpoint: string, body?: any) =>
    apiRequest<T>(endpoint, { method: "PUT", body: JSON.stringify(body) }),
  patch: <T = any>(endpoint: string, body?: any) =>
    apiRequest<T>(endpoint, { method: "PATCH", body: JSON.stringify(body) }),
  delete: <T = any>(endpoint: string) =>
    apiRequest<T>(endpoint, { method: "DELETE" }),
};
