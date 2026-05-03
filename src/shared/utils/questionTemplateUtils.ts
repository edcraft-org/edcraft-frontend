import type { CreateQuestionTemplateRequest, QuestionTemplateResponse } from "@/api/models";

export function questionTemplateResponseToCreateRequest(
    template: QuestionTemplateResponse,
): CreateQuestionTemplateRequest {
    return {
        question_type: template.question_type,
        question_text_template: template.question_text_template,
        text_template_type: template.text_template_type,
        description: template.description,
        code: template.code,
        entry_function: template.entry_function,
        num_distractors: template.num_distractors,
        output_type: template.output_type,
        target_elements: template.target_elements.map(({ order: _order, ...targetElement }) => ({
            ...targetElement,
        })),
        input_data_config: template.input_data_config,
        code_info: template.code_info,
    };
}
