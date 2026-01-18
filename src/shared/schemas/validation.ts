import { z } from "zod";

// Folder validation schema
export const folderSchema = z.object({
  name: z
    .string()
    .min(1, "Folder name is required")
    .max(255, "Folder name must be less than 255 characters")
    .refine(
      (name) => !name.includes("/") && !name.includes("\\"),
      "Folder name cannot contain / or \\"
    ),
  description: z.string().max(1000, "Description must be less than 1000 characters").optional(),
});

// Assessment validation schema
export const assessmentSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(255, "Title must be less than 255 characters"),
  description: z.string().max(2000, "Description must be less than 2000 characters").optional(),
});

// Question type enum
export const questionTypeSchema = z.enum(["mcq", "mrq", "short_answer"]);

// MCQ/MRQ additional data
export const mcqAdditionalDataSchema = z.object({
  options: z
    .array(z.string().min(1, "Option cannot be empty"))
    .min(2, "At least 2 options are required")
    .max(10, "Maximum 10 options allowed"),
  correct_indices: z
    .array(z.number().int().min(0))
    .min(1, "At least one correct answer is required"),
  answer: z.string(),
});

// Short answer additional data
export const shortAnswerAdditionalDataSchema = z.object({
  answer: z.string().min(1, "Answer is required"),
});

// Question validation schema
export const questionSchema = z.object({
  question_type: questionTypeSchema,
  question_text: z
    .string()
    .min(1, "Question text is required")
    .max(5000, "Question text must be less than 5000 characters"),
  additional_data: z.union([mcqAdditionalDataSchema, shortAnswerAdditionalDataSchema]),
});

// Validate that correct_indices are valid for the options array
export const validateQuestionData = (data: z.infer<typeof questionSchema>) => {
  if (data.question_type === "mcq" || data.question_type === "mrq") {
    const additionalData = data.additional_data as z.infer<typeof mcqAdditionalDataSchema>;
    const maxIndex = additionalData.options.length - 1;

    for (const index of additionalData.correct_indices) {
      if (index > maxIndex) {
        return {
          valid: false,
          error: `Correct index ${index} is out of bounds (max: ${maxIndex})`,
        };
      }
    }

    // MCQ should have exactly one correct answer
    if (data.question_type === "mcq" && additionalData.correct_indices.length !== 1) {
      return {
        valid: false,
        error: "MCQ must have exactly one correct answer",
      };
    }
  }

  return { valid: true, error: null };
};

// Template input data validation (JSON object)
export const templateInputDataSchema = z.record(z.string(), z.unknown()).refine(
  (data) => {
    // Ensure it's a valid object
    return typeof data === "object" && data !== null;
  },
  { message: "Input data must be a valid JSON object" }
);

// Assessment template validation
export const assessmentTemplateSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(255, "Title must be less than 255 characters"),
  description: z.string().max(2000, "Description must be less than 2000 characters").optional(),
});

// Instantiate assessment validation
export const instantiateAssessmentSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(255, "Title must be less than 255 characters"),
  description: z.string().max(2000, "Description must be less than 2000 characters").optional(),
  folder_id: z.string().uuid().nullable(),
  template_inputs: z.array(
    z.object({
      template_id: z.string().uuid(),
      input_data: templateInputDataSchema,
    })
  ),
});

// Export types inferred from schemas
export type FolderFormData = z.infer<typeof folderSchema>;
export type AssessmentFormData = z.infer<typeof assessmentSchema>;
export type QuestionFormData = z.infer<typeof questionSchema>;
export type AssessmentTemplateFormData = z.infer<typeof assessmentTemplateSchema>;
export type InstantiateAssessmentFormData = z.infer<typeof instantiateAssessmentSchema>;
