import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { QuestionTemplateResponse } from "@/api/models";
import type { ReactNode } from "react";
import { LinkMenu } from "@/shared/components";
import { TemplateConfigSummary } from "./TemplateConfigSummary";

interface QuestionTemplateContentProps {
    template: QuestionTemplateResponse;
    index: number;
    actions?: ReactNode;
    onSync?: (template: QuestionTemplateResponse) => void;
    onGoToSource?: (template: QuestionTemplateResponse) => void;
    onUnlink?: (template: QuestionTemplateResponse) => void;
    canEdit?: boolean;
}

export function QuestionTemplateContent({
    template,
    index,
    actions,
    onSync,
    onGoToSource,
    onUnlink,
    canEdit,
}: QuestionTemplateContentProps) {
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
                        <CardTitle className="text-base whitespace-pre-wrap">
                            {template.question_text_template}
                        </CardTitle>
                    </div>
                    <div className="flex items-center gap-1">
                        {template.linked_from_template_id && onSync && onGoToSource && onUnlink && canEdit && (
                            <LinkMenu
                                item={template}
                                onSync={onSync}
                                onGoToSource={onGoToSource}
                                onUnlink={onUnlink}
                            />
                        )}
                        {actions}
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {template.description && (
                    <CardDescription className="mb-3">{template.description}</CardDescription>
                )}

                {/* Template Configuration */}
                <TemplateConfigSummary
                    entryFunction={template.entry_function}
                    outputType={template.output_type}
                    questionType={template.question_type}
                    numDistractors={template.num_distractors}
                />
            </CardContent>
        </Card>
    );
}
