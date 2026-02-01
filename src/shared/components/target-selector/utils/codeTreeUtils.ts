import type { CodeTree, TargetElementType } from "@/api/models";
import { Modifier } from "@/constants";
import type { ScopePathItem } from "@/types/frontend.types";

/**
 * Performs breadth-first search to find a subtree with the specified element
 * @param tree - The tree to search in
 * @param elementType - The type of element to find (function, loop, branch)
 * @param elementId - The global ID of the element
 * @returns The subtree rooted at the element, or null if not found
 */
export function findSubtreeInCodeTree(
    tree: CodeTree,
    elementType: TargetElementType,
    elementId: number
): CodeTree | null {
    const queue: CodeTree[] = [tree];

    while (queue.length > 0) {
        const current = queue.shift();

        if (!current) break;

        for (const child of current.children) {
            if (child.type === elementType && child.id === elementId) {
                return child;
            }
            queue.push(child);
        }
    }

    return null;
}

/**
 * Reconstructs the current tree state from a scope path
 * Walks through the scope path and finds the appropriate subtree
 * @param rootTree - The root code tree
 * @param scopePath - The path of nested scopes
 * @returns The tree at the current scope level
 */
export function reconstructTreeFromPath(
    rootTree: CodeTree,
    scopePath: ScopePathItem[]
): CodeTree {
    if (scopePath.length === 0) {
        return rootTree;
    }

    // Get the last item in the scope path - this is where we want to be
    const targetScope = scopePath[scopePath.length - 1];

    // Use findSubtree to do a deep search for this element
    const foundTree = findSubtreeInCodeTree(
        rootTree,
        targetScope.type,
        targetScope.id
    );

    if (!foundTree) {
        console.warn("Could not find tree for scope item:", targetScope);
        return rootTree;
    }

    return foundTree;
}

/**
 * Gets the current loop iteration scope from the scope path
 * Returns the innermost (most recent) loop with loop_iterations modifier
 * @param scopePath - The current scope path
 * @returns The loop ID if in iteration scope, null otherwise
 */
export function getLoopInIterationScope(scopePath: ScopePathItem[]): number | null {
    // Iterate backwards to find the innermost loop_iterations scope
    for (let i = scopePath.length - 1; i >= 0; i--) {
        if (scopePath[i].modifier === Modifier.LoopIterations) {
            return scopePath[i].id;
        }
    }
    return null;
}
