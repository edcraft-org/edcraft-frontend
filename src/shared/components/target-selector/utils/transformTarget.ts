import type { TargetSelection, ScopePathItem } from "@/types/frontend.types";
import type { TargetElement } from "@/api/models";

/**
 * Transforms the internal TargetSelection format to the API request format.
 *
 * Internal format:
 * {
 *   type: "variable",
 *   element_id: 0,
 *   name: "arr",
 *   scope_path: [
 *     { type: "loop", id: 0, line_number: 3, modifier: "loop_iterations" },
 *     { type: "branch", id: 1, name: "not swapped", line_number: 9, modifier: "branch_false" }
 *   ],
 *   modifier: undefined
 * }
 *
 * API format (flattened array):
 * [
 *   { type: "loop", id: [0], line_number: 3, modifier: "loop_iterations" },
 *   { type: "branch", id: [1], name: "not swapped", line_number: 9, modifier: "branch_false" },
 *   { type: "variable", id: [0], name: "arr" }
 * ]
 */
export function flattenTarget(selection: TargetSelection): TargetElement[] {
    const result: TargetElement[] = [];

    // Add all scope path items first (parents in the hierarchy)
    for (const scopeItem of selection.scope_path) {
        result.push({
            type: scopeItem.type,
            id: [scopeItem.id],
            name: scopeItem.name,
            line_number: scopeItem.line_number,
            modifier: scopeItem.modifier,
        });
    }

    // Add the final target element (the actual selected element)
    const finalElement: TargetElement = {
        type: selection.type,
        id: Array.isArray(selection.element_id) ? selection.element_id : [selection.element_id],
    };

    // Add optional fields only if they exist
    if (selection.name !== undefined) {
        finalElement.name = selection.name;
    }

    if (selection.line_number !== undefined) {
        finalElement.line_number = selection.line_number;
    }

    if (selection.modifier !== undefined) {
        finalElement.modifier = selection.modifier;
    }

    result.push(finalElement);

    return result;
}

/**
 * Reconstructs TargetSelection from flattened TargetElement array.
 * Reverses the flattenTarget transformation.
 *
 * API format (flattened array):
 * [
 *   { type: "loop", id: [0], line_number: 3, modifier: "loop_iterations" },
 *   { type: "branch", id: [1], name: "not swapped", line_number: 9, modifier: "branch_false" },
 *   { type: "variable", id: [0], name: "arr" }
 * ]
 *
 * Internal format:
 * {
 *   type: "variable",
 *   element_id: 0,
 *   name: "arr",
 *   scope_path: [
 *     { type: "loop", id: 0, line_number: 3, modifier: "loop_iterations" },
 *     { type: "branch", id: 1, name: "not swapped", line_number: 9, modifier: "branch_false" }
 *   ],
 *   modifier: undefined
 * }
 */
export function unflattenTarget(elements: TargetElement[]): TargetSelection {
    if (elements.length === 0) {
        throw new Error("Cannot unflatten empty target array");
    }

    // Last element is the actual target
    const finalElement = elements[elements.length - 1];

    // All previous elements form the scope path
    const scopePath: ScopePathItem[] = elements.slice(0, -1).map((elem) => ({
        type: elem.type,
        id: elem.id[0],
        name: elem.name ?? undefined,
        line_number: elem.line_number ?? undefined,
        modifier: elem.modifier ?? undefined,
    }));

    return {
        type: finalElement.type,
        element_id: finalElement.id.length === 1 ? finalElement.id[0] : finalElement.id,
        name: finalElement.name ?? undefined,
        line_number: finalElement.line_number ?? undefined,
        scope_path: scopePath,
        modifier: finalElement.modifier ?? undefined,
    };
}
