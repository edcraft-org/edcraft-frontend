import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/api/queryKeys";
import type { QuestionResponse } from "@/types/frontend.types";
import {
    addQuestionToQuiz,
    createQuiz,
    getCourses,
    getQuizzes,
    mapQuestionToCanvas,
} from "./canvas.service";
import type { CanvasExportTarget } from "./types";

export function useCanvasCourses(enabled: boolean) {
    return useInfiniteQuery({
        queryKey: queryKeys.canvas.courses(),
        queryFn: ({ pageParam }) => getCourses(pageParam),
        initialPageParam: null as number | null,
        getNextPageParam: (lastPage) => lastPage.nextPage,
        enabled,
        staleTime: 5 * 60 * 1000,
    });
}

export function useCanvasQuizzes(courseId: number | null) {
    return useInfiniteQuery({
        queryKey: queryKeys.canvas.quizzes(courseId!),
        queryFn: ({ pageParam }) => getQuizzes(courseId!, pageParam),
        initialPageParam: null as number | null,
        getNextPageParam: (lastPage) => lastPage.nextPage,
        enabled: courseId !== null,
    });
}

export function useUploadToCanvas() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            questions,
            target,
        }: {
            questions: QuestionResponse[];
            target: CanvasExportTarget;
        }) => {
            let quizId: number;
            if (target.mode === "new") {
                const quiz = await createQuiz(target.courseId, target.quizTitle);
                quizId = quiz.id;
            } else {
                quizId = target.quizId;
            }
            for (let i = 0; i < questions.length; i++) {
                await addQuestionToQuiz(
                    target.courseId,
                    quizId,
                    mapQuestionToCanvas(questions[i], i),
                );
            }
            return { quizId, courseId: target.courseId };
        },
        onSuccess: ({ courseId }) => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.canvas.quizzes(courseId),
            });
        },
    });
}
