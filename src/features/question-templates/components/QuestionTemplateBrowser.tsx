// QuestionTemplateBrowser - Browse and search through existing question templates

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useQuestionTemplates } from "../useQuestionTemplates";
import { getQuestionTemplate } from "../question-template.service";
import type { QuestionTemplateResponse } from "@/api/models";
import { toast } from "sonner";

interface QuestionTemplateBrowserProps {
    ownerId: string;
    onSelectTemplate: (template: QuestionTemplateResponse) => void;
    onBack: () => void;
}

export function QuestionTemplateBrowser({
    ownerId,
    onSelectTemplate,
    onBack,
}: QuestionTemplateBrowserProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [loadingTemplateId, setLoadingTemplateId] = useState<string | null>(null);
    const { data: templates, isLoading } = useQuestionTemplates(ownerId);

    const filteredTemplates =
        templates?.filter(
            (t) =>
                t.question_text.toLowerCase().includes(searchQuery.toLowerCase()) ||
                t.description?.toLowerCase().includes(searchQuery.toLowerCase()),
        ) || [];

    const handleSelectTemplate = async (templateId: string) => {
        setLoadingTemplateId(templateId);
        try {
            const fullTemplate = await getQuestionTemplate(templateId);
            onSelectTemplate(fullTemplate);
        } catch (error) {
            toast.error("Failed to load template details");
            console.error("Error fetching template:", error);
        } finally {
            setLoadingTemplateId(null);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={onBack}>
                    ← Back
                </Button>
            </div>

            <Input
                placeholder="Search question templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
            />

            <ScrollArea className="h-[300px]">
                {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                ) : filteredTemplates.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        {searchQuery
                            ? "No question templates match your search"
                            : "No question templates in your bank yet"}
                    </div>
                ) : (
                    <div className="space-y-2">
                        {filteredTemplates.map((template) => (
                            <Card
                                key={template.id}
                                className="cursor-pointer hover:bg-muted/50 transition-colors"
                                onClick={() => handleSelectTemplate(template.id)}
                            >
                                <CardContent className="p-3">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1 min-w-0 space-y-1">
                                            <p className="text-sm line-clamp-2">
                                                {template.question_text}
                                            </p>
                                            {template.description && (
                                                <p className="text-xs text-muted-foreground line-clamp-1">
                                                    {template.description}
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            {loadingTemplateId === template.id && (
                                                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                            )}
                                            <span className="text-xs px-2 py-1 bg-muted rounded">
                                                {template.question_type.toUpperCase()}
                                            </span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </ScrollArea>
        </div>
    );
}
