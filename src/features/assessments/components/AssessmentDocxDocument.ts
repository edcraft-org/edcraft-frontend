import {
    Document,
    Paragraph,
    TextRun,
    HeadingLevel,
    AlignmentType,
    LevelFormat,
    UnderlineType,
    BorderStyle,
    convertInchesToTwip,
} from "docx";
import type { ExportOptions } from "@/shared/utils/assessmentExportUtils";

const GREEN = "15803d";
const GRAY = "6b7280";
const DARK = "111827";

function getOptionLabel(index: number): string {
    return String.fromCharCode(65 + index);
}

function formatQuestionType(type: string): string {
    if (type === "mcq") return "MCQ";
    if (type === "mrq") return "MRQ";
    if (type === "short_answer") return "Short Answer";
    return type;
}

export function buildAssessmentDocx(options: ExportOptions): Document {
    const { assessment, mode } = options;
    const sortedQuestions = [...(assessment.questions ?? [])].sort((a, b) => a.order - b.order);
    const modeLabel = mode === "answer-sheet" ? "Answer Sheet" : "Assessment";
    const includeAnswers = mode === "answer-sheet";

    const children: Paragraph[] = [];

    // Build per-question option numbering configs so each question's options restart at A
    const optionNumberingConfigs = sortedQuestions.map((_, i) => ({
        reference: `option-lettering-${i}`,
        levels: [
            {
                level: 0,
                format: LevelFormat.UPPER_LETTER,
                text: "%1.",
                alignment: AlignmentType.LEFT,
                style: {
                    paragraph: {
                        indent: {
                            left: convertInchesToTwip(0.75),
                            hanging: convertInchesToTwip(0.35),
                        },
                    },
                },
            },
        ],
    }));

    // Title
    children.push(
        new Paragraph({
            heading: HeadingLevel.HEADING_1,
            children: [
                new TextRun({
                    text: assessment.title,
                    bold: true,
                    color: DARK,
                    size: 36,
                }),
            ],
        }),
    );

    // Mode label
    if (modeLabel == "Answer Sheet") {
        children.push(
            new Paragraph({
                children: [
                    new TextRun({
                        text: modeLabel,
                        color: GRAY,
                        size: 20,
                    }),
                ],
                spacing: { after: 80 },
            }),
        );
    }

    // Divider
    children.push(
        new Paragraph({
            border: {
                bottom: { style: BorderStyle.SINGLE, size: 6, color: "e5e7eb" },
            },
            spacing: { after: 160 },
            children: [],
        }),
    );

    // Questions
    for (let i = 0; i < sortedQuestions.length; i++) {
        const question = sortedQuestions[i];
        const isMCQ = question.question_type === "mcq";
        const isMRQ = question.question_type === "mrq";
        const isShortAnswer = question.question_type === "short_answer";

        const options = isMCQ ? question.mcq_data.options : isMRQ ? question.mrq_data.options : [];

        const correctIndices = isMCQ
            ? [question.mcq_data.correct_index]
            : isMRQ
              ? question.mrq_data.correct_indices
              : [];

        // Question row — numbered list item
        children.push(
            new Paragraph({
                numbering: { reference: "question-numbering", level: 0 },
                children: [
                    new TextRun({
                        text: `[${formatQuestionType(question.question_type)}]  `,
                        bold: true,
                        color: GRAY,
                        size: 20,
                    }),
                    new TextRun({
                        text: question.question_text,
                        size: 20,
                        color: DARK,
                    }),
                ],
                spacing: { after: 80 },
            }),
        );

        // MCQ / MRQ options — lettered sub-list (per-question reference ensures restart at A)
        if ((isMCQ || isMRQ) && options.length > 0) {
            options.forEach((option, optIndex) => {
                const isCorrect = includeAnswers && correctIndices.includes(optIndex);
                children.push(
                    new Paragraph({
                        numbering: { reference: `option-lettering-${i}`, level: 0 },
                        children: [
                            new TextRun({
                                text: option,
                                size: 20,
                                color: isCorrect ? GREEN : "374151",
                                bold: isCorrect,
                            }),
                        ],
                        spacing: { after: 40 },
                    }),
                );
            });
        }

        // Short answer blank line (assessment mode)
        if (isShortAnswer && !includeAnswers) {
            children.push(
                new Paragraph({
                    children: [
                        new TextRun({
                            text: "Answer: ",
                            bold: true,
                            size: 20,
                            color: GRAY,
                        }),
                        new TextRun({
                            text: "                                        ",
                            underline: { type: UnderlineType.SINGLE },
                            size: 20,
                        }),
                    ],
                    indent: { left: convertInchesToTwip(0.4) },
                    spacing: { after: 80 },
                }),
            );
        }

        // Answer block (answer-sheet mode)
        if (includeAnswers) {
            if ((isMCQ || isMRQ) && correctIndices.length > 0) {
                const answersText = correctIndices
                    .map((idx) => `${getOptionLabel(idx)}. ${options[idx] ?? ""}`)
                    .join(",  ");
                children.push(
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: `Correct answer${correctIndices.length > 1 ? "s" : ""}: `,
                                bold: true,
                                color: GREEN,
                                size: 20,
                            }),
                            new TextRun({
                                text: answersText,
                                color: GREEN,
                                size: 20,
                            }),
                        ],
                        indent: { left: convertInchesToTwip(0.4) },
                        spacing: { after: 80 },
                    }),
                );
            }

            if (isShortAnswer) {
                children.push(
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: "Answer: ",
                                bold: true,
                                color: GREEN,
                                size: 20,
                            }),
                            new TextRun({
                                text: question.short_answer_data.correct_answer,
                                color: GREEN,
                                size: 20,
                            }),
                        ],
                        indent: { left: convertInchesToTwip(0.4) },
                        spacing: { after: 80 },
                    }),
                );
            }
        }

        // Spacer between questions
        children.push(new Paragraph({ children: [], spacing: { after: 120 } }));
    }

    return new Document({
        numbering: {
            config: [
                {
                    reference: "question-numbering",
                    levels: [
                        {
                            level: 0,
                            format: LevelFormat.DECIMAL,
                            text: "%1.",
                            alignment: AlignmentType.LEFT,
                            style: {
                                paragraph: {
                                    indent: {
                                        left: convertInchesToTwip(0.4),
                                        hanging: convertInchesToTwip(0.4),
                                    },
                                },
                            },
                        },
                    ],
                },
                ...optionNumberingConfigs,
            ],
        },
        sections: [
            {
                children,
            },
        ],
    });
}
