// UI-facing aliases for the generated AI authoring API models. The backend
// remains authoritative; normalization only adds optional defaults where the UI
// needs them. Generated models are never edited by hand.
import type {
    ApprovalRequest,
    AuthoringCapabilitiesResponse,
    AuthoringJobStatusResponse,
    AuthoringJobStatusResponseState,
    AuthoringJobSummary as ApiAuthoringJobSummary,
    AuthoringJobSubmittedResponse,
    AuthoringReviewResponse,
    AuthoringSummary,
    CodeQuestionInstance as ApiCodeQuestionInstance,
    DifficultyOutcome,
    GenerateRequest,
    GeneratedQuestionsBatch,
    GenerationMetadata as ApiGenerationMetadata,
    PreviewResponse,
    RelevanceOutcome,
    ReviewAttempt as ApiReviewAttempt,
    ReviewCheck,
    ReviewTemplate as ApiReviewTemplate,
    StoredReviewerApproval,
    SubmitAuthoringJobRequest,
    SubmitAuthoringJobRequestDifficulty,
    ValidationLimits as ApiValidationLimits,
} from "@/api/models";

export type AuthoringDifficulty = SubmitAuthoringJobRequestDifficulty;
export type AuthoringJobState = AuthoringJobStatusResponseState;
export type ApprovalDecision = StoredReviewerApproval["decision"];

export type AuthoringCapabilities = AuthoringCapabilitiesResponse;
export type CreateAuthoringJobRequest = SubmitAuthoringJobRequest;
export type CreatedAuthoringJob = AuthoringJobSubmittedResponse;
export type AuthoringApproval = StoredReviewerApproval;
export type AuthoringCheck = ReviewCheck;
export type AuthoringDifficultyOutcome = DifficultyOutcome;
export type AuthoringRelevanceOutcome = RelevanceOutcome;
export type AuthoringResult = AuthoringSummary;
export type AuthoringJob = AuthoringJobStatusResponse;
export type AuthoringJobSummary = ApiAuthoringJobSummary;
export type ReviewAttempt = ApiReviewAttempt;
export type ReviewTemplate = ApiReviewTemplate;
export type ValidationLimits = ApiValidationLimits;
export type AuthoringReview = AuthoringReviewResponse;
export type CodeQuestionInstance = ApiCodeQuestionInstance;
export type AuthoringPreview = PreviewResponse;
export type AuthoringBatch = GeneratedQuestionsBatch;
export type ApprovalInput = ApprovalRequest;
export type GenerateInput = GenerateRequest;
export type GenerationMetadata = ApiGenerationMetadata;
