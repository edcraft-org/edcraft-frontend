// Route path constants
export const ROUTES = {
  HOME: "/",
  FOLDER: (id: string) => `/folders/${id}`,
  FOLDER_ROOT: "/folders/root",
  QUESTION_BUILDER: "/question-builder",
  QUESTION_EDIT: (id: string) => `/questions/${id}/edit`,
  TEMPLATE_BUILDER: "/template-builder",
  TEMPLATE_EDIT: (id: string) => `/templates/${id}/edit`,
  ASSESSMENT: (id: string) => `/assessments/${id}`,
  ASSESSMENT_TEMPLATE: (id: string) => `/assessment-templates/${id}`,
  QUESTION_BANK: (id: string) => `/question-banks/${id}`,
  QUESTION_TEMPLATE_BANK: (id: string) => `/question-template-banks/${id}`,
  AUTH_CALLBACK: "/auth/callback",
} as const;
