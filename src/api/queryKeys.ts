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
    byFolder: (ownerId: string, folderId: string) =>
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
    byFolder: (ownerId: string, folderId: string) =>
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
