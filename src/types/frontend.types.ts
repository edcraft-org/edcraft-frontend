// Frontend-specific types

import type { TargetElementType } from "@/api/models";

// Question additional data types
export interface MultipleChoiceAdditionalData {
    options: string[];
    correct_indices: number[];
    answer?: string;
}

export interface ShortAnswerAdditionalData {
    answer: string;
}

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
