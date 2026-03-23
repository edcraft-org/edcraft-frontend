// TemplatePreview - Display a generated template preview with sample question

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Code2, FileQuestion } from "lucide-react";
import type { TemplatePreviewResponse } from "@/api/models";
import { QuestionDisplay } from "@/features/question-builder/components";

interface TemplatePreviewProps {
    preview: TemplatePreviewResponse;
}

export function TemplatePreview({ preview }: TemplatePreviewProps) {
    const { question_text_template, question_type, preview_question } = preview;

    return (
        <div className="space-y-4">
            {/* Question Text Template */}
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <FileQuestion className="h-4 w-4" />
                        Question Text Template
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm">{question_text_template}</p>
                    <Badge variant="secondary">{question_type.toUpperCase()}</Badge>
                </CardContent>
            </Card>

            {/* Sample Question Preview */}
            <QuestionDisplay question={preview_question} questionType={question_type} />

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
                            <span className="ml-2 font-mono">{preview.entry_function}</span>
                        </div>
                        <div>
                            <span className="text-muted-foreground">Output Type:</span>
                            <span className="ml-2">{preview.output_type}</span>
                        </div>
                        <div>
                            <span className="text-muted-foreground">Question Type:</span>
                            <span className="ml-2">{preview.question_type}</span>
                        </div>
                        <div>
                            <span className="text-muted-foreground">Distractors:</span>
                            <span className="ml-2">{preview.num_distractors}</span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
