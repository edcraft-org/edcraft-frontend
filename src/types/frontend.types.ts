// Frontend-specific types

import type {
    TargetElementType,
    MCQResponse,
    MRQResponse,
    ShortAnswerResponse,
    CreateMCQRequest,
    CreateMRQRequest,
    CreateShortAnswerRequest,
} from "@/api/models";

// Union type for all question responses
export type QuestionResponse = MCQResponse | MRQResponse | ShortAnswerResponse;

// Union type for editable question data
export type QuestionEditorData = Omit<
    CreateMCQRequest | CreateMRQRequest | CreateShortAnswerRequest,
    "template_id"
>;

/**
 * Modifier types for target elements
 */
export type Modifier =
    | "arguments"
    | "return_value"
    | "loop_iterations"
    | "branch_true"
    | "branch_false";

/**
 * Frontend representation of a scope path item (for UI navigation)
 * This is used internally in the UI and gets transformed to TargetElement[] for API calls
 */
export interface ScopePathItem {
    type: TargetElementType;
    id: number;
    name?: string;
    line_number?: number;
    modifier?: Modifier | null;
    condition?: string;
}

/**
 * Frontend representation of target selection state (before transformation to API format)
 * This is used internally in the UI and gets transformed to TargetElement[] for API calls
 */
export interface TargetSelection {
    type: TargetElementType;
    element_id: number | number[];
    name?: string;
    line_number?: number;
    scope_path: ScopePathItem[];
    modifier?: Modifier | null;
}
