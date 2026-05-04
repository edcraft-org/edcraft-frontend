export interface CanvasCourse {
    id: number;
    name: string;
    course_code: string;
}

export interface CanvasQuiz {
    id: number;
    title: string;
    quiz_type: string;
    published: boolean;
}

export interface CanvasAnswer {
    answer_text: string;
    answer_weight: number;
}

export interface CanvasQuizQuestion {
    question_name: string;
    question_text: string;
    question_type:
        | "multiple_choice_question"
        | "multiple_answers_question"
        | "short_answer_question";
    points_possible: number;
    answers?: CanvasAnswer[];
}

export type CanvasExportTarget =
    | { mode: "existing"; courseId: number; courseName: string; quizId: number; quizTitle: string }
    | { mode: "new"; courseId: number; courseName: string; quizTitle: string };
