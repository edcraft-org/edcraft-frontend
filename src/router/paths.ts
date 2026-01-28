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
} as const;
