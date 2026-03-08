import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { QuestionResponse } from "@/types/frontend.types";
import { getOptions, getCorrectIndices, getAnswerText } from "@/shared/utils/questionUtils";
import { QuestionActionsMenu } from "@/features/questions/components/QuestionActionsMenu";
import { QuestionContent } from "@/components/QuestionContent";

interface QuestionCardProps {
    question: QuestionResponse;
    onEdit: (question: QuestionResponse) => void;
    onDuplicate: (question: QuestionResponse) => void;
    onRemove: (question: QuestionResponse) => void;
}

export function QuestionCard({ question, onEdit, onDuplicate, onRemove }: QuestionCardProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    const { question_text, question_type } = question;
    const options = getOptions(question);
    const correctIndices = getCorrectIndices(question);
    const answer = getAnswerText(question);

    return (
        <Card className="w-full">
            <CardHeader className="flex flex-row items-start justify-between space-y-0">
                <div
                    className="flex items-start gap-2 flex-1 cursor-pointer"
                    onClick={() => setIsExpanded(!isExpanded)}
                    role="button"
                    aria-expanded={isExpanded}
                    aria-label={isExpanded ? "Collapse question" : "Expand question"}
                >
                    <ChevronRight
                        className={cn(
                            "h-4 w-4 mt-1 text-muted-foreground transition-transform flex-shrink-0",
                            isExpanded && "rotate-90",
                        )}
                    />
                    <p className="text-base font-normal flex-1 whitespace-pre-wrap">
                        <span className="text-xs px-2 py-1 bg-muted rounded flex-shrink-0">
                            {question_type.toUpperCase()}
                        </span>{" "}
                        {question_text}
                    </p>
                </div>
                <QuestionActionsMenu
                    question={question}
                    onEdit={onEdit}
                    onDuplicate={onDuplicate}
                    onRemove={onRemove}
                />
            </CardHeader>
            {isExpanded && (
                <CardContent>
                    <QuestionContent
                        questionType={question_type}
                        options={options}
                        correctIndices={correctIndices}
                        answer={answer}
                    />
                </CardContent>
            )}
        </Card>
    );
}
