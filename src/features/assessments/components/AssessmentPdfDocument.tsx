import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { AssessmentWithQuestionsResponse } from "@/api/models";

export type ExportMode = "assessment" | "answer-sheet";

interface AssessmentPdfDocumentProps {
    assessment: AssessmentWithQuestionsResponse;
    mode: ExportMode;
}

const styles = StyleSheet.create({
    page: {
        fontFamily: "Helvetica",
        fontSize: 10,
        paddingTop: 40,
        paddingBottom: 50,
        paddingHorizontal: 40,
        color: "#111827",
    },
    // Header
    headerRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 6,
    },
    title: {
        fontSize: 18,
        fontFamily: "Helvetica-Bold",
        flex: 1,
        marginRight: 12,
    },
    modeLabel: {
        fontSize: 9,
        color: "#6b7280",
        paddingTop: 4,
    },
    divider: {
        borderBottomWidth: 1,
        borderBottomColor: "#e5e7eb",
        marginBottom: 14,
    },
    // Questions
    questionBlock: {
        marginBottom: 14,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: "#f3f4f6",
    },
    questionHeader: {
        flexDirection: "row",
        alignItems: "flex-start",
        marginBottom: 6,
        gap: 6,
    },
    questionNumber: {
        fontFamily: "Helvetica-Bold",
        fontSize: 10,
        color: "#111827",
        minWidth: 22,
    },
    typeBadge: {
        fontSize: 8,
        color: "#6b7280",
        backgroundColor: "#f3f4f6",
        paddingHorizontal: 5,
        paddingVertical: 2,
        borderRadius: 3,
        marginTop: 1,
    },
    questionText: {
        fontSize: 10,
        flex: 1,
        lineHeight: 1.5,
    },
    optionsContainer: {
        marginLeft: 22,
        marginTop: 4,
        gap: 3,
    },
    optionRow: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 4,
        paddingVertical: 3,
        paddingHorizontal: 6,
        borderRadius: 3,
    },
    optionRowCorrect: {
        backgroundColor: "#f0fdf4",
    },
    optionLabel: {
        fontFamily: "Helvetica-Bold",
        fontSize: 9,
        minWidth: 16,
        color: "#374151",
    },
    optionLabelCorrect: {
        color: "#15803d",
    },
    optionText: {
        fontSize: 9,
        flex: 1,
        lineHeight: 1.4,
        color: "#374151",
    },
    optionTextCorrect: {
        color: "#15803d",
        fontFamily: "Helvetica-Bold",
    },
    answerSection: {
        marginLeft: 22,
        marginTop: 6,
        backgroundColor: "#f0fdf4",
        borderLeftWidth: 3,
        borderLeftColor: "#22c55e",
        paddingVertical: 5,
        paddingHorizontal: 8,
        borderRadius: 3,
    },
    answerLabel: {
        fontFamily: "Helvetica-Bold",
        fontSize: 8,
        color: "#15803d",
        marginBottom: 2,
    },
    answerText: {
        fontSize: 9,
        color: "#166534",
        lineHeight: 1.4,
    },
    answerLineRow: {
        flexDirection: "row",
        alignItems: "flex-end",
        marginLeft: 22,
        marginTop: 8,
    },
    answerLineLabel: {
        fontSize: 9,
        color: "#374151",
        marginRight: 6,
    },
    answerLine: {
        width: 150,
        borderBottomWidth: 0.5,
        borderBottomColor: "#6b7280",
        marginBottom: 2,
    },
    // Footer
    footer: {
        position: "absolute",
        bottom: 24,
        left: 40,
        right: 40,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    footerText: {
        fontSize: 8,
        color: "#9ca3af",
    },
});

function getOptionLabel(index: number): string {
    return String.fromCharCode(65 + index);
}

function formatQuestionType(type: string): string {
    if (type === "mcq") return "MCQ";
    if (type === "mrq") return "MRQ";
    if (type === "short_answer") return "Short Answer";
    return type;
}

export function AssessmentPdfDocument({ assessment, mode }: AssessmentPdfDocumentProps) {
    const sortedQuestions = [...(assessment.questions ?? [])].sort((a, b) => a.order - b.order);
    const modeLabel = mode === "answer-sheet" ? "Answer Sheet" : "Assessment";

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Header */}
                <View style={styles.headerRow}>
                    <Text style={styles.title}>{assessment.title}</Text>
                    <Text style={styles.modeLabel}>{modeLabel}</Text>
                </View>

                <View style={styles.divider} />

                {/* Questions */}
                {sortedQuestions.map((question, index) => {
                    const isMCQ = question.question_type === "mcq";
                    const isMRQ = question.question_type === "mrq";
                    const isShortAnswer = question.question_type === "short_answer";

                    const options = isMCQ
                        ? question.mcq_data.options
                        : isMRQ
                          ? question.mrq_data.options
                          : [];

                    const correctIndices = isMCQ
                        ? [question.mcq_data.correct_index]
                        : isMRQ
                          ? question.mrq_data.correct_indices
                          : [];

                    const correctAnswerText = isShortAnswer
                        ? question.short_answer_data.correct_answer
                        : "";

                    return (
                        <View key={question.id} style={styles.questionBlock} wrap={false}>
                            {/* Question header */}
                            <View style={styles.questionHeader}>
                                <Text style={styles.questionNumber}>{index + 1}.</Text>
                                <Text style={styles.typeBadge}>
                                    {formatQuestionType(question.question_type)}
                                </Text>
                                <Text style={styles.questionText}>{question.question_text}</Text>
                            </View>

                            {/* MCQ / MRQ options */}
                            {(isMCQ || isMRQ) && options.length > 0 && (
                                <View style={styles.optionsContainer}>
                                    {options.map((option, optIndex) => {
                                        const isCorrect =
                                            mode === "answer-sheet" &&
                                            correctIndices.includes(optIndex);
                                        return (
                                            <View
                                                key={optIndex}
                                                style={[
                                                    styles.optionRow,
                                                    ...(isCorrect ? [styles.optionRowCorrect] : []),
                                                ]}
                                            >
                                                <Text
                                                    style={[
                                                        styles.optionLabel,
                                                        ...(isCorrect ? [styles.optionLabelCorrect] : []),
                                                    ]}
                                                >
                                                    {getOptionLabel(optIndex)}.
                                                </Text>
                                                <Text
                                                    style={[
                                                        styles.optionText,
                                                        ...(isCorrect ? [styles.optionTextCorrect] : []),
                                                    ]}
                                                >
                                                    {option}
                                                </Text>
                                            </View>
                                        );
                                    })}
                                </View>
                            )}

                            {/* Short answer: "Answer:" label + dark grey line */}
                            {isShortAnswer && mode === "assessment" && (
                                <View style={styles.answerLineRow}>
                                    <Text style={styles.answerLineLabel}>Answer:</Text>
                                    <View style={styles.answerLine} />
                                </View>
                            )}

                            {/* Answer section for answer-sheet mode */}
                            {mode === "answer-sheet" && (
                                <>
                                    {/* MCQ/MRQ: summary of correct options */}
                                    {(isMCQ || isMRQ) && correctIndices.length > 0 && (
                                        <View style={styles.answerSection}>
                                            <Text style={styles.answerLabel}>
                                                Correct answer{correctIndices.length > 1 ? "s" : ""}:
                                            </Text>
                                            <Text style={styles.answerText}>
                                                {correctIndices
                                                    .map(
                                                        (idx) =>
                                                            `${getOptionLabel(idx)}. ${options[idx] ?? ""}`,
                                                    )
                                                    .join(",  ")}
                                            </Text>
                                        </View>
                                    )}

                                    {/* Short answer */}
                                    {isShortAnswer && (
                                        <View style={styles.answerSection}>
                                            <Text style={styles.answerLabel}>Answer:</Text>
                                            <Text style={styles.answerText}>{correctAnswerText}</Text>
                                        </View>
                                    )}
                                </>
                            )}
                        </View>
                    );
                })}

                {/* Empty state */}
                {sortedQuestions.length === 0 && (
                    <Text style={{ color: "#9ca3af", fontSize: 10 }}>No questions added yet.</Text>
                )}

                {/* Footer */}
                <View style={styles.footer} fixed>
                    <Text style={styles.footerText}>{assessment.title}</Text>
                    <Text
                        style={styles.footerText}
                        render={({ pageNumber, totalPages }) =>
                            `Page ${pageNumber} of ${totalPages}`
                        }
                    />
                </View>
            </Page>
        </Document>
    );
}
