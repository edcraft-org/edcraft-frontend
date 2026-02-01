import type {
    TargetElementType,
    ScopePathItem,
    FunctionElement,
    LoopElement,
    BranchElement,
    Modifier,
    CodeTree,
    CodeInfo,
    TargetSelection,
} from '@/types/frontend.types';
import { ElementType } from "../../../../constants";

/**
 * Discriminated union for available elements in the selection list
 * This replaces the unsafe `as any` casts with proper type checking
 */
export type AvailableElement =
    | { kind: "function_name"; name: string }
    | { kind: "function_all"; name: string }
    | {
          kind: "function_line";
          element: FunctionElement;
          globalId: number;
          localIndex: number;
      }
    | { kind: "loop"; element: LoopElement; globalId: number }
    | { kind: "branch"; element: BranchElement; globalId: number }
    | { kind: "variable"; name: string };

/**
 * Discriminated union for element-type-specific state
 * This separates concerns and makes it clear which state is valid for which type
 */
export type ElementTypeState =
    | {
          type: typeof ElementType.Function;
          nameSelected: string | null;
          lineStage: boolean;
          selectedLineNumbers: number[];
      }
    | { type: typeof ElementType.Branch; conditionSelected: "true" | "false" | null }
    | {
          type: typeof ElementType.Loop;
          iterationsSelected: boolean;
          currentLoopInScope: number | null;
      }
    | { type: typeof ElementType.Variable; selectedNames: string[] }
    | { type: null };

/**
 * Element selection state using discriminated unions instead of sentinel values
 */
export type ElementSelection =
    | { kind: "none" }
    | { kind: "single"; elementId: number }
    | { kind: "multiple"; elementIds: number[] }
    | { kind: "all"; name: string; elementIds: number[] };

/**
 * Stored metadata for selected element to avoid stale lookups
 */
export interface SelectedElementData {
    globalId?: number;
    name?: string;
    line_number?: number;
    condition?: string;
}

/**
 * Main selection state structure
 */
export interface SelectionState {
    // Current element type being selected
    type: TargetElementType | null;

    // Element selection state (replaces raw elementId)
    selection: ElementSelection;

    // Navigation state
    scopePath: ScopePathItem[];
    currentTree: CodeTree;

    // Element-type-specific state
    typeState: ElementTypeState;

    // Modifier for current selection
    modifier: Modifier | null;

    // Cached element data
    selectedElementData: SelectedElementData | null;
}

/**
 * Actions for state reducer
 */
export type SelectionAction =
    | { type: "SELECT_ELEMENT_TYPE"; elementType: TargetElementType }
    | { type: "SELECT_FUNCTION_NAME"; name: string }
    | {
          type: "SELECT_FUNCTION_LINE";
          element: FunctionElement;
          globalId: number;
          lineNumber: number;
      }
    | { type: "SELECT_FUNCTION_ALL"; name: string; elementIds: number[] }
    | {
          type: "SELECT_LOOP";
          element: LoopElement;
          globalId: number;
          elementId: number;
      }
    | {
          type: "SELECT_BRANCH";
          element: BranchElement;
          globalId: number;
          elementId: number;
      }
    | { type: "TOGGLE_VARIABLE"; name: string }
    | { type: "SELECT_MODIFIER"; modifier: Modifier | null }
    | { type: "TOGGLE_LOOP_ITERATIONS" }
    | { type: "TOGGLE_BRANCH_CONDITION"; condition: "true" | "false" | null }
    | {
          type: "NAVIGATE_INTO";
          newScopeItem: ScopePathItem;
          newTree: CodeTree;
          newLoopInScope: number | null;
      }
    | { type: "NAVIGATE_BACK"; index: number; newTree: CodeTree };

/**
 * Props for the main TargetSelector component
 */
export interface TargetSelectorProps {
    codeInfo: CodeInfo;
    onTargetChange: (target: TargetSelection | null) => void;
}
