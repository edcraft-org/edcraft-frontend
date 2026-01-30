import type { QuestionResponse } from "@/api/models";
import { QuestionCard } from "@/features/questions";
import { QuestionActionsMenu } from "./QuestionActionsMenu";

interface QuestionsListProps {
    questions: QuestionResponse[];
    onEdit: (question: QuestionResponse) => void;
    onDuplicate: (question: QuestionResponse) => void;
    onRemove: (question: QuestionResponse) => void;
}

export function QuestionsList({
    questions,
    onEdit,
    onDuplicate,
    onRemove,
}: QuestionsListProps) {
    if (questions.length === 0) {
        return (
            <div className="text-center py-12 text-muted-foreground">
                <p>No questions yet</p>
                <p className="text-sm">Add questions using the button above</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {questions.map((question, index) => (
                <div key={question.id} className="relative group">
                    <QuestionActionsMenu
                        question={question}
                        onEdit={onEdit}
                        onDuplicate={onDuplicate}
                        onRemove={onRemove}
                    />
                    <QuestionCard question={question} questionNumber={index + 1} />
                </div>
            ))}
        </div>
    );
}
