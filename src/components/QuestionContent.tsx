import { useState } from "react";
import { Button } from "@/components/ui/button";

interface QuestionContentProps {
    questionText: string;
    questionType: string;
    options?: unknown[];
    correctIndices?: number[];
    answer?: unknown;
    hideAnswerButton?: boolean;
}

export function QuestionContent({
    questionText,
    questionType,
    options,
    correctIndices,
    answer,
    hideAnswerButton = false,
}: QuestionContentProps) {
    const [showAnswer, setShowAnswer] = useState(false);

    // Convert option to string for display
    const formatOption = (option: unknown): string => {
        if (typeof option === "string") return option;
        if (typeof option === "number") return String(option);
        if (Array.isArray(option)) return JSON.stringify(option);
        if (typeof option === "object" && option !== null) return JSON.stringify(option, null, 2);
        return String(option);
    };

    // Format answer for display
    const formatAnswer = (ans: unknown): string => {
        if (typeof ans === "string") return ans;
        if (typeof ans === "number") return String(ans);
        if (Array.isArray(ans)) return JSON.stringify(ans, null, 2);
        if (typeof ans === "object" && ans !== null) return JSON.stringify(ans, null, 2);
        return String(ans);
    };

    // Get letter label for option (A, B, C, ...)
    const getOptionLabel = (index: number): string => {
        return String.fromCharCode(65 + index);
    };

    // Check if an option is correct
    const isCorrectOption = (index: number): boolean => {
        return correctIndices?.includes(index) ?? false;
    };

    const isMCQOrMRQ = questionType === "mcq" || questionType === "mrq";
    const hasOptions = isMCQOrMRQ && options && Array.isArray(options) && options.length > 0;

    return (
        <div className="space-y-4">
            {/* Question Text */}
            <div className="text-base font-normal">{questionText}</div>

            {/* Options for MCQ/MRQ */}
            {hasOptions && (
                <div className="space-y-2">
                    {options.map((option, index) => (
                        <div
                            key={index}
                            className={`p-3 rounded-md border transition-colors ${
                                showAnswer && isCorrectOption(index)
                                    ? "bg-green-50 dark:bg-green-950 border-green-500 dark:border-green-700"
                                    : "bg-muted/50 border-border"
                            }`}
                        >
                            <span className="font-semibold mr-2">{getOptionLabel(index)}.</span>
                            <span
                                className={
                                    showAnswer && isCorrectOption(index)
                                        ? "text-green-700 dark:text-green-400 font-medium"
                                        : "text-foreground"
                                }
                            >
                                {formatOption(option)}
                            </span>
                            {showAnswer && isCorrectOption(index) && (
                                <span className="ml-2 text-green-600 dark:text-green-400">✓</span>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Show/Hide Answer Button */}
            {!hideAnswerButton && (
                <div>
                    <Button
                        type="button"
                        variant="secondary"
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
                    {hasOptions && correctIndices && correctIndices.length > 0 && (
                        <div className="mb-2">
                            <p className="text-green-700 dark:text-green-400 text-sm">
                                Correct option{correctIndices.length > 1 ? "s" : ""}:{" "}
                                {correctIndices.map((idx) => getOptionLabel(idx)).join(", ")}
                            </p>
                        </div>
                    )}

                    {/* Show the actual answer text */}
                    {answer !== undefined && (
                        <div className="bg-background p-2 rounded border border-green-200 dark:border-green-800">
                            <p className="text-foreground text-sm whitespace-pre-wrap">
                                {formatAnswer(answer)}
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
