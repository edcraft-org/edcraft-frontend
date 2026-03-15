import { pdf } from "@react-pdf/renderer";
import { Packer } from "docx";
import { AssessmentPdfDocument } from "@/features/assessments/components/AssessmentPdfDocument";
import { buildAssessmentDocx } from "@/features/assessments/components/AssessmentDocxDocument";
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

export async function exportAssessmentAsDocx(options: ExportOptions): Promise<void> {
    const { assessment, mode } = options;
    const doc = buildAssessmentDocx(options);
    const blob = await Packer.toBlob(doc);
    const url = URL.createObjectURL(blob);
    const suffix = mode === "answer-sheet" ? "answer-sheet" : "assessment";
    triggerDownload(url, `${sanitizeFilename(assessment.title)}-${suffix}.docx`);
}

function escapeRtf(text: string): string {
    let result = "";
    for (const ch of text) {
        const code = ch.charCodeAt(0);
        if (ch === "\\") result += "\\\\";
        else if (ch === "{") result += "\\{";
        else if (ch === "}") result += "\\}";
        else if (code > 127) result += `\\u${code}?`;
        else result += ch;
    }
    return result;
}

function buildAssessmentRtf(options: ExportOptions): string {
    const { assessment, mode } = options;
    const sortedQuestions = [...(assessment.questions ?? [])].sort((a, b) => a.order - b.order);
    const includeAnswers = mode === "answer-sheet";

    const parts: string[] = [];

    // RTF header
    parts.push(
        "{\\rtf1\\ansi\\ansicpg1252\\deff0" +
            "{\\fonttbl{\\f0\\fswiss\\fcharset0 Arial;}}" +
            "\\paperw12240\\paperh15840\\margl1800\\margr1800\\margt1440\\margb1440" +
            "\\f0\\fs24",
    );

    for (let i = 0; i < sortedQuestions.length; i++) {
        const question = sortedQuestions[i];
        const isMCQ = question.question_type === "mcq";
        const isMRQ = question.question_type === "mrq";
        const isShortAnswer = question.question_type === "short_answer";

        const opts = isMCQ ? question.mcq_data.options : isMRQ ? question.mrq_data.options : [];
        const correctIndices = isMCQ
            ? [question.mcq_data.correct_index]
            : isMRQ
              ? question.mrq_data.correct_indices
              : [];

        // Question: "N. Question text"
        parts.push("\\pard\\sa0 " + escapeRtf(`${i + 1}. ${question.question_text}`) + "\\par");

        // MCQ / MRQ options — lowercase letter prefix, asterisk for correct in answer-sheet mode
        if ((isMCQ || isMRQ) && opts.length > 0) {
            opts.forEach((opt, optIndex) => {
                const isCorrect = includeAnswers && correctIndices.includes(optIndex);
                const label = String.fromCharCode(97 + optIndex); // a, b, c, ...
                const prefix = isCorrect ? "*" : "";
                parts.push(
                    "\\pard " +
                        (isCorrect ? "\\b " : "") +
                        escapeRtf(`${prefix}${label}. ${opt}`) +
                        (isCorrect ? "\\b0" : "") +
                        "\\par",
                );
            });
        }

        // Short answer: show answer line in answer-sheet mode
        if (isShortAnswer && includeAnswers) {
            parts.push(
                "\\pard \\b Answer:\\b0  " +
                    escapeRtf(question.short_answer_data.correct_answer) +
                    "\\par",
            );
        }

        // Blank line between questions (required by Examplify)
        parts.push("\\pard\\par");
    }

    parts.push("}");
    return parts.join("\n");
}

export function exportAssessmentAsRtf(options: ExportOptions): void {
    const { assessment, mode } = options;
    const rtf = buildAssessmentRtf(options);
    const blob = new Blob([rtf], { type: "application/rtf" });
    const url = URL.createObjectURL(blob);
    const suffix = mode === "answer-sheet" ? "answer-sheet" : "assessment";
    triggerDownload(url, `${sanitizeFilename(assessment.title)}-${suffix}.rtf`);
}
