import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ChevronRight, Code } from "lucide-react";
import { cn } from "@/lib/utils";
import type { QuestionTemplateResponse } from "@/api/models";
import { QuestionTemplateActionsMenu } from "@/features/question-templates/components/QuestionTemplateActionsMenu";
import { LinkMenu } from "@/shared/components";

interface QuestionTemplateCardProps {
    template: QuestionTemplateResponse;
    onCreateQuestion: (template: QuestionTemplateResponse) => void;
    onEdit: (template: QuestionTemplateResponse) => void;
    onDuplicate: (template: QuestionTemplateResponse) => void;
    onRemove: (template: QuestionTemplateResponse) => void;
    onSync: (template: QuestionTemplateResponse) => void;
    onGoToSource: (template: QuestionTemplateResponse) => void;
    onUnlink: (template: QuestionTemplateResponse) => void;
    canEdit: boolean;
}

export function QuestionTemplateCard({
    template,
    onCreateQuestion,
    onEdit,
    onDuplicate,
    onRemove,
    onSync,
    onGoToSource,
    onUnlink,
    canEdit,
}: QuestionTemplateCardProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <Card className="w-full">
            <CardHeader className="flex flex-row items-start justify-between space-y-0">
                <div
                    className="flex items-start gap-2 flex-1 cursor-pointer"
                    onClick={() => setIsExpanded(!isExpanded)}
                    role="button"
                    aria-expanded={isExpanded}
                    aria-label={isExpanded ? "Collapse template" : "Expand template"}
                >
                    <ChevronRight
                        className={cn(
                            "h-4 w-4 mt-1 text-muted-foreground transition-transform flex-shrink-0",
                            isExpanded && "rotate-90",
                        )}
                    />
                    <p
                        className={cn(
                            "text-base font-normal flex-1 whitespace-pre-wrap",
                            !isExpanded && "line-clamp-2",
                        )}
                    >
                        {template.question_text_template}{" "}
                        <span className="text-xs px-2 py-1 bg-muted rounded flex-shrink-0">
                            {template.question_type.toUpperCase()}
                        </span>
                    </p>
                </div>
                <div className="flex items-center gap-1">
                    {template.linked_from_template_id && canEdit && (
                        <LinkMenu
                            item={template}
                            onSync={onSync}
                            onGoToSource={onGoToSource}
                            onUnlink={onUnlink}
                        />
                    )}
                    <QuestionTemplateActionsMenu
                        template={template}
                        onCreateQuestion={onCreateQuestion}
                        onEdit={onEdit}
                        onDuplicate={onDuplicate}
                        onRemove={onRemove}
                        canEdit={canEdit}
                    />
                </div>
            </CardHeader>
            {isExpanded && (
                <CardContent>
                    {template.description && (
                        <p className="text-sm text-muted-foreground mb-3">{template.description}</p>
                    )}
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                            <Code className="h-3 w-3" />
                            <span>Template Configuration</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs pl-5">
                            <div>
                                <span className="text-muted-foreground">Entry Function:</span>
                                <span className="ml-1 font-mono">{template.entry_function}</span>
                            </div>
                            <div>
                                <span className="text-muted-foreground">Output Type:</span>
                                <span className="ml-1">{template.output_type}</span>
                            </div>
                            <div>
                                <span className="text-muted-foreground">Question Type:</span>
                                <span className="ml-1">{template.question_type}</span>
                            </div>
                            <div>
                                <span className="text-muted-foreground">Distractors:</span>
                                <span className="ml-1">{template.num_distractors}</span>
                            </div>
                        </div>
                    </div>
                </CardContent>
            )}
        </Card>
    );
}
