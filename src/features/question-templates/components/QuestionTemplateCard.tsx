import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Code } from "lucide-react";
import type { QuestionTemplateResponse } from "@/api/models";
import { QuestionTemplateActionsMenu } from "./QuestionTemplateActionsMenu";
import type { QuestionTemplateConfig } from "../types";

interface QuestionTemplateCardProps {
    template: QuestionTemplateResponse;
    index: number;
    onCreateQuestion: (template: QuestionTemplateResponse) => void;
    onEdit: (template: QuestionTemplateResponse) => void;
    onDuplicate: (template: QuestionTemplateResponse) => void;
    onRemove: (template: QuestionTemplateResponse) => void;
}

export function QuestionTemplateCard({
    template,
    index,
    onCreateQuestion,
    onEdit,
    onDuplicate,
    onRemove,
}: QuestionTemplateCardProps) {
    const template_config = template.template_config as unknown as QuestionTemplateConfig;

    return (
        <Card className="group">
            <CardHeader>
                <div className="flex items-start justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-muted-foreground">
                                Template {index + 1}
                            </span>
                            <span className="text-xs px-2 py-0.5 bg-muted rounded">
                                {template.question_type.toUpperCase()}
                            </span>
                        </div>
                        <CardTitle className="text-base">{template.question_text}</CardTitle>
                    </div>
                    <QuestionTemplateActionsMenu
                        template={template}
                        onCreateQuestion={onCreateQuestion}
                        onEdit={onEdit}
                        onDuplicate={onDuplicate}
                        onRemove={onRemove}
                    />
                </div>
            </CardHeader>
            <CardContent>
                {template.description && (
                    <CardDescription className="mb-3">{template.description}</CardDescription>
                )}

                {/* Template Configuration */}
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                        <Code className="h-3 w-3" />
                        <span>Template Configuration</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs pl-5">
                        <div>
                            <span className="text-muted-foreground">Entry Function:</span>
                            <span className="ml-1 font-mono">{template_config.entry_function}</span>
                        </div>
                        <div>
                            <span className="text-muted-foreground">Output Type:</span>
                            <span className="ml-1">
                                {template_config.question_spec.output_type}
                            </span>
                        </div>
                        <div>
                            <span className="text-muted-foreground">Question Type:</span>
                            <span className="ml-1">
                                {template_config.question_spec.question_type}
                            </span>
                        </div>
                        <div>
                            <span className="text-muted-foreground">Distractors:</span>
                            <span className="ml-1">
                                {template_config.generation_options.num_distractors}
                            </span>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
