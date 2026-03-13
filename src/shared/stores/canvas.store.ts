import { create } from "zustand";
import { persist } from "zustand/middleware";

interface CanvasState {
    canvasBaseUrl: string;
    canvasAccessToken: string;
    setCredentials: (baseUrl: string, token: string) => void;
    clearCredentials: () => void;
}

export const useCanvasStore = create<CanvasState>()(
    persist(
        (set) => ({
            canvasBaseUrl: "",
            canvasAccessToken: "",

            setCredentials: (canvasBaseUrl, canvasAccessToken) =>
                set({ canvasBaseUrl, canvasAccessToken }),

            clearCredentials: () => set({ canvasBaseUrl: "", canvasAccessToken: "" }),
        }),
        {
            name: "edcraft-canvas-storage",
        },
    ),
);
