import { pdf } from "@react-pdf/renderer";
import { AssessmentPdfDocument } from "@/features/assessments/components/AssessmentPdfDocument";
import type { AssessmentWithQuestionsResponse } from "@/api/models";
import type { ExportMode } from "@/features/assessments/components/AssessmentPdfDocument";

export type { ExportMode };

export interface ExportOptions {
    mode: ExportMode;
    assessment: AssessmentWithQuestionsResponse;
}

function sanitizeFilename(title: string): string {
    return title.replace(/[:/\\*?"<>|]/g, "-");
}

function getOptionLabel(index: number): string {
    return String.fromCharCode(65 + index);
}

function formatQuestionType(type: string): string {
    if (type === "mcq") return "MCQ";
    if (type === "mrq") return "MRQ";
    if (type === "short_answer") return "Short Answer";
    return type;
}

function escapeCsvCell(value: string): string {
    return `"${value.replace(/"/g, '""')}"`;
}

function triggerDownload(url: string, filename: string): void {
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

export async function exportAssessmentAsPdf(options: ExportOptions): Promise<void> {
    const { assessment, mode } = options;
    const blob = await pdf(<AssessmentPdfDocument assessment={assessment} mode={mode} />).toBlob();
    const url = URL.createObjectURL(blob);
    const suffix = mode === "answer-sheet" ? "answer-sheet" : "assessment";
    triggerDownload(url, `${sanitizeFilename(assessment.title)}-${suffix}.pdf`);
}

export function exportAssessmentAsCsv(options: ExportOptions): void {
    const { assessment, mode } = options;
    const sortedQuestions = [...(assessment.questions ?? [])].sort((a, b) => a.order - b.order);

    const includeAnswers = mode === "answer-sheet";
    const header = ["#", "Type", "Question", "Options"];
    if (includeAnswers) header.push("Answer(s)");

    const rows: string[][] = [header];

    for (let i = 0; i < sortedQuestions.length; i++) {
        const q = sortedQuestions[i];
        const num = String(i + 1);
        const type = formatQuestionType(q.question_type);
        const questionText = q.question_text;

        let optionsText = "";
        let answerText = "";

        if (q.question_type === "mcq") {
            optionsText = q.mcq_data.options
                .map((opt, idx) => `${getOptionLabel(idx)}. ${opt}`)
                .join("\n");
            if (includeAnswers) {
                const idx = q.mcq_data.correct_index;
                answerText = `${getOptionLabel(idx)}. ${q.mcq_data.options[idx] ?? ""}`;
            }
        } else if (q.question_type === "mrq") {
            optionsText = q.mrq_data.options
                .map((opt, idx) => `${getOptionLabel(idx)}. ${opt}`)
                .join("\n");
            if (includeAnswers) {
                answerText = q.mrq_data.correct_indices
                    .map((idx) => `${getOptionLabel(idx)}. ${q.mrq_data.options[idx] ?? ""}`)
                    .join(", ");
            }
        } else {
            if (includeAnswers) {
                answerText = q.short_answer_data.correct_answer;
            }
        }

        const row = [num, type, questionText, optionsText];
        if (includeAnswers) row.push(answerText);
        rows.push(row);
    }

    const csv = rows.map((row) => row.map(escapeCsvCell).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const suffix = mode === "answer-sheet" ? "answer-sheet" : "assessment";
    triggerDownload(url, `${sanitizeFilename(assessment.title)}-${suffix}.csv`);
}
