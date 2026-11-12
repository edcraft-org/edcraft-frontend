import type { AuthoringQuestionPayload, CodeQuestionInstance } from "../types";

export interface PreviewChoice {
    value: unknown;
    reason?: string;
    correct: boolean;
}

export interface PreviewQuestionFields {
    text: string;
    questionType: string;
    answer: unknown;
    choices: PreviewChoice[];
    correctIndex: number;
    seed: number;
}

export function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** A payload is only treated as code when it has the code question envelope. */
export function isCodeQuestionPayload(
    value: AuthoringQuestionPayload,
): value is CodeQuestionInstance {
    if (!isRecord(value)) return false;
    const question = value.question;
    return (
        isRecord(question) &&
        typeof question.code === "string" &&
        typeof question.question === "string"
    );
}

/**
 * Normalizes the question text, choices and answer for the shared
 * QuestionContent renderer. Unknown domains only need this small envelope;
 * their domain-specific fields stay in the raw data disclosure.
 */
export function buildQuestionFields(payload: AuthoringQuestionPayload): PreviewQuestionFields {
    const record = isRecord(payload) ? payload : {};
    const question = isRecord(record.question) ? record.question : {};
    const distractors = Array.isArray(question.distractors) ? question.distractors : [];
    const distractorReasons = Array.isArray(question.distractor_reasons)
        ? question.distractor_reasons
        : [];
    const seed = typeof record.seed === "number" ? record.seed : 0;
    // Keep the correct choice deterministic but not always first. This is
    // presentation only; the exported instance keeps the canonical answer.
    const correctIndex = distractors.length > 0 ? seed % (distractors.length + 1) : 0;
    const choices: PreviewChoice[] = distractors.map((value, index) => ({
        value,
        reason:
            typeof distractorReasons[index] === "string"
                ? distractorReasons[index]
                : undefined,
        correct: false,
    }));
    choices.splice(correctIndex, 0, {
        value: question.proposed_answer,
        correct: true,
    });

    return {
        text: typeof question.question === "string" ? question.question : "Question",
        questionType:
            typeof question.question_type === "string" ? question.question_type : "mcq",
        answer: question.proposed_answer,
        choices,
        correctIndex,
        seed,
    };
}
