import { useState } from "react";
import type { GenerateQuestionResponse, QuestionType } from "../../types/api.types";
import { QuestionType as QuestionTypeEnum } from "../../constants";

interface QuestionDisplayProps {
    response: GenerateQuestionResponse;
    questionType: QuestionType;
}

export function QuestionDisplay({ response, questionType }: QuestionDisplayProps) {
    const [showAnswer, setShowAnswer] = useState(false);

    const { text, answer, options, correct_indices } = response;

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
        return String.fromCharCode(65 + index); // 65 is 'A' in ASCII
    };

    // Check if an option is correct
    const isCorrectOption = (index: number): boolean => {
        return correct_indices?.includes(index) ?? false;
    };

    return (
        <section className="w-full max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-6">Generated Question</h2>

            {/* Question Text */}
            <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3">Question:</h3>
                <p className="text-gray-800 leading-relaxed">{text}</p>
            </div>

            {/* Options for MCQ/MRQ */}
            {(questionType === QuestionTypeEnum.MCQ || questionType === QuestionTypeEnum.MRQ) &&
                options &&
                options.length > 0 && (
                    <div className="mb-6">
                        <h3 className="text-lg font-semibold mb-3">Options:</h3>
                        <div className="space-y-2">
                            {options.map((option, index) => (
                                <div
                                    key={index}
                                    className={`p-3 rounded-md border ${
                                        showAnswer && isCorrectOption(index)
                                            ? "bg-green-50 border-green-500"
                                            : "bg-gray-50 border-gray-300"
                                    }`}
                                >
                                    <span className="font-semibold mr-2">
                                        {getOptionLabel(index)}.
                                    </span>
                                    <span
                                        className={
                                            showAnswer && isCorrectOption(index)
                                                ? "text-green-700 font-medium"
                                                : ""
                                        }
                                    >
                                        {formatOption(option)}
                                    </span>
                                    {showAnswer && isCorrectOption(index) && (
                                        <span className="ml-2 text-green-600">✓</span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

            {/* Show/Hide Answer Button */}
            <div className="mb-6">
                <button
                    type="button"
                    onClick={() => setShowAnswer(!showAnswer)}
                    className="px-6 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                >
                    {showAnswer ? "Hide Answer" : "Show Answer"}
                </button>
            </div>

            {/* Answer Section */}
            {showAnswer && (
                <div className="p-4 bg-green-50 border border-green-300 rounded-md">
                    <h3 className="text-lg font-semibold text-green-800 mb-3">Answer:</h3>

                    {/* For MCQ/MRQ, show correct option labels */}
                    {(questionType === QuestionTypeEnum.MCQ || questionType === QuestionTypeEnum.MRQ) &&
                        correct_indices &&
                        correct_indices.length > 0 && (
                            <div className="mb-3">
                                <p className="text-green-700 font-medium">
                                    Correct option{correct_indices.length > 1 ? "s" : ""}:{" "}
                                    {correct_indices.map((idx) => getOptionLabel(idx)).join(", ")}
                                </p>
                            </div>
                        )}

                    {/* Show the actual answer value */}
                    {answer !== undefined && (
                        <div className="bg-white p-3 rounded border border-green-200">
                            <pre className="whitespace-pre-wrap text-gray-800 font-mono text-sm">
                                {formatAnswer(answer)}
                            </pre>
                        </div>
                    )}
                </div>
            )}
        </section>
    );
}
