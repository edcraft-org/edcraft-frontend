import type {
    FormSchema,
    GenerateQuestionRequest,
    GenerateQuestionResponse,
} from "../types/api.types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

class ApiService {
    private baseUrl: string;

    constructor(baseUrl: string = API_BASE_URL) {
        this.baseUrl = baseUrl;
    }

    async analyseCode(code: string): Promise<FormSchema> {
        const response = await fetch(`${this.baseUrl}/question-generation/analyse-code`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ code }),
        });

        if (!response.ok) {
            throw new Error(`Failed to analyse code: ${response.statusText}`);
        }

        return response.json();
    }

    async generateQuestion(request: GenerateQuestionRequest): Promise<GenerateQuestionResponse> {
        const response = await fetch(`${this.baseUrl}/question-generation/generate-question`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(request),
        });

        if (!response.ok) {
            throw new Error(`Failed to generate question: ${response.statusText}`);
        }

        return response.json();
    }
}

export const apiService = new ApiService();
