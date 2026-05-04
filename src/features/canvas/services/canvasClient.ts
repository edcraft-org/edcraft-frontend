import axios from "axios";

const PROXY_URL =
  window.__CONFIG__?.CORS_PROXY_URL ??
  import.meta.env.VITE_CANVAS_PROXY_URL ??
  "http://localhost:8080";

export function createCanvasClient(baseUrl: string, accessToken: string) {
    return axios.create({
        baseURL: PROXY_URL,
        headers: {
            Authorization: `Bearer ${accessToken}`,
            "X-Host": baseUrl,
            "Content-Type": "application/json",
        },
        timeout: 30000,
    });
}
