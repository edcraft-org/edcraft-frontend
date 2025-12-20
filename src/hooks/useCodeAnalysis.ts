import { useState } from "react";
import type {
    FormSchema,
    GenerateQuestionRequest,
    GenerateQuestionResponse,
    QuestionType,
} from "../types/api.types";
import { apiService } from "../services/api.service";

interface UseCodeAnalysisReturn {
    formSchema: FormSchema | null;
    submittedCode: string;
    isAnalysing: boolean;
    analyseError: string | null;
    isGenerating: boolean;
    generateError: string | null;
    generatedQuestion: GenerateQuestionResponse | null;
    questionType: QuestionType | null;
    analyseCode: (code: string) => Promise<void>;
    generateQuestion: (request: GenerateQuestionRequest) => Promise<void>;
    reset: () => void;
}

export function useCodeAnalysis(): UseCodeAnalysisReturn {
    const [formSchema, setFormSchema] = useState<FormSchema | null>(null);
    const [submittedCode, setSubmittedCode] = useState<string>("");
    const [isAnalysing, setIsAnalysing] = useState(false);
    const [analyseError, setAnalyseError] = useState<string | null>(null);

    const [isGenerating, setIsGenerating] = useState(false);
    const [generateError, setGenerateError] = useState<string | null>(null);
    const [generatedQuestion, setGeneratedQuestion] = useState<GenerateQuestionResponse | null>(
        null
    );
    const [questionType, setQuestionType] = useState<QuestionType | null>(null);

    const analyseCode = async (code: string) => {
        setIsAnalysing(true);
        setAnalyseError(null);

        try {
            const schema = await apiService.analyseCode(code);
            setFormSchema(schema);
            setSubmittedCode(code);
        } catch (error) {
            setAnalyseError(error instanceof Error ? error.message : "Failed to analyse code");
            setFormSchema(null);
        } finally {
            setIsAnalysing(false);
        }
    };

    const generateQuestion = async (request: GenerateQuestionRequest) => {
        setIsGenerating(true);
        setGenerateError(null);

        try {
            const response = await apiService.generateQuestion(request);
            setGeneratedQuestion(response);
            setQuestionType(response.question_type);
        } catch (error) {
            setGenerateError(
                error instanceof Error ? error.message : "Failed to generate question"
            );
            setGeneratedQuestion(null);
            setQuestionType(null);
        } finally {
            setIsGenerating(false);
        }
    };

    const reset = () => {
        setFormSchema(null);
        setAnalyseError(null);
        setGenerateError(null);
        setGeneratedQuestion(null);
        setQuestionType(null);
    };

    return {
        formSchema,
        submittedCode,
        isAnalysing,
        analyseError,
        isGenerating,
        generateError,
        generatedQuestion,
        questionType,
        analyseCode,
        generateQuestion,
        reset,
    };
}
