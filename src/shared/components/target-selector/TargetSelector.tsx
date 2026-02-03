import { useState, useMemo, useCallback, useEffect } from "react";
import type { TargetSelection, ScopePathItem, Modifier } from "@/types/frontend.types";
import { ElementType, Modifier as ModifierEnum, isSelectionModifier } from "@/constants";
import {
    findSubtreeInCodeTree,
    reconstructTreeFromPath,
    getLoopInIterationScope,
} from "./utils/codeTreeUtils";
import { createScopePathItem } from "./utils/scopePathUtils";
import { BreadcrumbNavigation } from "./components/BreadcrumbNavigation";
import { ElementTypeSelector } from "./components/ElementTypeSelector";
import { FunctionSelector } from "./components/FunctionSelector";
import { ElementList } from "./components/ElementList";
import { ModifierSelector } from "./components/ModifierSelector";
import { NavigationButton } from "./components/NavigationButton";
import type { CodeInfo, CodeTree, TargetElementType } from "@/api/models";

interface TargetSelectorProps {
    codeInfo: CodeInfo;
    onTargetChange: (target: TargetSelection | null) => void;
    initialSelection?: TargetSelection | null;
}

interface SelectionState {
    type: TargetElementType | null;
    elementId: number | null;
    scopePath: ScopePathItem[];
    modifier: Modifier | null;
    currentTree: CodeTree;

    // Function selection stages
    functionNameSelected: string | null;
    functionLineStage: boolean;
    selectedLineNumbers: number[];

    // Loop iterations tracking
    currentLoopInIterationScope: number | null;

    // Variable multi-selection
    selectedVariableNames: string[];

    // Store selected element metadata to avoid stale lookups
    selectedElementData: {
        globalId?: number;
        name?: string;
        line_number?: number;
        condition?: string;
    } | null;
}

export default function TargetSelector({
    codeInfo,
    onTargetChange,
    initialSelection,
}: TargetSelectorProps) {
    const [selectionState, setSelectionState] = useState<SelectionState>({
        type: null,
        elementId: null,
        scopePath: [],
        modifier: null,
        currentTree: codeInfo.code_tree,
        functionNameSelected: null,
        functionLineStage: false,
        selectedLineNumbers: [],
        currentLoopInIterationScope: null,
        selectedVariableNames: [],
        selectedElementData: null,
    });

    // Initialize state from initialSelection prop
    useEffect(() => {
        if (!initialSelection) return;

        // Reconstruct the tree at the current scope level
        const currentTree = reconstructTreeFromPath(
            codeInfo.code_tree,
            initialSelection.scope_path,
        );
        const currentLoopInIterationScope = getLoopInIterationScope(initialSelection.scope_path);

        // For branches, if initialSelection has a name, use it as the condition too
        let condition: string | undefined;
        if (initialSelection.type === ElementType.Branch && initialSelection.name) {
            condition = initialSelection.name;
        }

        // Initialize selectedElementData
        const selectedElementData: SelectionState["selectedElementData"] = {
            globalId: Array.isArray(initialSelection.element_id)
                ? undefined
                : initialSelection.element_id,
            name: initialSelection.name,
            line_number: initialSelection.line_number,
            condition,
        };

        // For functions, need to determine if it's a multi-line selection or specific line
        let functionNameSelected: string | null = null;
        let functionLineStage = false;
        let selectedLineNumbers: number[] = [];
        let elementId: number | null = null;

        if (initialSelection.type === ElementType.Function) {
            functionNameSelected = initialSelection.name || null;
            functionLineStage = true;

            if (Array.isArray(initialSelection.element_id)) {
                // Multiple functions selected (All)
                selectedLineNumbers = initialSelection.element_id;
                elementId = -1;
            } else {
                // Single function selected - find its index in the current tree
                const funcIndex = currentTree.function_indices.indexOf(initialSelection.element_id);
                elementId = funcIndex >= 0 ? funcIndex + 1 : 0; // +1 because UI uses 1-based indexing
            }
        } else if (initialSelection.type === ElementType.Variable) {
            // Variables can be multi-selected (comma-separated names)
            const selectedVariableNames = initialSelection.name
                ? initialSelection.name.split(",")
                : [];
            elementId = selectedVariableNames.length > 0 ? 0 : null;

            setSelectionState({
                type: initialSelection.type,
                elementId,
                scopePath: initialSelection.scope_path,
                modifier: initialSelection.modifier || null,
                currentTree,
                functionNameSelected: null,
                functionLineStage: false,
                selectedLineNumbers: [],
                currentLoopInIterationScope,
                selectedVariableNames,
                selectedElementData,
            });
            return;
        } else {
            // For loop/branch, find the local index in the current tree
            const globalId = initialSelection.element_id as number;

            if (initialSelection.type === ElementType.Loop) {
                elementId = currentTree.loop_indices.indexOf(globalId);
            } else if (initialSelection.type === ElementType.Branch) {
                elementId = currentTree.branch_indices.indexOf(globalId);
            }
        }

        setSelectionState({
            type: initialSelection.type,
            elementId,
            scopePath: initialSelection.scope_path,
            modifier: initialSelection.modifier || null,
            currentTree,
            functionNameSelected,
            functionLineStage,
            selectedLineNumbers,
            currentLoopInIterationScope,
            selectedVariableNames: [],
            selectedElementData,
        });

        // Notify parent of the initialized selection
        onTargetChange(initialSelection);
    }, [initialSelection, codeInfo]); // eslint-disable-line react-hooks/exhaustive-deps

    // Get available element types at current scope
    const availableTypes = useMemo(() => {
        const types: TargetElementType[] = [];
        const tree = selectionState.currentTree;

        if (tree.function_indices.length > 0) types.push(ElementType.Function);
        if (tree.loop_indices.length > 0) types.push(ElementType.Loop);
        if (tree.branch_indices.length > 0) types.push(ElementType.Branch);
        if (tree.variables.length > 0) types.push(ElementType.Variable);

        return types;
    }, [selectionState.currentTree]);

    // Get available modifiers/options based on selected element type
    const availableModifiers = useMemo((): string[] => {
        if (!selectionState.type || selectionState.elementId === null) return [];

        if (selectionState.type === ElementType.Function) {
            if (selectionState.functionLineStage) {
                return [ModifierEnum.Arguments, ModifierEnum.ReturnValue];
            }
        }

        if (selectionState.type === ElementType.Loop) {
            return [ModifierEnum.LoopIterations];
        }

        if (selectionState.type === ElementType.Branch) {
            return [ModifierEnum.BranchTrue, ModifierEnum.BranchFalse];
        }

        return [];
    }, [selectionState.type, selectionState.elementId, selectionState.functionLineStage]);

    // Get elements for non-function types
    const availableElements = useMemo(() => {
        if (!selectionState.type || selectionState.type === ElementType.Function) return [];

        const tree = selectionState.currentTree;

        switch (selectionState.type) {
            case ElementType.Loop:
                return tree.loop_indices.map((id) => codeInfo.loops[id]);
            case ElementType.Branch:
                return tree.branch_indices.map((id) => codeInfo.branches[id]);
            case ElementType.Variable:
                return tree.variables.map((v) => ({ name: v }));
            default:
                return [];
        }
    }, [selectionState.type, selectionState.currentTree, codeInfo]);

    // Handle type selection
    const handleTypeSelect = useCallback(
        (type: TargetElementType) => {
            setSelectionState({
                ...selectionState,
                type,
                elementId: null,
                modifier: null,
                functionNameSelected: null,
                functionLineStage: false,
                selectedLineNumbers: [],
                selectedVariableNames: [],
                selectedElementData: null,
            });
            onTargetChange(null);
        },
        [selectionState, onTargetChange],
    );

    // Handle function name selection
    const handleFunctionNameSelect = useCallback(
        (name: string) => {
            setSelectionState({
                ...selectionState,
                functionNameSelected: name,
                functionLineStage: true,
                elementId: null,
                modifier: null,
                selectedElementData: null,
            });
            onTargetChange(null);
        },
        [selectionState, onTargetChange],
    );

    // Handle function line selection
    const handleFunctionLineSelect = useCallback(
        (index: number) => {
            const functionIds = selectionState.currentTree.function_indices;

            if (index === -1) {
                // "All" selected
                const allIds = functionIds.filter(
                    (id) => codeInfo.functions[id].name === selectionState.functionNameSelected,
                );

                if (allIds.length === 0) {
                    console.error("No matching functions found");
                    return;
                }

                const target: TargetSelection = {
                    type: ElementType.Function,
                    element_id: allIds,
                    name: selectionState.functionNameSelected || undefined,
                    scope_path: selectionState.scopePath,
                };

                setSelectionState({
                    ...selectionState,
                    selectedLineNumbers: allIds,
                    elementId: -1,
                    selectedElementData: {
                        name: selectionState.functionNameSelected || undefined,
                    },
                });

                onTargetChange(target);
            } else {
                // Specific line selected (index is 1-based, adjust to 0-based)
                const matchingFunctions = functionIds
                    .map((id) => ({ ...codeInfo.functions[id], globalId: id }))
                    .filter((f) => f.name === selectionState.functionNameSelected);

                const actualIndex = index - 1;
                if (actualIndex < 0 || actualIndex >= matchingFunctions.length) {
                    console.error("Invalid function index");
                    return;
                }

                const selectedFunc = matchingFunctions[actualIndex];
                const target: TargetSelection = {
                    type: ElementType.Function,
                    element_id: selectedFunc.globalId,
                    name: selectedFunc.name,
                    line_number: selectedFunc.line_number,
                    scope_path: selectionState.scopePath,
                };

                setSelectionState({
                    ...selectionState,
                    elementId: index,
                    selectedElementData: {
                        globalId: selectedFunc.globalId,
                        name: selectedFunc.name,
                        line_number: selectedFunc.line_number,
                    },
                });

                onTargetChange(target);
            }
        },
        [selectionState, codeInfo, onTargetChange],
    );

    // Handle variable toggle (multi-select)
    const handleVariableToggle = useCallback(
        (variableName: string) => {
            const newSelectedVariables = selectionState.selectedVariableNames.includes(variableName)
                ? selectionState.selectedVariableNames.filter((v) => v !== variableName)
                : [...selectionState.selectedVariableNames, variableName];

            setSelectionState({
                ...selectionState,
                selectedVariableNames: newSelectedVariables,
                elementId: newSelectedVariables.length > 0 ? 0 : null,
            });

            if (newSelectedVariables.length > 0) {
                const target: TargetSelection = {
                    type: ElementType.Variable,
                    element_id: 0,
                    name: newSelectedVariables.join(","),
                    scope_path: selectionState.scopePath,
                };
                onTargetChange(target);
            } else {
                onTargetChange(null);
            }
        },
        [selectionState, onTargetChange],
    );

    // Handle element selection for loop/branch
    const handleElementSelect = useCallback(
        (elementId: number) => {
            if (!selectionState.type || selectionState.type === ElementType.Function) return;

            const element = availableElements[elementId];
            let globalId: number | undefined;
            let name: string | undefined;
            let lineNumber: number | undefined;
            let condition: string | undefined;

            if (selectionState.type === ElementType.Loop) {
                globalId = selectionState.currentTree.loop_indices[elementId];
                const loop = element as { line_number: number };
                lineNumber = loop.line_number;
            } else if (selectionState.type === ElementType.Branch) {
                globalId = selectionState.currentTree.branch_indices[elementId];
                const branch = element as { line_number: number; condition: string };
                lineNumber = branch.line_number;
                condition = branch.condition;
                name = condition;
            } else if (selectionState.type === ElementType.Variable) {
                const variable = element as { name: string };
                name = variable.name;
            }

            const selectedElementData = {
                globalId,
                name,
                line_number: lineNumber,
                condition,
            };

            setSelectionState({
                ...selectionState,
                elementId,
                modifier: null,
                selectedElementData,
            });

            const target: TargetSelection = {
                type: selectionState.type,
                element_id: globalId !== undefined ? globalId : elementId,
                name,
                line_number: lineNumber,
                scope_path: selectionState.scopePath,
            };

            onTargetChange(target);
        },
        [selectionState, availableElements, onTargetChange],
    );

    // Handle modifier selection
    const handleModifierSelect = useCallback(
        (modifier: string) => {
            // Toggle modifier selection
            const newModifier =
                selectionState.modifier === modifier ? null : (modifier as Modifier);

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
        },
        [selectionState, onTargetChange],
    );

    // Navigate into nested scope
    const handleNavigateInto = useCallback(() => {
        if (!selectionState.type || !selectionState.selectedElementData) {
            return;
        }

        const globalElementId = selectionState.selectedElementData.globalId;
        if (globalElementId === undefined) {
            console.error("Cannot navigate: no global element ID");
            return;
        }

        const subtree = findSubtreeInCodeTree(
            selectionState.currentTree,
            selectionState.type,
            globalElementId,
        );

        if (!subtree) {
            console.error("Could not find subtree for navigation");
            return;
        }

        const newScopeItem = createScopePathItem(
            selectionState.type,
            selectionState.selectedElementData,
            globalElementId,
            selectionState.modifier,
        );

        const newLoopInIterationScope =
            selectionState.type === ElementType.Loop &&
            selectionState.modifier === ModifierEnum.LoopIterations
                ? globalElementId
                : null;

        setSelectionState({
            type: null,
            elementId: null,
            scopePath: [...selectionState.scopePath, newScopeItem],
            modifier: null,
            currentTree: subtree,
            functionNameSelected: null,
            functionLineStage: false,
            selectedLineNumbers: [],
            currentLoopInIterationScope: newLoopInIterationScope,
            selectedVariableNames: [],
            selectedElementData: null,
        });

        onTargetChange(null);
    }, [selectionState, onTargetChange]);

    // Navigate back in scope
    const handleNavigateBack = useCallback(
        (index: number) => {
            const newScopePath = selectionState.scopePath.slice(0, index);
            const tree = reconstructTreeFromPath(codeInfo.code_tree, newScopePath);
            const currentLoopInIterationScope = getLoopInIterationScope(newScopePath);

            setSelectionState({
                type: null,
                elementId: null,
                scopePath: newScopePath,
                modifier: null,
                currentTree: tree,
                functionNameSelected: null,
                functionLineStage: false,
                selectedLineNumbers: [],
                currentLoopInIterationScope,
                selectedVariableNames: [],
                selectedElementData: null,
            });

            onTargetChange(null);
        },
        [selectionState, codeInfo, onTargetChange],
    );

    // Determine if navigation into scope is possible
    const canNavigateInto = useMemo(() => {
        if (!selectionState.type || selectionState.elementId === null) return false;
        if (selectionState.type === ElementType.Variable) return false;
        if (selectionState.type === ElementType.Function && selectionState.elementId === -1)
            return false;

        if (
            selectionState.type === ElementType.Function &&
            selectionState.modifier &&
            isSelectionModifier(selectionState.modifier)
        ) {
            return false;
        }

        return true;
    }, [selectionState.type, selectionState.elementId, selectionState.modifier]);

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold">Target Selection</h3>

            <BreadcrumbNavigation
                scopePath={selectionState.scopePath}
                onNavigateBack={handleNavigateBack}
            />

            <ElementTypeSelector
                availableTypes={availableTypes}
                selectedType={selectionState.type}
                onTypeSelect={handleTypeSelect}
            />

            {selectionState.type === ElementType.Function && (
                <FunctionSelector
                    codeInfo={codeInfo}
                    functionIndices={selectionState.currentTree.function_indices}
                    functionNameSelected={selectionState.functionNameSelected}
                    selectedElementId={selectionState.elementId}
                    onFunctionNameSelect={handleFunctionNameSelect}
                    onFunctionLineSelect={handleFunctionLineSelect}
                />
            )}

            {selectionState.type && selectionState.type !== ElementType.Function && (
                <ElementList
                    elementType={selectionState.type}
                    elements={availableElements}
                    selectedElementId={selectionState.elementId}
                    selectedVariableNames={selectionState.selectedVariableNames}
                    onElementSelect={handleElementSelect}
                    onVariableToggle={
                        selectionState.type === ElementType.Variable
                            ? handleVariableToggle
                            : undefined
                    }
                />
            )}

            <ModifierSelector
                availableModifiers={availableModifiers}
                selectedModifier={selectionState.modifier}
                onModifierSelect={handleModifierSelect}
            />

            <NavigationButton
                canNavigateInto={canNavigateInto}
                elementType={selectionState.type}
                selectedModifier={selectionState.modifier}
                onNavigateInto={handleNavigateInto}
            />
        </div>
    );
}
