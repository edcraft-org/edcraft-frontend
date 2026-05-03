import { useCallback } from "react";
import type { NavigateFunction } from "react-router-dom";
import { toast } from "sonner";
import { ROUTES } from "@/router/paths";
import type { QuestionTemplateResponse } from "@/api/models";
import { getQuestionTemplate } from "@/features/question-templates/question-template.service";

export function useQuestionTemplateSourceNavigation(navigate: NavigateFunction) {
    return useCallback(
        async (template: QuestionTemplateResponse) => {
            if (!template.linked_from_template_id) {
                toast.error("This template is not linked to any source");
                return;
            }

            try {
                const source = await getQuestionTemplate(template.linked_from_template_id);
                if (source.assessment_template_id) {
                    navigate(ROUTES.ASSESSMENT_TEMPLATE(source.assessment_template_id));
                    return;
                }

                if (source.question_template_bank_id) {
                    navigate(ROUTES.QUESTION_TEMPLATE_BANK(source.question_template_bank_id));
                    return;
                }

                toast.error("Source template location not found");
            } catch {
                toast.error("Failed to find source template");
            }
        },
        [navigate],
    );
}
