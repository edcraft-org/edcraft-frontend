import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { UserResponse } from "@/api/models";

interface UserState {
    user: UserResponse | null;
    rootFolderId: string | null;
    isLoading: boolean;
    error: string | null;
    hasHydrated: boolean;
    isAuthChecked: boolean;

    setUser: (user: UserResponse | null) => void;
    setRootFolderId: (folderId: string | null) => void;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
    setHasHydrated: (hydrated: boolean) => void;
    setIsAuthChecked: (checked: boolean) => void;
    clearError: () => void;
    logout: () => void;
}

const initialState = {
    user: null,
    rootFolderId: null,
    isLoading: false,
    error: null,
    hasHydrated: false,
    isAuthChecked: false,
};

export const useUserStore = create<UserState>()(
    persist(
        (set) => ({
            ...initialState,

            setUser: (user) => set({ user, error: null }),
            setRootFolderId: (rootFolderId) => set({ rootFolderId }),
            setLoading: (isLoading) => set({ isLoading }),
            setError: (error) => set({ error, isLoading: false }),
            setHasHydrated: (hasHydrated) => set({ hasHydrated }),
            setIsAuthChecked: (isAuthChecked) => set({ isAuthChecked }),
            clearError: () => set({ error: null }),

            logout: () =>
                set({
                    user: null,
                    error: null,
                    isLoading: false,
                    isAuthChecked: true,
                }),
        }),
        {
            name: "edcraft-user-storage",
            version: 1,

            partialize: (state) => ({
                rootFolderId: state.rootFolderId,
            }),

            onRehydrateStorage: () => (state, error) => {
                if (error) {
                    console.error("Failed to rehydrate user store:", error);
                }
                state?.setHasHydrated(true);
            },
        },
    ),
);
