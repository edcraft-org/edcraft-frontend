import type {
    ScopePathItem,
    TargetElementType,
    Modifier,
} from "../types/api.types";

/**
 * Metadata for a selected element
 */
interface SelectedElementData {
    globalId?: number;
    name?: string;
    line_number?: number;
    condition?: string;
}

/**
 * Creates a scope path item based on element type and selected modifier
 * @param type - The element type
 * @param elementData - Metadata about the selected element
 * @param elementId - The global element ID
 * @param modifier - The selected modifier (if any)
 * @returns A properly formatted scope path item
 */
export function createScopePathItem(
    type: TargetElementType,
    elementData: SelectedElementData,
    elementId: number,
    modifier: Modifier | null
): ScopePathItem {
    // Determine if the modifier should be included in the scope path
    // Only navigation modifiers (loop_iterations, branch_true, branch_false) are included
    const navigationModifier =
        modifier === "loop_iterations" ||
        modifier === "branch_true" ||
        modifier === "branch_false"
            ? modifier
            : undefined;

    // For branches, use condition as the name
    if (type === "branch") {
        return {
            type: "branch",
            id: elementId,
            name: elementData.condition,
            line_number: elementData.line_number,
            modifier: navigationModifier,
        };
    }

    // For other types, use the element name
    return {
        type,
        id: elementId,
        name: elementData.name,
        line_number: elementData.line_number,
        modifier: navigationModifier,
    };
}

/**
 * Formats a scope path item for display in breadcrumb navigation
 * @param scope - The scope path item
 * @returns A formatted display string
 */
export function getBreadcrumbDisplayName(scope: ScopePathItem): string {
    let displayName = "";

    // Build display name with line number
    if (scope.type === "function") {
        displayName = scope.name
            ? `${scope.name} (Line ${scope.line_number})`
            : `function (Line ${scope.line_number})`;
    } else if (scope.type === "branch") {
        displayName = scope.name
            ? `${scope.name} (Line ${scope.line_number})`
            : `branch (Line ${scope.line_number})`;
    } else if (scope.type === "loop") {
        displayName = scope.name || `loop (Line ${scope.line_number})`;
    } else {
        displayName = scope.name || `${scope.type} (Line ${scope.line_number})`;
    }

    // Add modifier suffix for special scopes
    if (scope.modifier === "loop_iterations") {
        displayName += " [iterations]";
    } else if (scope.modifier === "branch_true") {
        displayName += " [true]";
    } else if (scope.modifier === "branch_false") {
        displayName += " [false]";
    }

    return displayName;
}
