import type { TargetSelection, TargetPathItem } from '../types/api.types';

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
export function flattenTarget(selection: TargetSelection): TargetPathItem[] {
  const result: TargetPathItem[] = [];

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
  const finalElement: TargetPathItem = {
    type: selection.type,
    id: Array.isArray(selection.element_id)
      ? selection.element_id
      : [selection.element_id],
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
