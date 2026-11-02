import { api } from "@/api/client";
import type {
    ApprovalResponse as ApiApprovalResponse,
    AuthoringCapabilitiesResponse as ApiCapabilities,
    AuthoringJobStatusResponse as ApiJobStatus,
    AuthoringJobSubmittedResponse as ApiJobSubmitted,
    AuthoringJobSummary as ApiJobSummary,
    AuthoringReviewResponse as ApiReview,
    AuthoringSummary as ApiSummary,
    CheckSummary as ApiCheckSummary,
    CodeQuestionInstance as ApiCodeQuestionInstance,
    CodeTemplateCandidate as ApiCodeTemplateCandidate,
    DifficultyOutcome as ApiDifficultyOutcome,
    GeneratedQuestionsBatch as ApiBatch,
    PreviewResponse as ApiPreview,
    RelevanceOutcome as ApiRelevanceOutcome,
    ReviewAttempt as ApiReviewAttempt,
    ReviewCheck as ApiReviewCheck,
    ReviewFinding as ApiReviewFinding,
    StoredReviewerApproval as ApiApproval,
} from "@/api/models";
import type {
    ApprovalInput,
    AuthoringApproval,
    AuthoringBatch,
    AuthoringCapabilities,
    AuthoringCheck,
    AuthoringDifficultyOutcome,
    AuthoringJob,
    AuthoringJobSummary,
    AuthoringPreview,
    AuthoringRelevanceOutcome,
    AuthoringResult,
    AuthoringReview,
    AuthoringSummaryCheck,
    CodeQuestionInstance,
    CreateAuthoringJobRequest,
    CreatedAuthoringJob,
    GenerateInput,
    ReviewAttempt,
    ReviewFinding,
    ReviewTemplateCandidate,
} from "../types";

function mapCandidate(candidate: ApiCodeTemplateCandidate): ReviewTemplateCandidate {
    return {
        template_id: candidate.template_id,
        difficulty: candidate.difficulty,
        code: candidate.code,
        entry_function: candidate.entry_function,
        parameters: candidate.parameters.map((parameter) => ({
            name: parameter.name,
            kind: parameter.kind,
            values: parameter.values,
        })),
        question_template: candidate.question_template,
        answer_target: candidate.answer_target,
        answer_expression: candidate.answer_expression,
        distractors: candidate.distractors.map((distractor) => ({
            expression: distractor.expression,
            reason_template: distractor.reason_template,
        })),
        question_type: "mcq",
    };
}

function mapOptionalCandidate(
    candidate: ApiCodeTemplateCandidate | null | undefined,
): ReviewTemplateCandidate | null {
    return candidate ? mapCandidate(candidate) : null;
}

function mapApproval(approval: ApiApproval | null | undefined): AuthoringApproval | null {
    if (!approval) return null;
    return {
        decision: approval.decision,
        artifact_sha256: approval.artifact_sha256,
        reviewer: approval.reviewer,
        note: approval.note ?? null,
        decided_at: approval.decided_at,
    };
}

function mapFinding(finding: ApiReviewFinding): ReviewFinding {
    return {
        code: finding.code,
        message: finding.message,
        field: finding.field ?? null,
    };
}

function mapCheck(check: ApiReviewCheck): AuthoringCheck {
    return {
        tool: check.tool,
        status: check.status,
        advisory: check.advisory,
        findings: (check.findings ?? []).map(mapFinding),
        error: check.error ?? null,
    };
}

function mapSummaryCheck(check: ApiCheckSummary): AuthoringSummaryCheck {
    return {
        tool: check.tool,
        status: check.status,
        advisory: check.advisory ?? false,
        findings: check.findings ?? [],
    };
}

function mapDifficulty(
    outcome: ApiDifficultyOutcome | null | undefined,
): AuthoringDifficultyOutcome | null {
    if (!outcome) return null;
    return {
        advisory: true,
        requested_difficulty: outcome.requested_difficulty ?? null,
        estimated_difficulty: outcome.estimated_difficulty ?? null,
        confidence: outcome.confidence ?? null,
        confidence_source: outcome.confidence_source ?? null,
        decision: outcome.decision ?? "unavailable",
        status: outcome.status ?? "error",
        reason: outcome.reason ?? "",
        error_code: outcome.error_code ?? null,
    };
}

function mapRelevance(
    outcome: ApiRelevanceOutcome | null | undefined,
): AuthoringRelevanceOutcome | null {
    if (!outcome) return null;
    return {
        advisory: true,
        status: outcome.status ?? "unavailable",
        unavailable: outcome.unavailable ?? true,
        score: outcome.score ?? null,
        threshold: outcome.threshold ?? null,
        relevant: outcome.relevant ?? null,
        reason: outcome.reason ?? "",
        error_code: outcome.error_code ?? null,
    };
}

function mapSummary(summary: ApiSummary | null | undefined): AuthoringResult | null {
    if (!summary) return null;
    return {
        status: summary.status,
        domain: summary.domain,
        provider: summary.provider,
        model: summary.model,
        artifact_id: summary.artifact_id,
        approval: "unreviewed",
        difficulty: mapDifficulty(summary.difficulty),
        relevance: mapRelevance(summary.relevance),
        checks: (summary.checks ?? []).map(mapSummaryCheck),
        warnings: summary.warnings ?? [],
        error: summary.error ?? null,
    };
}

function mapJobSummary(summary: ApiJobSummary): AuthoringJobSummary {
    return {
        job_id: summary.job_id,
        state: summary.state,
        created_at: summary.created_at,
        prompt_preview: summary.prompt_preview,
        difficulty: summary.difficulty,
        approval: mapApproval(summary.approval),
    };
}

function mapJob(job: ApiJobStatus): AuthoringJob {
    return {
        job_id: job.job_id,
        state: job.state,
        progress: job.progress ?? null,
        result: mapSummary(job.result),
        created_at: job.created_at,
        approval: mapApproval(job.approval),
        error: job.error ?? null,
    };
}

function mapAttempt(attempt: ApiReviewAttempt): ReviewAttempt {
    return {
        number: attempt.number,
        candidate: mapOptionalCandidate(attempt.candidate),
        pending: attempt.pending ?? [],
        complete: attempt.complete,
        passed: attempt.passed,
        checks: (attempt.checks ?? []).map(mapCheck),
    };
}

function mapReview(review: ApiReview): AuthoringReview {
    return {
        job_id: review.job_id,
        state: review.state,
        artifact_id: review.artifact_id ?? null,
        artifact_sha256: review.artifact_sha256 ?? null,
        library_revision: review.library_revision,
        request: {
            prompt: review.request.prompt,
            difficulty: review.request.difficulty,
            num_distractors: review.request.num_distractors,
            domain: review.request.domain,
            model_profile: review.request.model_profile,
        },
        template: review.template
            ? {
                  template_id: review.template.template_id,
                  language: review.template.language ?? "python",
                  candidate: mapCandidate(review.template.candidate),
              }
            : null,
        checks: (review.checks ?? []).map(mapCheck),
        attempts: (review.attempts ?? []).map(mapAttempt),
        fixed_plan: review.fixed_plan ?? [],
        validation_limits: review.validation_limits ?? null,
        candidate: mapOptionalCandidate(review.candidate),
        difficulty: mapDifficulty(review.difficulty),
        relevance: mapRelevance(review.relevance),
        warnings: review.warnings ?? [],
        approval: mapApproval(review.approval),
        error: review.error ?? null,
    };
}

function mapInstance(instance: ApiCodeQuestionInstance): CodeQuestionInstance {
    return {
        template_id: instance.template_id,
        artifact_id: instance.artifact_id ?? null,
        seed: instance.seed,
        parameters: instance.parameters,
        question: {
            code: instance.question.code,
            entry_function: instance.question.entry_function,
            inputs: instance.question.inputs,
            question: instance.question.question,
            proposed_answer: instance.question.proposed_answer,
            distractors: instance.question.distractors,
            distractor_reasons: instance.question.distractor_reasons ?? [],
            answer_target: instance.question.answer_target ?? "return_value",
            question_type: "mcq",
        },
        requires_manual_review: instance.requires_manual_review ?? true,
    };
}

function mapPreview(preview: ApiPreview): AuthoringPreview {
    return {
        job_id: preview.job_id,
        artifact_id: preview.artifact_id,
        artifact_sha256: preview.artifact_sha256,
        seed: preview.seed,
        question: mapInstance(preview.question),
    };
}

function mapBatch(batch: ApiBatch): AuthoringBatch {
    return {
        format_version: batch.format_version ?? "1",
        job_id: batch.job_id,
        artifact_id: batch.artifact_id,
        artifact_sha256: batch.artifact_sha256,
        base_seed: batch.base_seed,
        requested_quantity: batch.requested_quantity,
        actual_quantity: batch.actual_quantity,
        distinct_count: batch.distinct_count,
        duplicates: batch.duplicates,
        questions: batch.questions.map(mapInstance),
        warnings: batch.warnings ?? [],
    };
}

function mapCapabilities(capabilities: ApiCapabilities): AuthoringCapabilities {
    return {
        enabled_domains: capabilities.enabled_domains,
        difficulty_labels: capabilities.difficulty_labels,
        model_profiles: capabilities.model_profiles.map((profile) => ({
            id: profile.id,
            label: profile.label,
            provider: profile.provider,
            model: profile.model,
        })),
        judge: capabilities.judge
            ? {
                  label: capabilities.judge.label,
                  provider: capabilities.judge.provider,
                  model: capabilities.judge.model,
              }
            : null,
        max_quantity: capabilities.max_quantity,
    };
}

function mapCreatedJob(job: ApiJobSubmitted): CreatedAuthoringJob {
    return { job_id: job.job_id, status_url: job.status_url };
}

function mapApprovalResponse(approval: ApiApprovalResponse): AuthoringApproval {
    return {
        decision: approval.decision,
        artifact_sha256: approval.artifact_sha256,
        reviewer: approval.reviewer,
        note: approval.note ?? null,
        decided_at: approval.decided_at,
    };
}

export async function getAuthoringCapabilities(): Promise<AuthoringCapabilities> {
    const response = await api.getCapabilitiesAiAuthoringCapabilitiesGet();
    return mapCapabilities(response.data);
}

export async function createAuthoringJob(
    request: CreateAuthoringJobRequest,
): Promise<CreatedAuthoringJob> {
    const response = await api.submitJobAiAuthoringJobsPost(request);
    return mapCreatedJob(response.data);
}

export async function listAuthoringJobs(): Promise<AuthoringJobSummary[]> {
    const response = await api.listJobsAiAuthoringJobsGet();
    return response.data.map(mapJobSummary);
}

export async function getAuthoringJob(jobId: string): Promise<AuthoringJob> {
    const response = await api.getJobAiAuthoringJobsJobIdGet(jobId);
    return mapJob(response.data);
}

export async function getAuthoringReview(jobId: string): Promise<AuthoringReview> {
    const response = await api.reviewJobAiAuthoringJobsJobIdReviewGet(jobId);
    return mapReview(response.data);
}

export async function getAuthoringPreview(
    jobId: string,
    seed: number,
): Promise<AuthoringPreview> {
    const response = await api.previewJobAiAuthoringJobsJobIdPreviewPost(jobId, { seed });
    return mapPreview(response.data);
}

export async function decideAuthoringApproval(
    jobId: string,
    input: ApprovalInput,
): Promise<AuthoringApproval> {
    const response = await api.decideJobAiAuthoringJobsJobIdApprovalPost(jobId, input);
    return mapApprovalResponse(response.data);
}

export async function generateAuthoringBatch(
    jobId: string,
    input: GenerateInput,
): Promise<AuthoringBatch> {
    const response = await api.generateJobAiAuthoringJobsJobIdGeneratePost(jobId, input);
    return mapBatch(response.data);
}
