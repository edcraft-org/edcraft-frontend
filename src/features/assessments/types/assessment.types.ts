// Assessment-related types

import type { BaseEntity } from "@/shared/types/common.types";
import type { OrderedQuestion } from "@/features/questions/types/question.types";

export interface Assessment extends BaseEntity {
  owner_id: string;
  folder_id: string | null;
  title: string;
  description: string;
}

export interface AssessmentWithQuestions extends Assessment {
  questions: OrderedQuestion[];
}

// Request types
export interface CreateAssessmentRequest {
  owner_id: string;
  folder_id: string;
  title: string;
  description?: string;
}

export interface UpdateAssessmentRequest {
  title?: string;
  description?: string;
  folder_id?: string | null;
}
