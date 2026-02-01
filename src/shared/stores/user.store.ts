import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { UserResponse } from "@/api/models";

interface UserState {
    user: UserResponse | null;
    rootFolderId: string | null;
    isLoading: boolean;
    error: string | null;
    hasHydrated: boolean;

    // Actions
    setUser: (user: UserResponse | null) => void;
    setRootFolderId: (folderId: string | null) => void;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
    setHasHydrated: (hydrated: boolean) => void;
    clearError: () => void;
    reset: () => void;
}

const initialState = {
    user: null,
    rootFolderId: null,
    isLoading: false,
    error: null,
    hasHydrated: false,
};

export const useUserStore = create<UserState>()(
    persist(
        (set) => ({
            ...initialState,

            // Actions
            setUser: (user) => set({ user, error: null }),

            setRootFolderId: (folderId) => set({ rootFolderId: folderId }),

            setLoading: (isLoading) => set({ isLoading }),

            setError: (error) => set({ error, isLoading: false }),

            setHasHydrated: (hasHydrated) => set({ hasHydrated }),

            clearError: () => set({ error: null }),

            reset: () => set(initialState),
        }),
        {
            name: "edcraft-user-storage",
            version: 1,
            storage: createJSONStorage(() => localStorage),

            partialize: (state) => ({
                user: state.user ? { id: state.user.id } : null,
                rootFolderId: state.rootFolderId,
            }),

            onRehydrateStorage: () => (state, error) => {
                if (error) {
                    console.error("Failed to rehydrate user store:", error);
                    localStorage.removeItem("edcraft-user-storage");
                }
                state?.setHasHydrated(true);
            },
        },
    ),
);
