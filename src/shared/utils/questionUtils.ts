// Utility functions for working with question responses

import type { QuestionResponse } from "@/types/frontend.types";
import type {
    MCQData,
    MRQData,
    ShortAnswerData,
    Question,
    CreateMCQRequest,
    CreateMRQRequest,
    CreateShortAnswerRequest,
} from "@/api/models";

/**
 * Type guards for question responses
 */
export function isMCQResponse(
    question: QuestionResponse,
): question is Extract<QuestionResponse, { question_type: "mcq" }> {
    return question.question_type === "mcq";
}

export function isMRQResponse(
    question: QuestionResponse,
): question is Extract<QuestionResponse, { question_type: "mrq" }> {
    return question.question_type === "mrq";
}

export function isShortAnswerResponse(
    question: QuestionResponse,
): question is Extract<QuestionResponse, { question_type: "short_answer" }> {
    return question.question_type === "short_answer";
}

/**
 * Get question data from a question response
 */
export function getQuestionData(question: QuestionResponse): MCQData | MRQData | ShortAnswerData {
    if (isMCQResponse(question)) {
        return question.mcq_data;
    } else if (isMRQResponse(question)) {
        return question.mrq_data;
    } else {
        return question.short_answer_data;
    }
}

/**
 * Get options from MCQ or MRQ questions
 */
export function getOptions(question: QuestionResponse): string[] | undefined {
    if (isMCQResponse(question)) {
        return question.mcq_data.options;
    } else if (isMRQResponse(question)) {
        return question.mrq_data.options;
    }
    return undefined;
}

/**
 * Get correct indices from MCQ or MRQ questions
 * Note: MCQ returns array with single element for consistency
 */
export function getCorrectIndices(question: QuestionResponse): number[] | undefined {
    if (isMCQResponse(question)) {
        return [question.mcq_data.correct_index];
    } else if (isMRQResponse(question)) {
        return question.mrq_data.correct_indices;
    }
    return undefined;
}

/**
 * Get the answer text from any question type
 * For MCQ/MRQ: returns the correct option(s) as comma-separated string
 * For short answer: returns the correct answer string
 */
export function getAnswerText(question: QuestionResponse): string {
    if (isMCQResponse(question)) {
        const option = question.mcq_data.options[question.mcq_data.correct_index];
        return option || "";
    } else if (isMRQResponse(question)) {
        return question.mrq_data.correct_indices
            .map((idx) => question.mrq_data.options[idx])
            .filter(Boolean)
            .join(", ");
    } else {
        return question.short_answer_data.correct_answer;
    }
}

/**
 * Check if a question has options (MCQ or MRQ)
 */
export function hasOptions(question: QuestionResponse): boolean {
    return isMCQResponse(question) || isMRQResponse(question);
}

/**
 * Convert a QuestionResponse to a create/update request format
 * (strips out id, timestamps, owner_id, etc., converts response data to request data)
 */
export function questionResponseToRequestData(
    question: QuestionResponse,
):
    | { question_type: "mcq"; question_text: string; data: MCQData }
    | { question_type: "mrq"; question_text: string; data: MRQData }
    | { question_type: "short_answer"; question_text: string; data: ShortAnswerData } {
    if (isMCQResponse(question)) {
        return {
            question_type: "mcq" as const,
            question_text: question.question_text,
            data: question.mcq_data,
        };
    } else if (isMRQResponse(question)) {
        return {
            question_type: "mrq" as const,
            question_text: question.question_text,
            data: question.mrq_data,
        };
    } else {
        return {
            question_type: "short_answer" as const,
            question_text: question.question_text,
            data: question.short_answer_data,
        };
    }
}

/**
 * Helper function to safely convert unknown values to strings
 * Handles arrays, objects, numbers, etc.
 */
function unknownToString(value: unknown): string {
    if (typeof value === "string") return value;
    if (typeof value === "number") return String(value);
    if (typeof value === "object" && value !== null) {
        return JSON.stringify(value);
    }
    return String(value);
}

/**
 * Convert a generated Question (from question generation API) to a create request format
 * The Question model from generation has options as unknown[] which need to be converted to strings
 */
export function generatedQuestionToRequestData(
    question: Question,
    templateId?: string | null,
): (
    | Omit<CreateMCQRequest, "template_id">
    | Omit<CreateMRQRequest, "template_id">
    | Omit<CreateShortAnswerRequest, "template_id">
) & { template_id?: string | null } {
    // Convert unknown[] options to string[]
    const options = (question.options || []).map((opt) => unknownToString(opt));

    if (question.question_type === "mcq") {
        return {
            template_id: templateId,
            question_type: "mcq" as const,
            question_text: question.text,
            data: {
                options,
                correct_index: question.correct_indices?.[0] ?? 0,
            },
        };
    } else if (question.question_type === "mrq") {
        return {
            template_id: templateId,
            question_type: "mrq" as const,
            question_text: question.text,
            data: {
                options,
                correct_indices: question.correct_indices || [],
            },
        };
    } else {
        // short_answer
        return {
            template_id: templateId,
            question_type: "short_answer" as const,
            question_text: question.text,
            data: {
                correct_answer: unknownToString(question.answer || ""),
            },
        };
    }
}
