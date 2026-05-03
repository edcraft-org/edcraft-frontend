import { useCallback } from "react";
import type { NavigateFunction } from "react-router-dom";
import { toast } from "sonner";
import { ROUTES } from "@/router/paths";
import type { QuestionResponse } from "@/types/frontend.types";
import { getQuestion } from "@/features/questions/question.service";

export function useQuestionSourceNavigation(navigate: NavigateFunction) {
    return useCallback(
        async (question: QuestionResponse) => {
            if (!question.linked_from_question_id) {
                toast.error("This question is not linked to any source");
                return;
            }

            try {
                const source = await getQuestion(question.linked_from_question_id);
                if (source.assessment_id) {
                    navigate(ROUTES.ASSESSMENT(source.assessment_id));
                    return;
                }

                if (source.question_bank_id) {
                    navigate(ROUTES.QUESTION_BANK(source.question_bank_id));
                    return;
                }

                toast.error("Source question location not found");
            } catch {
                toast.error("Failed to navigate to source");
            }
        },
        [navigate],
    );
}
