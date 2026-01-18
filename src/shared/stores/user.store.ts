import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "@/shared/types/common.types";

interface UserState {
  // Current user
  user: User | null;
  // Root folder ID for the current user
  rootFolderId: string | null;
  // Loading state
  isLoading: boolean;
  // Error state
  error: string | null;
  // Hydration state - true after Zustand has loaded from localStorage
  hasHydrated: boolean;

  // Actions
  setUser: (user: User | null) => void;
  setRootFolderId: (folderId: string | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setHasHydrated: (hydrated: boolean) => void;
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

      setUser: (user) => set({ user, error: null }),

      setRootFolderId: (folderId) => set({ rootFolderId: folderId }),

      setLoading: (isLoading) => set({ isLoading }),

      setError: (error) => set({ error, isLoading: false }),

      setHasHydrated: (hasHydrated) => set({ hasHydrated }),

      reset: () => set(initialState),
    }),
    {
      name: "edcraft-user-storage",
      // Persist user ID and root folder ID to localStorage
      partialize: (state) => ({
        user: state.user ? { id: state.user.id } : null,
        rootFolderId: state.rootFolderId,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
