// QuestionBrowser - Browse and search through existing questions

import { Button } from "@/components/ui/button";
import { useQuestions } from "../hooks/useQuestions";
import { getQuestion } from "../services/question.service";
import type { QuestionResponse } from "@/types/frontend.types";
import { SelectableItemBrowser } from "@/shared/components/resources/SelectableItemBrowser";
import { SelectByIdSection } from "@/shared/components/resources/SelectByIdSection";

interface QuestionBrowserProps {
    ownerId: string;
    onSelectQuestion: (question: QuestionResponse) => void;
    onBack: () => void;
}

export function QuestionBrowser({ ownerId, onSelectQuestion, onBack }: QuestionBrowserProps) {
    const { data, isLoading } = useQuestions(ownerId);

    return (
        <div className="space-y-4">
            <Button variant="ghost" size="sm" onClick={onBack}>
                ← Back
            </Button>

            <SelectByIdSection
                label="Select by Question ID"
                placeholder="Paste question ID..."
                fetchById={getQuestion}
                onSelect={onSelectQuestion}
                errorMessage="Question not found or no access"
            />

            <div className="relative flex items-center">
                <div className="flex-1 border-t border-border" />
                <span className="px-2 text-xs text-muted-foreground">or</span>
                <div className="flex-1 border-t border-border" />
            </div>

            <SelectableItemBrowser
                data={data}
                isLoading={isLoading}
                onSelect={onSelectQuestion}
                getTitle={(q) => q.question_text}
                getBadge={(q) => q.question_type.toUpperCase()}
                searchPlaceholder="Search questions..."
                emptyMessage="No questions in your bank yet"
                emptySearchMessage="No questions match your search"
            />
        </div>
    );
}
