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

  // Actions
  setUser: (user: User | null) => void;
  setRootFolderId: (folderId: string | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const initialState = {
  user: null,
  rootFolderId: null,
  isLoading: false,
  error: null,
};

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      ...initialState,

      setUser: (user) => set({ user, error: null }),

      setRootFolderId: (folderId) => set({ rootFolderId: folderId }),

      setLoading: (isLoading) => set({ isLoading }),

      setError: (error) => set({ error, isLoading: false }),

      reset: () => set(initialState),
    }),
    {
      name: "edcraft-user-storage",
      // Only persist user ID to localStorage
      partialize: (state) => ({
        user: state.user ? { id: state.user.id } : null,
      }),
    }
  )
);
