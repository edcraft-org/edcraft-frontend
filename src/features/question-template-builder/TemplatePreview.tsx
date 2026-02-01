// TemplatePreview - Display a generated template preview with sample question

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Code2, FileQuestion, CheckCircle2 } from "lucide-react";
import type { TemplatePreviewResponse } from "@/api/models";
import type { QuestionTemplateConfig } from "@/features/question-templates";

interface TemplatePreviewProps {
    preview: TemplatePreviewResponse;
}

export function TemplatePreview({ preview }: TemplatePreviewProps) {
    const { question_text, question_type, preview_question } = preview;
    const template_config = preview.template_config as unknown as QuestionTemplateConfig;

    return (
        <div className="space-y-4">
            {/* Question Text */}
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <FileQuestion className="h-4 w-4" />
                        Generated Question Text
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm">{question_text}</p>
                    <Badge variant="secondary" className="mt-2">
                        {question_type.toUpperCase()}
                    </Badge>
                </CardContent>
            </Card>

            {/* Sample Question Preview */}
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4" />
                        Sample Question Preview
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <p className="text-sm">{preview_question.text}</p>

                    {preview_question.options && preview_question.options.length > 0 && (
                        <div className="space-y-1">
                            <p className="text-xs text-muted-foreground">Options:</p>
                            <ul className="space-y-1">
                                {preview_question.options.map((option, index) => (
                                    <li
                                        key={index}
                                        className={`text-sm p-2 rounded border ${
                                            preview_question.correct_indices?.includes(index)
                                                ? "border-green-500 bg-green-50 dark:bg-green-950/20"
                                                : "border-border"
                                        }`}
                                    >
                                        {preview_question.correct_indices?.includes(index) && (
                                            <CheckCircle2 className="h-3 w-3 inline mr-2 text-green-500" />
                                        )}
                                        {option as string}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {
                        <div>
                            <p className="text-xs text-muted-foreground">Answer:</p>
                            <p className="text-sm font-mono bg-muted p-2 rounded mt-1">
                                {preview_question.answer as string}
                            </p>
                        </div>
                    }
                </CardContent>
            </Card>

            {/* Template Config Summary */}
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Code2 className="h-4 w-4" />
                        Template Configuration
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                            <span className="text-muted-foreground">Entry Function:</span>
                            <span className="ml-2 font-mono">
                                {template_config.entry_function as string}
                            </span>
                        </div>
                        <div>
                            <span className="text-muted-foreground">Output Type:</span>
                            <span className="ml-2">
                                {template_config.question_spec.output_type}
                            </span>
                        </div>
                        <div>
                            <span className="text-muted-foreground">Question Type:</span>
                            <span className="ml-2">
                                {template_config.question_spec.question_type}
                            </span>
                        </div>
                        <div>
                            <span className="text-muted-foreground">Distractors:</span>
                            <span className="ml-2">
                                {template_config.generation_options.num_distractors}
                            </span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
