import { useState, useMemo } from "react";
import type {
    CodeInfo,
    CodeTree,
    TargetElementType,
    TargetSelection,
    ScopePathItem,
    FunctionElement,
    LoopElement,
    BranchElement,
    Modifier,
} from "../../types/api.types";

interface TargetSelectorProps {
    codeInfo: CodeInfo;
    onTargetChange: (target: TargetSelection | null) => void;
}

interface SelectionState {
    type: TargetElementType | null;
    elementId: number | null;
    scopePath: ScopePathItem[];
    modifier: Modifier | null;
    currentTree: CodeTree;

    // Function selection stages
    functionNameSelected: string | null;
    functionLineStage: boolean; // true when showing line selection
    selectedLineNumbers: number[]; // For "All" selection

    // Branch condition filter
    branchConditionSelected: "true" | "false" | null;

    // Loop iterations tracking
    loopIterationsSelected: boolean; // Track if loop_iterations is selected
    currentLoopInIterationScope: number | null; // Track which loop we're in iteration scope

    // Variable multi-selection
    selectedVariableNames: string[]; // Track multiple selected variables

    // Store selected element metadata to avoid stale lookups
    selectedElementData: {
        globalId?: number;
        name?: string;
        line_number?: number;
        condition?: string; // For branches
    } | null;
}

export function TargetSelector({ codeInfo, onTargetChange }: TargetSelectorProps) {
    const [selectionState, setSelectionState] = useState<SelectionState>({
        type: null,
        elementId: null,
        scopePath: [],
        modifier: null,
        currentTree: codeInfo.code_tree,
        functionNameSelected: null,
        functionLineStage: false,
        selectedLineNumbers: [],
        branchConditionSelected: null,
        loopIterationsSelected: false,
        currentLoopInIterationScope: null,
        selectedVariableNames: [],
        selectedElementData: null,
    });

    // Get available element types at current scope
    const availableTypes = useMemo(() => {
        const types: TargetElementType[] = [];
        const tree = selectionState.currentTree;

        if (tree.function_indices.length > 0) types.push("function");
        if (tree.loop_indices.length > 0) types.push("loop");
        if (tree.branch_indices.length > 0) types.push("branch");
        if (tree.variables.length > 0) types.push("variable");

        return types;
    }, [selectionState.currentTree]);

    // Get elements of selected type
    const availableElements = useMemo(() => {
        if (!selectionState.type) return [];

        const tree = selectionState.currentTree;

        switch (selectionState.type) {
            case "function": {
                const functionIds = tree.function_indices;

                if (!selectionState.functionLineStage) {
                    // Stage 1: Show unique function names
                    const allFunctions = functionIds.map((id) => codeInfo.functions[id]);
                    const uniqueNames = [...new Set(allFunctions.map((f) => f.name))];
                    return uniqueNames.map((name) => ({ name, isUniqueName: true }));
                } else {
                    // Stage 2: Show line numbers + "All" for selected function name
                    const matchingFunctions = functionIds
                        .map((id, localIndex) => ({
                            ...codeInfo.functions[id],
                            localIndex,
                            globalId: id,
                        }))
                        .filter((f) => f.name === selectionState.functionNameSelected);

                    // Add "All" option first
                    return [{ isAll: true, name: "All", displayText: "All" }, ...matchingFunctions];
                }
            }
            case "loop": {
                const loopIds = tree.loop_indices;
                return loopIds.map((id) => codeInfo.loops[id]);
            }
            case "branch": {
                const branchIds = tree.branch_indices;
                return branchIds.map((id) => codeInfo.branches[id]);
            }
            case "variable": {
                return tree.variables.map((v) => ({ name: v }));
            }
            default:
                return [];
        }
    }, [
        selectionState.type,
        selectionState.currentTree,
        selectionState.functionLineStage,
        selectionState.functionNameSelected,
        codeInfo,
    ]);

    // Get available modifiers/options based on selected element type
    const availableModifiers = useMemo((): string[] => {
        if (!selectionState.type || selectionState.elementId === null) return [];

        if (selectionState.type === "function") {
            // Show arguments and return_value after line selection (stage 2)
            // Including when "All" is selected (elementId === -1)
            if (selectionState.functionLineStage) {
                return ["arguments", "return_value"];
            }
        }

        if (selectionState.type === "loop") {
            return ["loop_iterations"];
        }

        if (selectionState.type === "branch") {
            // Always show branch conditions (they stay visible and can be toggled)
            return ["branch_true", "branch_false"];
        }

        return [];
    }, [
        selectionState.type,
        selectionState.elementId,
        selectionState.functionLineStage,
    ]);

    // Find the subtree for a selected element (searches from specified tree)
    const findSubtree = (
        tree: CodeTree,
        elementType: TargetElementType,
        elementId: number
    ): CodeTree | null => {
        let queue: CodeTree[] = [];
        queue.push(tree);
        while (queue.length > 0) {
            const current = queue.shift()!;
            for (const child of current.children) {
                if (child.type === elementType && child.id === elementId) {
                    return child;
                }
                queue.push(child);
            }
        }
        return null;
    };

    // Handle type selection
    const handleTypeSelect = (type: TargetElementType) => {
        setSelectionState({
            ...selectionState,
            type,
            elementId: null,
            modifier: null,
            functionNameSelected: null,
            functionLineStage: false,
            selectedLineNumbers: [],
            branchConditionSelected: null,
            loopIterationsSelected: false,
            selectedVariableNames: [],
            selectedElementData: null,
        });
        onTargetChange(null);
    };

    // Handle variable toggle (multi-select)
    const handleVariableToggle = (variableName: string) => {
        const newSelectedVariables = selectionState.selectedVariableNames.includes(variableName)
            ? selectionState.selectedVariableNames.filter((v) => v !== variableName)
            : [...selectionState.selectedVariableNames, variableName];

        setSelectionState({
            ...selectionState,
            selectedVariableNames: newSelectedVariables,
            elementId: newSelectedVariables.length > 0 ? 0 : null, // Use 0 as sentinel for multi-select
        });

        // Update target with selected variables
        if (newSelectedVariables.length > 0) {
            const target: TargetSelection = {
                type: "variable",
                element_id: 0, // Dummy ID for variables
                name: newSelectedVariables.join(","), // Store as comma-separated string
                scope_path: selectionState.scopePath,
            };
            onTargetChange(target);
        } else {
            onTargetChange(null);
        }
    };

    // Handle element selection
    const handleElementSelect = (elementId: number) => {
        const element = availableElements[elementId] as any;

        // Function Stage 1: Select function name
        if (selectionState.type === "function" && element.isUniqueName) {
            setSelectionState({
                ...selectionState,
                functionNameSelected: element.name,
                functionLineStage: true,
                elementId: null,
                modifier: null,
            });
            onTargetChange(null);
            return;
        }

        // Function Stage 2: Select line or "All"
        if (selectionState.type === "function" && selectionState.functionLineStage) {
            if (element.isAll) {
                // "All" selected - get all element IDs with this name
                const allIds = selectionState.currentTree.function_indices.filter(
                    (id) => codeInfo.functions[id].name === selectionState.functionNameSelected
                );

                const target: TargetSelection = {
                    type: "function",
                    element_id: allIds, // Array of IDs
                    name: selectionState.functionNameSelected || undefined,
                    scope_path: selectionState.scopePath,
                };

                setSelectionState({
                    ...selectionState,
                    selectedLineNumbers: allIds,
                    elementId: -1, // Sentinel for "All"
                    selectedElementData: {
                        name: selectionState.functionNameSelected || undefined,
                    },
                });

                onTargetChange(target);
                return;
            } else {
                // Specific line selected
                const target: TargetSelection = {
                    type: "function",
                    element_id: element.globalId,
                    name: element.name,
                    line_number: element.line_number,
                    scope_path: selectionState.scopePath,
                };

                setSelectionState({
                    ...selectionState,
                    elementId: elementId, // Use the actual index in availableElements
                    selectedElementData: {
                        globalId: element.globalId,
                        name: element.name,
                        line_number: element.line_number,
                    },
                });

                onTargetChange(target);
                return;
            }
        }

        // Handle other element types (loop, branch, variable)
        let name: string | undefined;
        let lineNumber: number | undefined;
        let globalId: number | undefined;
        let condition: string | undefined;

        if ("name" in element) {
            name = element.name;
            lineNumber = "line_number" in element ? (element.line_number as number) : undefined;
        } else if ("line_number" in element) {
            lineNumber = element.line_number as number;
        }

        if ("condition" in element) {
            condition = element.condition as string;
        }

        // Get global ID for loops and branches
        if (selectionState.type === "loop") {
            globalId = selectionState.currentTree.loop_indices[elementId];
        } else if (selectionState.type === "branch") {
            globalId = selectionState.currentTree.branch_indices[elementId];
        }

        const newState: SelectionState = {
            ...selectionState,
            elementId,
            modifier: null,
            selectedElementData: {
                globalId,
                name,
                line_number: lineNumber,
                condition,
            },
        };

        setSelectionState(newState);

        // Build the target selection
        const target: TargetSelection = {
            type: selectionState.type!,
            element_id: globalId !== undefined ? globalId : elementId,
            name,
            line_number: lineNumber,
            scope_path: selectionState.scopePath,
        };

        onTargetChange(target);
    };

    // Handle modifier selection
    const handleModifierSelect = (modifier: string) => {
        // Loop iterations: Toggle selection
        if (modifier === "loop_iterations") {
            setSelectionState({
                ...selectionState,
                loopIterationsSelected: !selectionState.loopIterationsSelected,
            });
            return;
        }

        // Branch conditions: Toggle selection
        if (modifier === "branch_true" || modifier === "branch_false") {
            const newCondition = modifier === "branch_true" ? "true" : "false";
            setSelectionState({
                ...selectionState,
                branchConditionSelected:
                    selectionState.branchConditionSelected === newCondition ? null : newCondition,
            });
            return;
        }

        // Regular modifiers (arguments, return_value) - Toggle selection
        const newModifier = selectionState.modifier === modifier ? null : (modifier as Modifier);

        setSelectionState({
            ...selectionState,
            modifier: newModifier,
        });

        // Update target with modifier
        if (selectionState.type && selectionState.selectedElementData) {
            const target: TargetSelection = {
                type: selectionState.type,
                element_id:
                    selectionState.selectedElementData.globalId !== undefined
                        ? selectionState.selectedElementData.globalId
                        : selectionState.elementId!,
                name: selectionState.selectedElementData.name,
                line_number: selectionState.selectedElementData.line_number,
                scope_path: selectionState.scopePath,
                modifier: newModifier || undefined,
            };

            onTargetChange(target);
        }
    };

    // Navigate into nested scope
    const handleNavigateInto = () => {
        if (!selectionState.type || !selectionState.selectedElementData) return;

        const globalElementId = selectionState.selectedElementData.globalId!;
        const subtree = findSubtree(
            selectionState.currentTree,
            selectionState.type,
            globalElementId
        );
        if (!subtree) return;

        let newScopeItem: ScopePathItem;
        let newLoopInIterationScope: number | null = null;

        if (selectionState.type === "loop" && selectionState.loopIterationsSelected) {
            // Navigate into loop's iteration scope
            newScopeItem = {
                type: "loop",
                id: globalElementId,
                line_number: selectionState.selectedElementData.line_number,
                modifier: "loop_iterations",
            };
            newLoopInIterationScope = globalElementId;
        } else if (selectionState.type === "branch") {
            // Include branch condition in scope path (if selected)
            newScopeItem = {
                type: "branch",
                id: globalElementId,
                name: selectionState.selectedElementData.condition,
                line_number: selectionState.selectedElementData.line_number,
                modifier:
                    selectionState.branchConditionSelected === "true"
                        ? "branch_true"
                        : selectionState.branchConditionSelected === "false"
                        ? "branch_false"
                        : undefined, // No condition selected
            };
        } else {
            // Normal navigation (function, loop without iterations)
            newScopeItem = {
                type: selectionState.type,
                id: globalElementId,
                name: selectionState.selectedElementData.name,
                line_number: selectionState.selectedElementData.line_number,
            };
        }

        setSelectionState({
            type: null,
            elementId: null,
            scopePath: [...selectionState.scopePath, newScopeItem],
            modifier: null,
            currentTree: subtree,
            functionNameSelected: null,
            functionLineStage: false,
            selectedLineNumbers: [],
            branchConditionSelected: null,
            loopIterationsSelected: false,
            currentLoopInIterationScope: newLoopInIterationScope,
            selectedVariableNames: [],
            selectedElementData: null,
        });

        onTargetChange(null);
    };

    // Navigate back in scope
    const handleNavigateBack = (index: number) => {
        const newScopePath = selectionState.scopePath.slice(0, index);

        // Reconstruct the tree by finding the final scope element
        let tree = codeInfo.code_tree;
        let currentLoopInIterationScope = null;

        if (newScopePath.length > 0) {
            // Get the last item in the new scope path - this is where we want to be
            const targetScope = newScopePath[newScopePath.length - 1];

            // Use findSubtree to do a deep search for this element
            const foundTree = findSubtree(tree, targetScope.type, targetScope.id);

            if (foundTree) {
                tree = foundTree;
            } else {
                console.warn("Could not find tree for scope item:", targetScope);
            }

            // Track if we're in a loop iteration scope
            for (const scopeItem of newScopePath) {
                if (scopeItem.modifier === "loop_iterations") {
                    currentLoopInIterationScope = scopeItem.id;
                }
            }
        }

        setSelectionState({
            type: null,
            elementId: null,
            scopePath: newScopePath,
            modifier: null,
            currentTree: tree,
            functionNameSelected: null,
            functionLineStage: false,
            selectedLineNumbers: [],
            branchConditionSelected: null,
            loopIterationsSelected: false,
            currentLoopInIterationScope,
            selectedVariableNames: [],
            selectedElementData: null,
        });

        onTargetChange(null);
    };

    const canNavigateInto = useMemo(() => {
        if (!selectionState.type || selectionState.elementId === null) return false;
        if (selectionState.type === "variable") return false;

        // Cannot navigate into "All" functions
        if (selectionState.type === "function" && selectionState.elementId === -1) {
            return false;
        }

        // Cannot navigate into function if arguments or return_value is selected
        if (
            selectionState.type === "function" &&
            (selectionState.modifier === "arguments" || selectionState.modifier === "return_value")
        ) {
            return false;
        }

        // Can navigate into specific function
        if (selectionState.type === "function") return true;

        // Can navigate into loop normally
        if (selectionState.type === "loop") return true;

        // Can navigate into branch
        if (selectionState.type === "branch") return true;

        return false;
    }, [selectionState.type, selectionState.elementId, selectionState.modifier]);

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold">Target Selection</h3>

            {/* Breadcrumb Navigation */}
            {selectionState.scopePath.length > 0 && (
                <div className="flex items-center space-x-2 text-sm text-gray-600 flex-wrap">
                    <button
                        type="button"
                        onClick={() => handleNavigateBack(0)}
                        className="hover:text-blue-600 font-medium"
                    >
                        Root
                    </button>
                    {selectionState.scopePath.map((scope, index) => {
                        let displayName = "";

                        // Build display name with line number
                        if (scope.type === "function") {
                            // Function: "functionName (Line X)"
                            displayName = scope.name
                                ? `${scope.name} (Line ${scope.line_number})`
                                : `function (Line ${scope.line_number})`;
                        } else if (scope.type === "branch") {
                            // Branch: "condition (Line X)"
                            displayName = scope.name
                                ? `${scope.name} (Line ${scope.line_number})`
                                : `branch (Line ${scope.line_number})`;
                        } else if (scope.type === "loop") {
                            // Loop: use name if available, otherwise "loop (Line X)"
                            displayName = scope.name || `loop (Line ${scope.line_number})`;
                        } else {
                            // Fallback for other types
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

                        return (
                            <div key={index} className="flex items-center space-x-2">
                                <span>/</span>
                                <button
                                    type="button"
                                    onClick={() => handleNavigateBack(index + 1)}
                                    className="hover:text-blue-600 font-medium"
                                >
                                    {displayName}
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Element Type Selection */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Element Type:
                </label>
                <div className="grid grid-cols-2 gap-2">
                    {availableTypes.map((type) => (
                        <button
                            type="button"
                            key={type}
                            onClick={() => handleTypeSelect(type)}
                            className={`p-3 border rounded-md text-sm font-medium transition-colors ${
                                selectionState.type === type
                                    ? "bg-blue-100 border-blue-500 text-blue-700"
                                    : "bg-white border-gray-300 hover:bg-gray-50"
                            }`}
                        >
                            {type.charAt(0).toUpperCase() + type.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Element Selection */}
            {selectionState.type === "function" && selectionState.functionLineStage ? (
                // Stage 2: Show both function names AND line numbers for selected function
                <>
                    {/* Function Name Selection - Always visible in stage 2 */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Select Function Name:
                        </label>
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                            {(() => {
                                const functionIds = selectionState.currentTree.function_indices;
                                const allFunctions = functionIds.map((id) => codeInfo.functions[id]);
                                const uniqueNames = [
                                    ...new Set(allFunctions.map((f) => f.name)),
                                ].map((name) => ({ name, isUniqueName: true }));

                                return uniqueNames.map((element, index) => (
                                    <button
                                        type="button"
                                        key={index}
                                        onClick={() => {
                                            // Re-select function name to switch
                                            setSelectionState({
                                                ...selectionState,
                                                functionNameSelected: element.name,
                                                functionLineStage: true,
                                                elementId: null,
                                                modifier: null,
                                            });
                                            onTargetChange(null);
                                        }}
                                        className={`w-full p-3 border rounded-md text-left text-sm transition-colors ${
                                            selectionState.functionNameSelected === element.name
                                                ? "bg-blue-100 border-blue-500 text-blue-700"
                                                : "bg-white border-gray-300 hover:bg-gray-50"
                                        }`}
                                    >
                                        {element.name}
                                    </button>
                                ));
                            })()}
                        </div>
                    </div>

                    {/* Line Selection for selected function */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Select Line for "{selectionState.functionNameSelected}":
                        </label>
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                            {availableElements.map((element, index) => {
                                const anyElement = element as any;
                                let displayText = "";

                                if (anyElement.isAll) {
                                    displayText = "All";
                                } else {
                                    const func = anyElement as FunctionElement;
                                    displayText = `Line ${func.line_number}${
                                        func.is_definition ? " [Definition]" : " [Call]"
                                    }`;
                                }

                                return (
                                    <button
                                        type="button"
                                        key={index}
                                        onClick={() => handleElementSelect(index)}
                                        className={`w-full p-3 border rounded-md text-left text-sm transition-colors ${
                                            selectionState.elementId === index ||
                                            (selectionState.elementId === -1 && anyElement.isAll)
                                                ? "bg-blue-100 border-blue-500 text-blue-700"
                                                : "bg-white border-gray-300 hover:bg-gray-50"
                                        }`}
                                    >
                                        {displayText}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </>
            ) : (
                // Stage 1 or non-function elements: Show single selection
                selectionState.type &&
                availableElements.length > 0 && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            {selectionState.type === "function"
                                ? "Select Function Name:"
                                : selectionState.type === "variable"
                                ? "Select Variables (multiple allowed):"
                                : `Select ${
                                      selectionState.type.charAt(0).toUpperCase() +
                                      selectionState.type.slice(1)
                                  }:`}
                        </label>
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                            {availableElements.map((element, index) => {
                                const anyElement = element as any;
                                let displayText = "";

                                if (selectionState.type === "function") {
                                    displayText = anyElement.name;
                                } else if (selectionState.type === "loop") {
                                    const loop = element as LoopElement;
                                    displayText = `${loop.loop_type} ${loop.condition} [line ${loop.line_number}]`;
                                } else if (selectionState.type === "branch") {
                                    const branch = element as BranchElement;
                                    displayText = `${branch.condition} [line ${branch.line_number}]`;
                                } else if (selectionState.type === "variable") {
                                    displayText = (element as { name: string }).name;
                                }

                                // For variables, use buttons with multi-select
                                if (selectionState.type === "variable") {
                                    const variableName = (element as { name: string }).name;
                                    const isSelected =
                                        selectionState.selectedVariableNames.includes(variableName);

                                    return (
                                        <button
                                            type="button"
                                            key={index}
                                            onClick={() => handleVariableToggle(variableName)}
                                            className={`w-full p-3 border rounded-md text-left text-sm transition-colors ${
                                                isSelected
                                                    ? "bg-blue-100 border-blue-500 text-blue-700"
                                                    : "bg-white border-gray-300 hover:bg-gray-50"
                                            }`}
                                        >
                                            {displayText}
                                        </button>
                                    );
                                }

                                // For other types, use buttons with single select
                                return (
                                    <button
                                        type="button"
                                        key={index}
                                        onClick={() => handleElementSelect(index)}
                                        className={`w-full p-3 border rounded-md text-left text-sm transition-colors ${
                                            selectionState.elementId === index
                                                ? "bg-blue-100 border-blue-500 text-blue-700"
                                                : "bg-white border-gray-300 hover:bg-gray-50"
                                        }`}
                                    >
                                        {displayText}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )
            )}

            {/* Modifier Selection */}
            {availableModifiers.length > 0 && (
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Additional Options:
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                        {availableModifiers.map((modifier) => {
                            // Check if this modifier is selected
                            const isSelected =
                                selectionState.modifier === modifier ||
                                (modifier === "loop_iterations" &&
                                    selectionState.loopIterationsSelected) ||
                                (modifier === "branch_true" &&
                                    selectionState.branchConditionSelected === "true") ||
                                (modifier === "branch_false" &&
                                    selectionState.branchConditionSelected === "false");

                            return (
                                <button
                                    type="button"
                                    key={modifier}
                                    onClick={() => handleModifierSelect(modifier)}
                                    className={`p-3 border rounded-md text-sm font-medium transition-colors ${
                                        isSelected
                                            ? "bg-green-100 border-green-500 text-green-700"
                                            : "bg-white border-gray-300 hover:bg-gray-50"
                                    }`}
                                >
                                    {modifier
                                        .split("_")
                                        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                                        .join(" ")}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Navigate Into Button */}
            {canNavigateInto && (
                <button
                    type="button"
                    onClick={handleNavigateInto}
                    className="w-full py-2 px-4 bg-purple-600 text-white font-medium rounded-md hover:bg-purple-700 transition-colors"
                >
                    {selectionState.type === "loop" && selectionState.loopIterationsSelected
                        ? `View elements inside this loop (iterations)`
                        : selectionState.type === "branch" &&
                          selectionState.branchConditionSelected !== null
                        ? `View elements inside this branch (when ${selectionState.branchConditionSelected})`
                        : `View elements inside this ${selectionState.type}`}
                </button>
            )}
        </div>
    );
}
