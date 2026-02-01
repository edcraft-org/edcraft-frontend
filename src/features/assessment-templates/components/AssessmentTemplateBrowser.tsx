// AssessmentTemplateBrowser - Browse and search through existing assessment templates

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, FileStack } from "lucide-react";
import type { AssessmentTemplateResponse } from "@/api/models";

interface AssessmentTemplateBrowserProps {
    templates: AssessmentTemplateResponse[];
    isLoading: boolean;
    onSelectTemplate: (templateId: string) => void;
    disabled?: boolean;
}

export function AssessmentTemplateBrowser({
    templates,
    isLoading,
    onSelectTemplate,
    disabled,
}: AssessmentTemplateBrowserProps) {
    const [searchQuery, setSearchQuery] = useState("");

    const filteredTemplates =
        templates?.filter((t) => t.title.toLowerCase().includes(searchQuery.toLowerCase())) || [];

    return (
        <div className="space-y-3">
            <Input
                placeholder="Search template banks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
            />

            <ScrollArea className="h-[200px]">
                {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                ) : filteredTemplates.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        {searchQuery
                            ? "No template banks match your search"
                            : "No template banks yet. Create one above."}
                    </div>
                ) : (
                    <div className="space-y-2">
                        {filteredTemplates.map((template) => (
                            <Card
                                key={template.id}
                                className="cursor-pointer hover:bg-muted/50 transition-colors"
                                onClick={() => {
                                    if (!disabled) {
                                        onSelectTemplate(template.id);
                                    }
                                }}
                            >
                                <CardContent className="p-3">
                                    <div className="flex items-center gap-3">
                                        <FileStack className="h-4 w-4 text-muted-foreground" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">
                                                {template.title}
                                            </p>
                                            {template.description && (
                                                <p className="text-xs text-muted-foreground truncate">
                                                    {template.description}
                                                </p>
                                            )}
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
