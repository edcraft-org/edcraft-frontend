export const queryKeys = {
  // User queries
  users: {
    all: ["users"] as const,
    me: ["users", "me"] as const,
    detail: (id: string) => ["users", id] as const,
  },

  // Folder queries
  folders: {
    all: (ownerId: string) => ["folders", ownerId] as const,
    byFolder: (parentId: string) =>
      ["folders", parentId] as const,
    root: (ownerId: string) => ["folders", ownerId, "root"] as const,
    detail: (id: string) => ["folder", id] as const,
    contents: (id: string) => ["folder", id, "contents"] as const,
    tree: (id: string) => ["folder", id, "tree"] as const,
    path: (id: string) => ["folder", id, "path"] as const,
  },

  // Assessment queries
  assessments: {
    all: (ownerId: string) => ["assessments", ownerId] as const,
    byFolder: (ownerId: string, folderId: string) =>
      ["assessments", ownerId, folderId] as const,
    detail: (id: string) => ["assessments", "detail", id] as const,
    allDetails: () => ["assessments", "detail"] as const,
  },

  // Question queries
  questions: {
    all: (ownerId: string) => ["questions", ownerId] as const,
    detail: (id: string) => ["questions", "detail", id] as const,
    usage: (id: string) => ["questions", id, "usage"] as const,
  },

  // Question bank queries
  questionBanks: {
    all: (ownerId: string) => ["question-banks", ownerId] as const,
    byFolder: (ownerId: string, folderId: string) =>
      ["question-banks", ownerId, folderId] as const,
    detail: (id: string) => ["question-banks", "detail", id] as const,
    allDetails: () => ["question-banks", "detail"] as const,
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
