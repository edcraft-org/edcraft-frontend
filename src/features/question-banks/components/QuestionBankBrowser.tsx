// QuestionBankBrowser - Browse and search through existing question banks

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Database } from "lucide-react";
import type { QuestionBankResponse } from "@/api/models";

interface QuestionBankBrowserProps {
    questionBanks: QuestionBankResponse[];
    isLoading: boolean;
    onSelectQuestionBank: (questionBankId: string) => void;
    disabled?: boolean;
    preSelectedQuestionBankId?: string;
}

export function QuestionBankBrowser({
    questionBanks,
    isLoading,
    onSelectQuestionBank,
    disabled,
    preSelectedQuestionBankId,
}: QuestionBankBrowserProps) {
    const [searchQuery, setSearchQuery] = useState("");

    const filteredQuestionBanks =
        questionBanks?.filter((qb) => qb.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
        [];

    return (
        <div className="space-y-3">
            <Input
                placeholder="Search question banks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
            />

            <ScrollArea className="h-[200px]">
                {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                ) : filteredQuestionBanks.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        {searchQuery
                            ? "No question banks match your search"
                            : "No question banks yet. Create one above."}
                    </div>
                ) : (
                    <div className="space-y-2">
                        {filteredQuestionBanks.map((questionBank) => (
                            <Card
                                key={questionBank.id}
                                className={`cursor-pointer hover:bg-muted/50 transition-colors ${
                                    preSelectedQuestionBankId === questionBank.id
                                        ? "border-primary"
                                        : ""
                                }`}
                                onClick={() => {
                                    if (!disabled) {
                                        onSelectQuestionBank(questionBank.id);
                                    }
                                }}
                            >
                                <CardContent className="p-3">
                                    <div className="flex items-center gap-3">
                                        <Database className="h-4 w-4 text-muted-foreground" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">
                                                {questionBank.title}
                                            </p>
                                            {questionBank.description && (
                                                <p className="text-xs text-muted-foreground truncate">
                                                    {questionBank.description}
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
