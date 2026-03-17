import { useCanvasStore } from "@/shared/stores/canvas.store";
import { isMCQResponse, isMRQResponse, isShortAnswerResponse } from "@/shared/utils/questionUtils";
import type { QuestionResponse } from "@/types/frontend.types";
import { createCanvasClient } from "./canvasClient";
import type { CanvasCourse, CanvasQuiz, CanvasQuizQuestion } from "./types";

function getClient() {
    const { canvasBaseUrl, canvasAccessToken } = useCanvasStore.getState();
    if (!canvasBaseUrl || !canvasAccessToken) {
        throw new Error("Canvas credentials not configured. Please set them in Settings.");
    }
    return createCanvasClient(canvasBaseUrl, canvasAccessToken);
}

const COURSES_PER_PAGE = 10;
const QUIZZES_PER_PAGE = 10;

export async function getCourses(
    page: number | null,
): Promise<{ data: CanvasCourse[]; nextPage: number | null }> {
    const currentPage = page ?? 1;
    const client = getClient();
    const res = await client.get<CanvasCourse[]>("/api/v1/courses", {
        params: { enrollment_type: "teacher", per_page: COURSES_PER_PAGE, page: currentPage },
    });
    return {
        data: res.data,
        nextPage: res.data.length === COURSES_PER_PAGE ? currentPage + 1 : null,
    };
}

export async function getQuizzes(
    courseId: number,
    page: number | null,
): Promise<{ data: CanvasQuiz[]; nextPage: number | null }> {
    const currentPage = page ?? 1;
    const client = getClient();
    const res = await client.get<CanvasQuiz[]>(`/api/v1/courses/${courseId}/quizzes`, {
        params: { per_page: QUIZZES_PER_PAGE, page: currentPage },
    });
    return {
        data: res.data,
        nextPage: res.data.length === QUIZZES_PER_PAGE ? currentPage + 1 : null,
    };
}

export async function createQuiz(courseId: number, title: string): Promise<CanvasQuiz> {
    const client = getClient();
    const res = await client.post<CanvasQuiz>(`/api/v1/courses/${courseId}/quizzes`, {
        quiz: { title, quiz_type: "assignment" },
    });
    return res.data;
}

export async function addQuestionToQuiz(
    courseId: number,
    quizId: number,
    question: CanvasQuizQuestion,
): Promise<void> {
    const client = getClient();
    await client.post(`/api/v1/courses/${courseId}/quizzes/${quizId}/questions`, { question });
}

export function mapQuestionToCanvas(question: QuestionResponse, index: number): CanvasQuizQuestion {
    const base = {
        question_name: `Question ${index + 1}`,
        question_text: question.question_text
            .split("\n\n")
            .map((para) => `<p>${para.replace(/\n/g, "<br>")}</p>`)
            .join(""),
        points_possible: 1,
    };

    const correct_answer_weight = 100;
    const incorrect_answer_weight = 0;

    if (isMCQResponse(question)) {
        return {
            ...base,
            question_type: "multiple_choice_question",
            answers: question.mcq_data.options.map((opt, i) => ({
                answer_text: opt,
                answer_weight:
                    i === question.mcq_data.correct_index
                        ? correct_answer_weight
                        : incorrect_answer_weight,
            })),
        };
    }

    if (isMRQResponse(question)) {
        return {
            ...base,
            question_type: "multiple_answers_question",
            answers: question.mrq_data.options.map((opt, i) => ({
                answer_text: opt,
                answer_weight: question.mrq_data.correct_indices.includes(i)
                    ? correct_answer_weight
                    : incorrect_answer_weight,
            })),
        };
    }

    if (isShortAnswerResponse(question)) {
        return {
            ...base,
            question_type: "short_answer_question",
            answers: [
                {
                    answer_text: question.short_answer_data.correct_answer,
                    answer_weight: correct_answer_weight,
                },
            ],
        };
    }

    return {
        ...base,
        question_type: "short_answer_question",
    };
}
