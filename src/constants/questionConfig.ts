/**
 * Constants for question generation configuration
 */

// Output Types
export const OutputType = {
  List: "list",
  Count: "count",
  First: "first",
  Last: "last",
} as const;

export type OutputType = typeof OutputType[keyof typeof OutputType];

// Question Types
export const QuestionType = {
  MCQ: "mcq",
  MRQ: "mrq",
  ShortAnswer: "short_answer",
} as const;

export type QuestionType = typeof QuestionType[keyof typeof QuestionType];

// Form Element Types
export const FormElementType = {
  OutputTypeSelector: "output_type_selector",
  QuestionTypeSelector: "question_type_selector",
} as const;
