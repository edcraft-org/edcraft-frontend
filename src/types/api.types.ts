// API Type Definitions
// Mirrors the backend Pydantic models

import type {
    LoopType,
    Modifier as ModifierEnum,
    OutputType as OutputTypeEnum,
    QuestionType as QuestionTypeEnum,
} from "../constants";

export interface FunctionElement {
    name: string;
    type: "function";
    line_number: number;
    parameters: string[];
    is_definition: boolean;
}

export interface LoopElement {
    type: "loop";
    line_number: number;
    loop_type: LoopType;
    condition: string;
}

export interface BranchElement {
    type: "branch";
    line_number: number;
    condition: string;
}

export interface CodeTree {
    id: number;
    type: "module" | "function" | "loop" | "branch";
    variables: string[];
    function_indices: number[];
    loop_indices: number[];
    branch_indices: number[];
    children: CodeTree[];
}

export interface CodeInfo {
    code_tree: CodeTree;
    functions: FunctionElement[];
    loops: LoopElement[];
    branches: BranchElement[];
    variables: string[];
}

export interface FormOption {
    id: string;
    label: string;
    value: string;
    description: string;
    depends_on: string | null;
}

export interface FormElement {
    element_type: string;
    label: string;
    description: string | null;
    options: FormOption[];
    is_required: boolean;
}

export interface FormSchema {
    code_info: CodeInfo;
    form_elements: FormElement[];
}

// Request/Response types for API calls

export interface AnalyseCodeRequest {
    code: string;
}

export type TargetElementType = "function" | "loop" | "branch" | "variable";
export type Modifier = ModifierEnum;

export interface ScopePathItem {
    type: TargetElementType;
    id: number;
    name?: string;
    line_number?: number;
    modifier?: Modifier;
}

export interface TargetSelection {
    type: TargetElementType;
    element_id: number | number[]; // Single ID or array for "All" functions
    name?: string;
    line_number?: number;
    scope_path: ScopePathItem[]; // breadcrumb of parent selections
    modifier?: Modifier;
}

export interface TargetPathItem {
    type: TargetElementType;
    id: number | number[]; // Single ID or array for "All" functions
    name?: string;
    line_number?: number;
    modifier?: Modifier;
}

export interface AlgorithmInput {
    entry_function: string;
    input_data: Record<string, unknown>;
}

export type OutputType = OutputTypeEnum;
export type QuestionType = QuestionTypeEnum;

export interface GenerateQuestionRequest {
    code: string;
    target: TargetPathItem[];
    output_type: OutputType;
    question_type: QuestionType;
    algorithm_input: AlgorithmInput;
    num_distractors: number;
}

export interface GenerateQuestionResponse {
    question: string;
    answer?: unknown;
    options?: unknown[] | null; // Shuffled options for MCQ/MRQ (null for short_answer)
    correct_indices?: number[] | null; // Indices of correct answers in options array (null for short_answer)
}
