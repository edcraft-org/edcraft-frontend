import { create } from "zustand";

interface FolderState {
    currentFolderId: string | null;
    expandedFolderIds: Set<string>;

    setCurrentFolderId: (folderId: string | null) => void;
    toggleFolderExpanded: (folderId: string) => void;
    setFolderExpanded: (folderId: string, expanded: boolean) => void;
    addExpandedFolders: (folderIds: string[]) => void;
    collapseAll: () => void;
    reset: () => void;
}

const initialState = {
    currentFolderId: null,
    expandedFolderIds: new Set<string>(),
};

export const useFolderStore = create<FolderState>()((set) => ({
    ...initialState,

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

    addExpandedFolders: (folderIds) =>
        set((state) => {
            const newExpanded = new Set(state.expandedFolderIds);
            folderIds.forEach((id) => newExpanded.add(id));
            return { expandedFolderIds: newExpanded };
        }),

    collapseAll: () => set({ expandedFolderIds: new Set<string>() }),

    reset: () => set(initialState),
}));
