// Narrow view types for the AI authoring API. The backend remains authoritative;
// these mirror the published /ai-authoring contract without exposing provider settings.

export type AuthoringDifficulty = "easy" | "medium" | "hard";
export type AuthoringDomain = "code";
export type AuthoringJobState = "queued" | "running" | "completed" | "failed";
export type ApprovalDecision = "approved" | "rejected";
export type CheckStatus = "passed" | "failed" | "error" | "skipped";

export interface AuthoringModelProfile {
    id: string;
    label: string;
    provider: string;
    model: string;
}

export interface AuthoringJudge {
    label: string;
    provider: string;
    model: string;
}

export interface AuthoringCapabilities {
    enabled_domains: string[];
    difficulty_labels: string[];
    model_profiles: AuthoringModelProfile[];
    judge: AuthoringJudge | null;
    max_quantity: number;
}

export interface CreateAuthoringJobRequest {
    domain: AuthoringDomain;
    prompt: string;
    difficulty: AuthoringDifficulty;
    num_distractors: 2 | 3;
    model_profile: string;
}

export interface CreatedAuthoringJob {
    job_id: string;
    status_url: string;
}

export interface AuthoringApproval {
    decision: ApprovalDecision;
    artifact_sha256: string;
    reviewer: string;
    note: string | null;
    decided_at: string;
}

export interface ReviewFinding {
    code: string;
    message: string;
    field: string | null;
}

export interface AuthoringCheck {
    tool: string;
    status: CheckStatus;
    advisory: boolean;
    findings: ReviewFinding[];
    error: string | null;
}

export interface AuthoringDifficultyOutcome {
    advisory: true;
    requested_difficulty: AuthoringDifficulty | null;
    estimated_difficulty: AuthoringDifficulty | null;
    confidence: number | null;
    confidence_source: string | null;
    decision: "matches" | "revise" | "advisory_mismatch" | "unavailable";
    status: "passed" | "failed" | "error";
    reason: string;
    error_code: string | null;
}

export interface AuthoringRelevanceOutcome {
    advisory: true;
    status: "assessed" | "unavailable";
    unavailable: boolean;
    score: number | null;
    threshold: number | null;
    relevant: boolean | null;
    reason: string;
    error_code: string | null;
}

export interface PublicAuthoringError {
    code: string;
    message: string;
}

export interface AuthoringSummaryCheck {
    tool: string;
    status: CheckStatus;
    advisory: boolean;
    findings: string[];
}

export interface AuthoringResult {
    status: "checked" | "needs_review" | "error";
    domain: string;
    provider: string;
    model: string;
    artifact_id: string | null;
    approval: "unreviewed";
    difficulty: AuthoringDifficultyOutcome | null;
    relevance: AuthoringRelevanceOutcome | null;
    checks: AuthoringSummaryCheck[];
    warnings: string[];
    error: PublicAuthoringError | null;
}

export interface AuthoringProgress {
    phase: string;
    attempt: number;
}

export interface AuthoringJob {
    job_id: string;
    state: AuthoringJobState;
    progress: AuthoringProgress | null;
    result: AuthoringResult | null;
    created_at: string;
    approval: AuthoringApproval | null;
    error: PublicAuthoringError | null;
}

export interface AuthoringJobSummary {
    job_id: string;
    state: AuthoringJobState;
    created_at: string;
    prompt_preview: string;
    difficulty: AuthoringDifficulty;
    approval: AuthoringApproval | null;
}

export interface ReviewRequest {
    prompt: string;
    difficulty: AuthoringDifficulty;
    num_distractors: 2 | 3;
    domain: string;
    model_profile: string;
}

export interface ReviewTemplateParameter {
    name: string;
    kind: string;
    values: unknown[];
}

export interface ReviewTemplateDistractor {
    expression: string;
    reason_template: string;
}

export interface ReviewTemplateCandidate {
    template_id: string;
    difficulty: AuthoringDifficulty;
    code: string;
    entry_function: string;
    parameters: ReviewTemplateParameter[];
    question_template: string;
    answer_target: string;
    answer_expression: string;
    distractors: ReviewTemplateDistractor[];
    question_type: "mcq";
}

export interface ReviewTemplate {
    template_id: string;
    candidate: ReviewTemplateCandidate;
    language: string;
}

export interface ReviewAttempt {
    number: number;
    candidate: ReviewTemplateCandidate | null;
    pending: string[];
    complete: boolean;
    passed: boolean;
    checks: AuthoringCheck[];
}

export interface ValidationLimits {
    validator_version: string;
    checking_mode: string;
    examples_checked: number;
    execution_calls: number;
    max_examples: number;
    max_execution_calls: number;
    timeout_seconds: number;
    seed: number;
}

export interface AuthoringReview {
    job_id: string;
    state: AuthoringJobState;
    artifact_id: string | null;
    artifact_sha256: string | null;
    library_revision: string;
    request: ReviewRequest;
    template: ReviewTemplate | null;
    checks: AuthoringCheck[];
    attempts: ReviewAttempt[];
    fixed_plan: string[];
    validation_limits: ValidationLimits | null;
    candidate: ReviewTemplateCandidate | null;
    difficulty: AuthoringDifficultyOutcome | null;
    relevance: AuthoringRelevanceOutcome | null;
    warnings: string[];
    approval: AuthoringApproval | null;
    error: PublicAuthoringError | null;
}

export interface GeneratedCodeQuestion {
    code: string;
    entry_function: string;
    inputs: Record<string, unknown>;
    question: string;
    proposed_answer: unknown;
    distractors: unknown[];
    distractor_reasons: string[];
    answer_target: string;
    question_type: "mcq";
}

export interface CodeQuestionInstance {
    template_id: string;
    artifact_id: string | null;
    seed: number;
    parameters: Record<string, unknown>;
    question: GeneratedCodeQuestion;
    requires_manual_review: boolean;
}

export interface AuthoringPreview {
    job_id: string;
    artifact_id: string;
    artifact_sha256: string;
    seed: number;
    question: CodeQuestionInstance;
}

export interface AuthoringBatch {
    format_version: string;
    job_id: string;
    artifact_id: string;
    artifact_sha256: string;
    base_seed: number;
    requested_quantity: number;
    actual_quantity: number;
    distinct_count: number;
    duplicates: number;
    questions: CodeQuestionInstance[];
    warnings: string[];
}

export interface ApprovalInput {
    artifact_sha256: string;
    decision: ApprovalDecision;
    note: string | null;
}

export interface GenerateInput {
    artifact_sha256: string;
    seed: number;
    quantity: number;
}
