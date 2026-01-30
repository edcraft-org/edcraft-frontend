// QuestionBrowser - Browse and search through existing questions

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useQuestions } from "../useQuestions";
import type { QuestionResponse } from "@/api/models";

interface QuestionBrowserProps {
    ownerId: string;
    onSelectQuestion: (question: QuestionResponse) => void;
    onBack: () => void;
}

export function QuestionBrowser({ ownerId, onSelectQuestion, onBack }: QuestionBrowserProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const { data: questions, isLoading } = useQuestions(ownerId);

    const filteredQuestions =
        questions?.filter((q) =>
            q.question_text.toLowerCase().includes(searchQuery.toLowerCase()),
        ) || [];

    return (
        <div className="space-y-4">
            <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={onBack}>
                    ← Back
                </Button>
            </div>

            <Input
                placeholder="Search questions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
            />

            <ScrollArea className="h-[300px]">
                {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                ) : filteredQuestions.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        {searchQuery
                            ? "No questions match your search"
                            : "No questions in your bank yet"}
                    </div>
                ) : (
                    <div className="space-y-2">
                        {filteredQuestions.map((question) => (
                            <Card
                                key={question.id}
                                className="cursor-pointer hover:bg-muted/50 transition-colors"
                                onClick={() => onSelectQuestion(question)}
                            >
                                <CardContent className="p-3">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm line-clamp-2">
                                                {question.question_text}
                                            </p>
                                        </div>
                                        <span className="text-xs px-2 py-1 bg-muted rounded shrink-0">
                                            {question.question_type.toUpperCase()}
                                        </span>
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
