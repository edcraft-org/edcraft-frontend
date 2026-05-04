// TemplatePreview - Display a generated template preview with sample question

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileQuestion } from "lucide-react";
import type { TemplatePreviewResponse } from "@/api/models";
import { QuestionDisplay } from "@/features/question-builder/components";
import { TemplateConfigSummary } from "@/features/question-templates/components/TemplateConfigSummary";

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
                    <p className="text-sm whitespace-pre-wrap">{question_text_template}</p>
                    <Badge variant="secondary">{question_type.toUpperCase()}</Badge>
                </CardContent>
            </Card>

            {/* Sample Question Preview */}
            <QuestionDisplay question={preview_question} questionType={question_type} />

            {/* Template Config Summary */}
            <Card>
                <CardContent>
                    <TemplateConfigSummary
                        entryFunction={preview.entry_function}
                        outputType={preview.output_type}
                        questionType={preview.question_type}
                        numDistractors={preview.num_distractors}
                    />
                </CardContent>
            </Card>
        </div>
    );
}
