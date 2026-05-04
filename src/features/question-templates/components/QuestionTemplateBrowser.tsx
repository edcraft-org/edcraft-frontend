// QuestionTemplateBrowser - Browse and search through existing question templates

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useQuestionTemplates } from "../hooks/useQuestionTemplates";
import { getQuestionTemplate } from "../services/question-template.service";
import type { QuestionTemplateResponse, QuestionTemplateSummaryResponse } from "@/api/models";
import { SelectByIdSection } from "@/shared/components/resources/SelectByIdSection";
import { SelectableItemBrowser } from "@/shared/components/resources/SelectableItemBrowser";

interface QuestionTemplateBrowserProps {
    ownerId: string;
    onSelectTemplate: (template: QuestionTemplateResponse) => void;
    onBack: () => void;
}

export function QuestionTemplateBrowser({ ownerId, onSelectTemplate, onBack }: QuestionTemplateBrowserProps) {
    const { data, isLoading } = useQuestionTemplates(ownerId);
    const [loadingId, setLoadingId] = useState<string | null>(null);

    const handleSelect = async (template: QuestionTemplateSummaryResponse) => {
        setLoadingId(template.id);
        try {
            const fullTemplate = await getQuestionTemplate(template.id);
            onSelectTemplate(fullTemplate);
        } finally {
            setLoadingId(null);
        }
    };

    return (
        <div className="space-y-4">
            <Button variant="ghost" size="sm" onClick={onBack}>
                ← Back
            </Button>

            <SelectByIdSection
                label="Select by Template ID"
                placeholder="Paste template ID..."
                fetchById={getQuestionTemplate}
                onSelect={onSelectTemplate}
                errorMessage="Template not found or no access"
            />

            <div className="relative flex items-center">
                <div className="flex-1 border-t border-border" />
                <span className="px-2 text-xs text-muted-foreground">or</span>
                <div className="flex-1 border-t border-border" />
            </div>

            <SelectableItemBrowser<QuestionTemplateSummaryResponse>
                data={data}
                isLoading={isLoading}
                onSelect={handleSelect}
                isFetchingItem={(id) => id === loadingId}
                getTitle={(t) => t.question_text_template}
                getSubtitle={(t) => t.description ?? null}
                getBadge={(t) => t.question_type.toUpperCase()}
                searchPlaceholder="Search question templates..."
                emptyMessage="No templates yet"
                emptySearchMessage="No templates match your search"
            />
        </div>
    );
}
