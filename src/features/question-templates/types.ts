import type { GenerationOptions, QuestionSpec } from "@/api/models";

export interface QuestionTemplateConfig {
    code: string;
    question_spec: QuestionSpec;
    generation_options: GenerationOptions;
    entry_function: string;
}
