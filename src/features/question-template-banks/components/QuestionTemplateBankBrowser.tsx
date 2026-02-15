// QuestionTemplateBankBrowser - Browse and search through existing question template banks

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Database } from "lucide-react";
import type { QuestionTemplateBankResponse } from "@/api/models";

interface QuestionTemplateBankBrowserProps {
    questionTemplateBanks: QuestionTemplateBankResponse[];
    isLoading: boolean;
    onSelectQuestionTemplateBank: (questionTemplateBankId: string) => void;
    disabled?: boolean;
    preSelectedQuestionTemplateBankId?: string;
}

export function QuestionTemplateBankBrowser({
    questionTemplateBanks,
    isLoading,
    onSelectQuestionTemplateBank,
    disabled,
    preSelectedQuestionTemplateBankId,
}: QuestionTemplateBankBrowserProps) {
    const [searchQuery, setSearchQuery] = useState("");

    const filteredQuestionTemplateBanks =
        questionTemplateBanks?.filter((qtb) =>
            qtb.title.toLowerCase().includes(searchQuery.toLowerCase()),
        ) || [];

    return (
        <div className="space-y-3">
            <Input
                placeholder="Search question template banks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
            />

            <ScrollArea className="h-[200px]">
                {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                ) : filteredQuestionTemplateBanks.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        {searchQuery
                            ? "No question template banks match your search"
                            : "No question template banks yet. Create one above."}
                    </div>
                ) : (
                    <div className="space-y-2">
                        {filteredQuestionTemplateBanks.map((questionTemplateBank) => (
                            <Card
                                key={questionTemplateBank.id}
                                className={`cursor-pointer hover:bg-muted/50 transition-colors ${
                                    preSelectedQuestionTemplateBankId === questionTemplateBank.id
                                        ? "border-primary"
                                        : ""
                                }`}
                                onClick={() => {
                                    if (!disabled) {
                                        onSelectQuestionTemplateBank(questionTemplateBank.id);
                                    }
                                }}
                            >
                                <CardContent className="p-3">
                                    <div className="flex items-center gap-3">
                                        <Database className="h-4 w-4 text-muted-foreground" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">
                                                {questionTemplateBank.title}
                                            </p>
                                            {questionTemplateBank.description && (
                                                <p className="text-xs text-muted-foreground truncate">
                                                    {questionTemplateBank.description}
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
