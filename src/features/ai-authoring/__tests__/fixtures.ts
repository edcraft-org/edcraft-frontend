import type {
    AuthoringBatch,
    AuthoringCapabilities,
    AuthoringCheck,
    AuthoringJob,
    AuthoringPreview,
    AuthoringReview,
    CodeQuestionInstance,
} from "../types";

const digest = "a".repeat(64);

const passedTechnicalCheck: AuthoringCheck = {
    tool: "python_syntax",
    status: "passed",
    advisory: false,
    findings: [],
    error: null,
};

const failedAdvisoryCheck: AuthoringCheck = {
    tool: "difficulty_assessment",
    status: "failed",
    advisory: true,
    findings: [
        {
            code: "DIFFICULTY_MISMATCH",
            message: "Estimated difficulty is harder than requested.",
            field: "difficulty",
        },
    ],
    error: null,
};

const failedTechnicalCheck: AuthoringCheck = {
    tool: "sample_execution",
    status: "failed",
    advisory: false,
    findings: [
        {
            code: "SAMPLE_EXECUTION_FAILED",
            message: "A sampled example failed to execute.",
            field: "code",
        },
    ],
    error: null,
};

export const capabilities: AuthoringCapabilities = {
    enabled_domains: ["code"],
    difficulty_labels: ["easy", "medium", "hard"],
    model_profiles: [
        {
            id: "default",
            label: "Default authoring model",
            provider: "openai",
            model: "configured-model",
        },
    ],
    judge: {
        label: "Default judge",
        provider: "openai",
        model: "configured-judge",
    },
    max_quantity: 50,
};

export const previewInstance: CodeQuestionInstance = {
    template_id: "list-sum",
    artifact_id: "artifact-1",
    seed: 0,
    parameters: { values: [1, 2, 3] },
    question: {
        code: "def total(values):\n    return sum(values)",
        entry_function: "total",
        inputs: { values: [1, 2, 3] },
        question: "What does total([1, 2, 3]) return?",
        proposed_answer: 6,
        distractors: [5, 7],
        distractor_reasons: ["Adds only the first two values.", "Counts one extra value."],
        answer_target: "return_value",
        question_type: "mcq",
    },
    requires_manual_review: true,
};

export const preview: AuthoringPreview = {
    job_id: "job-1",
    artifact_id: "artifact-1",
    artifact_sha256: digest,
    seed: 0,
    question: previewInstance,
};

export const approvedReview: AuthoringReview = {
    job_id: "job-1",
    state: "completed",
    artifact_id: "artifact-1",
    artifact_sha256: digest,
    library_revision: "db74f1700d78bd13b3f5f10e9d89bc2f85ad2591",
    request: {
        prompt: "Write a question about summing a list.",
        difficulty: "easy",
        num_distractors: 3,
        domain: "code",
        model_profile: "default",
    },
    template: {
        template_id: "list-sum",
        language: "python",
        candidate: {
            template_id: "list-sum",
            difficulty: "easy",
            code: "def list_sum(values):\n    return sum(values)",
            entry_function: "list_sum",
            parameters: [
                {
                    name: "values",
                    kind: "number_list",
                    values: [[1, 2], [3, 4]],
                },
            ],
            question_template: "What does list_sum({values}) return?",
            answer_target: "return_value",
            answer_expression: "sum(values)",
            distractors: [
                {
                    expression: "len(values)",
                    reason_template: "Confuses the list length with its sum.",
                },
                {
                    expression: "max(values)",
                    reason_template: "Returns the largest value instead of the sum.",
                },
            ],
            question_type: "mcq",
        },
    },
    checks: [passedTechnicalCheck, failedAdvisoryCheck],
    attempts: [
        {
            number: 1,
            candidate: null,
            pending: [],
            complete: true,
            passed: true,
            checks: [passedTechnicalCheck, failedAdvisoryCheck],
        },
    ],
    fixed_plan: ["Generate a template", "Run sampled checks"],
    validation_limits: {
        validator_version: "mcp-code-template-v2",
        checking_mode: "property_based",
        examples_checked: 12,
        execution_calls: 20,
        max_examples: 25,
        max_execution_calls: 40,
        timeout_seconds: 10,
        seed: 99,
    },
    candidate: null,
    difficulty: {
        advisory: true,
        requested_difficulty: "easy",
        estimated_difficulty: "hard",
        confidence: null,
        confidence_source: null,
        decision: "advisory_mismatch",
        status: "failed",
        reason: "Estimated difficulty is harder than requested.",
        error_code: null,
    },
    relevance: {
        advisory: true,
        status: "unavailable",
        unavailable: true,
        score: null,
        threshold: null,
        relevant: null,
        reason: "Judge unavailable.",
        error_code: "ASSESSMENT_UNAVAILABLE",
    },
    warnings: ["DIFFICULTY_MISMATCH", "ADVISORY_ASSESSMENT_UNAVAILABLE"],
    approval: {
        decision: "approved",
        artifact_sha256: digest,
        reviewer: "teacher@example.com",
        note: null,
        decided_at: "2026-11-03T00:00:00Z",
    },
    error: null,
};

export const technicalFailureReview: AuthoringReview = {
    ...approvedReview,
    checks: [failedTechnicalCheck, failedAdvisoryCheck],
    attempts: [
        {
            number: 1,
            candidate: null,
            pending: [],
            complete: true,
            passed: false,
            checks: [failedTechnicalCheck, failedAdvisoryCheck],
        },
    ],
    approval: null,
    difficulty: null,
    relevance: null,
};

export const unapprovedReview: AuthoringReview = {
    ...approvedReview,
    approval: null,
};

export const completedJob: AuthoringJob = {
    job_id: "job-1",
    state: "completed",
    progress: { phase: "finalizing", attempt: 1 },
    result: {
        status: "checked",
        domain: "code",
        provider: "openai",
        model: "configured-model",
        artifact_id: "artifact-1",
        approval: "unreviewed",
        difficulty: approvedReview.difficulty,
        relevance: approvedReview.relevance,
        checks: approvedReview.checks.map((check) => ({
            tool: check.tool,
            status: check.status,
            advisory: check.advisory,
            findings: check.findings.map((finding) => finding.message),
        })),
        warnings: approvedReview.warnings,
        error: null,
    },
    created_at: "2026-11-03T00:00:00Z",
    approval: approvedReview.approval,
    error: null,
};

export const batch: AuthoringBatch = {
    format_version: "1",
    job_id: "job-1",
    artifact_id: "artifact-1",
    artifact_sha256: digest,
    base_seed: 7,
    requested_quantity: 3,
    actual_quantity: 3,
    distinct_count: 2,
    duplicates: 1,
    questions: [
        previewInstance,
        { ...previewInstance, seed: 8 },
        { ...previewInstance, seed: 9 },
    ],
    warnings: ["Finite parameter domain produced 1 duplicate."],
};
