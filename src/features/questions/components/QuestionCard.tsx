import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { QuestionResponse } from "@/api/models";
import type {
    MultipleChoiceAdditionalData,
    ShortAnswerAdditionalData,
} from "@/types/frontend.types";

interface QuestionCardProps {
    question: QuestionResponse;
    questionNumber?: number;
}

export function QuestionCard({ question, questionNumber }: QuestionCardProps) {
    const [showAnswer, setShowAnswer] = useState(false);

    const { question_text, question_type, additional_data } = question;

    // Type guard for MCQ/MRQ
    const isMCQOrMRQ = question_type === "mcq" || question_type === "mrq";
    const hasOptions =
        isMCQOrMRQ && "options" in additional_data && Array.isArray(additional_data.options);

    // Get letter label for option (A, B, C, ...)
    const getOptionLabel = (index: number): string => {
        return String.fromCharCode(65 + index);
    };

    // Check if an option is correct
    const isCorrectOption = (index: number): boolean => {
        if (!hasOptions || !("correct_indices" in additional_data)) return false;
        return (
            (additional_data as unknown as MultipleChoiceAdditionalData).correct_indices?.includes(
                index,
            ) ?? false
        );
    };

    return (
        <Card className="w-full">
            <CardHeader>
                {questionNumber !== undefined && (
                    <div className="text-sm font-medium text-muted-foreground mb-1">
                        Question {questionNumber}
                    </div>
                )}
                <CardTitle className="text-base font-normal">{question_text}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Question Type Badge */}
                <div>
                    <span className="text-xs px-2 py-1 bg-muted rounded">
                        {question_type.toUpperCase()}
                    </span>
                </div>

                {/* Options for MCQ/MRQ */}
                {hasOptions && (
                    <div className="space-y-2">
                        {(additional_data as unknown as MultipleChoiceAdditionalData).options.map(
                            (option, index) => (
                                <div
                                    key={index}
                                    className={`p-3 rounded-md border transition-colors ${
                                        showAnswer && isCorrectOption(index)
                                            ? "bg-green-50 dark:bg-green-950 border-green-500 dark:border-green-700"
                                            : "bg-muted/50 border-border"
                                    }`}
                                >
                                    <span className="font-semibold mr-2">
                                        {getOptionLabel(index)}.
                                    </span>
                                    <span
                                        className={
                                            showAnswer && isCorrectOption(index)
                                                ? "text-green-700 dark:text-green-400 font-medium"
                                                : "text-foreground"
                                        }
                                    >
                                        {option}
                                    </span>
                                    {showAnswer && isCorrectOption(index) && (
                                        <span className="ml-2 text-green-600 dark:text-green-400">
                                            ✓
                                        </span>
                                    )}
                                </div>
                            ),
                        )}
                    </div>
                )}

                {/* Show/Hide Answer Button */}
                {setShowAnswer && (
                    <div>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setShowAnswer(!showAnswer)}
                        >
                            {showAnswer ? "Hide Answer" : "Show Answer"}
                        </Button>
                    </div>
                )}

                {/* Answer Section */}
                {showAnswer && (
                    <div className="p-3 bg-green-50 dark:bg-green-950 border border-green-500 dark:border-green-700 rounded-md">
                        <h4 className="text-sm font-semibold text-green-800 dark:text-green-300 mb-2">
                            Answer:
                        </h4>

                        {/* For MCQ/MRQ, show correct option labels */}
                        {hasOptions && "correct_indices" in additional_data && (
                            <div className="mb-2">
                                <p className="text-green-700 dark:text-green-400 text-sm">
                                    Correct option
                                    {(additional_data as unknown as MultipleChoiceAdditionalData)
                                        .correct_indices.length > 1
                                        ? "s"
                                        : ""}
                                    :{" "}
                                    {(
                                        additional_data as unknown as MultipleChoiceAdditionalData
                                    ).correct_indices
                                        .map((idx: number) => getOptionLabel(idx))
                                        .join(", ")}
                                </p>
                            </div>
                        )}

                        {/* Show the actual answer text */}
                        {"answer" in additional_data &&
                            (
                                additional_data as unknown as
                                    | MultipleChoiceAdditionalData
                                    | ShortAnswerAdditionalData
                            ).answer && (
                                <div className="bg-background p-2 rounded border border-green-200 dark:border-green-800">
                                    <p className="text-foreground text-sm whitespace-pre-wrap">
                                        {
                                            (
                                                additional_data as unknown as
                                                    | MultipleChoiceAdditionalData
                                                    | ShortAnswerAdditionalData
                                            ).answer
                                        }
                                    </p>
                                </div>
                            )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
