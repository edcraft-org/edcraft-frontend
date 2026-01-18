// Assessment Template-related types

import type { BaseEntity } from "@/shared/types/common.types";
import type { OrderedQuestionTemplate } from "@/features/templates/types/template.types";

export interface AssessmentTemplate extends BaseEntity {
  owner_id: string;
  folder_id: string | null;
  title: string;
  description: string | null;
}

export interface AssessmentTemplateWithTemplates extends AssessmentTemplate {
  question_templates: OrderedQuestionTemplate[];
}

// Request types
export interface CreateAssessmentTemplateRequest {
  owner_id: string;
  folder_id?: string | null;
  title: string;
  description?: string;
}

export interface UpdateAssessmentTemplateRequest {
  title?: string;
  description?: string;
  folder_id?: string | null;
}

// For adding question template to assessment template
export interface AddQuestionTemplateRequest {
  question_template: {
    owner_id: string;
    question_type: string;
    question_text: string;
    description?: string;
    template_config: Record<string, unknown>;
  };
  order?: number;
}

export interface LinkQuestionTemplateRequest {
  question_template_id: string;
  order?: number;
}

export interface ReorderQuestionTemplatesRequest {
  question_template_orders: Array<{
    question_template_id: string;
    order: number;
  }>;
}

// For instantiating assessment from template
export interface TemplateInputData {
  template_id: string;
  input_data: Record<string, unknown>;
}

export interface InstantiateAssessmentRequest {
  folder_id: string | null;
  title: string;
  description?: string;
  template_inputs: TemplateInputData[];
}
