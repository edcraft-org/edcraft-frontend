import { create } from "zustand";

interface FolderState {
  // Current folder ID (from URL)
  currentFolderId: string | null;
  // Set of expanded folder IDs in the tree
  expandedFolderIds: Set<string>;

  // Actions
  setCurrentFolderId: (folderId: string | null) => void;
  toggleFolderExpanded: (folderId: string) => void;
  setFolderExpanded: (folderId: string, expanded: boolean) => void;
  expandToFolder: (folderIds: string[]) => void;
  collapseAll: () => void;
}

export const useFolderStore = create<FolderState>()((set) => ({
  currentFolderId: null,
  expandedFolderIds: new Set<string>(),

  setCurrentFolderId: (folderId) => set({ currentFolderId: folderId }),

  toggleFolderExpanded: (folderId) =>
    set((state) => {
      const newExpanded = new Set(state.expandedFolderIds);
      if (newExpanded.has(folderId)) {
        newExpanded.delete(folderId);
      } else {
        newExpanded.add(folderId);
      }
      return { expandedFolderIds: newExpanded };
    }),

  setFolderExpanded: (folderId, expanded) =>
    set((state) => {
      const newExpanded = new Set(state.expandedFolderIds);
      if (expanded) {
        newExpanded.add(folderId);
      } else {
        newExpanded.delete(folderId);
      }
      return { expandedFolderIds: newExpanded };
    }),

  // Expand all folders in the path to a specific folder
  expandToFolder: (folderIds) =>
    set((state) => {
      const newExpanded = new Set(state.expandedFolderIds);
      folderIds.forEach((id) => newExpanded.add(id));
      return { expandedFolderIds: newExpanded };
    }),

  collapseAll: () => set({ expandedFolderIds: new Set<string>() }),
}));
