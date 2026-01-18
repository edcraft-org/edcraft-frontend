import { QueryClient } from "@tanstack/react-query";

// Create a query client with sensible defaults
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data is considered fresh for 30 seconds
      staleTime: 30 * 1000,
      // Keep unused data in cache for 5 minutes
      gcTime: 5 * 60 * 1000,
      // Retry failed requests up to 2 times
      retry: 2,
      // Don't refetch on window focus by default
      refetchOnWindowFocus: false,
    },
    mutations: {
      // Retry mutations once on failure
      retry: 1,
    },
  },
});

// Query key factories for consistent cache keys
export const queryKeys = {
  // User queries
  users: {
    all: ["users"] as const,
    detail: (id: string) => ["users", id] as const,
  },

  // Folder queries
  folders: {
    all: (ownerId: string) => ["folders", ownerId] as const,
    detail: (id: string) => ["folders", "detail", id] as const,
    contents: (id: string) => ["folders", "contents", id] as const,
    tree: (id: string) => ["folders", "tree", id] as const,
    path: (id: string) => ["folders", "path", id] as const,
  },

  // Assessment queries
  assessments: {
    all: (ownerId: string) => ["assessments", ownerId] as const,
    byFolder: (ownerId: string, folderId: string | null) =>
      ["assessments", ownerId, folderId] as const,
    detail: (id: string) => ["assessments", "detail", id] as const,
  },

  // Question queries
  questions: {
    all: (ownerId: string) => ["questions", ownerId] as const,
    detail: (id: string) => ["questions", "detail", id] as const,
    assessments: (id: string) => ["questions", id, "assessments"] as const,
  },

  // Assessment template queries
  assessmentTemplates: {
    all: (ownerId: string) => ["assessment-templates", ownerId] as const,
    byFolder: (ownerId: string, folderId: string | null) =>
      ["assessment-templates", ownerId, folderId] as const,
    detail: (id: string) => ["assessment-templates", "detail", id] as const,
  },

  // Question template queries
  questionTemplates: {
    all: (ownerId: string) => ["question-templates", ownerId] as const,
    detail: (id: string) => ["question-templates", "detail", id] as const,
    assessmentTemplates: (id: string) =>
      ["question-templates", id, "assessment-templates"] as const,
  },
};
