import { useState, useMemo, useCallback, useEffect } from "react";
import { Link } from "react-router-dom";
import type { TargetSelection, ScopePathItem, Modifier } from "@/types/frontend.types";
import { ElementType, Modifier as ModifierEnum, isSelectionModifier } from "@/constants";
import { ROUTES } from "@/router/paths";
import {
    findSubtreeInCodeTree,
    reconstructTreeFromPath,
    getLoopInIterationScope,
} from "./utils/codeTreeUtils";
import { createScopePathItem } from "./utils/scopePathUtils";
import { ArgumentSelector } from "./components/ArgumentSelector";
import { BreadcrumbNavigation } from "./components/BreadcrumbNavigation";
import { ElementTypeSelector } from "./components/ElementTypeSelector";
import { FunctionSelector } from "./components/FunctionSelector";
import { ElementList } from "./components/ElementList";
import { ModifierSelector } from "./components/ModifierSelector";
import { NavigationButton } from "./components/NavigationButton";
import type { CodeInfoOutput, CodeTreeOutput, TargetElementType } from "@/api/models";

interface TargetSelectorProps {
    codeInfo: CodeInfoOutput;
    onTargetChange: (target: TargetSelection | null) => void;
    initialSelection?: TargetSelection | null;
}

interface SelectionState {
    type: TargetElementType | null;
    elementId: number | null;
    scopePath: ScopePathItem[];
    modifier: Modifier | null;
    currentTree: CodeTreeOutput;

    // Function selection stages
    functionNameSelected: string | null;
    functionLineStage: boolean;
    selectedLineNumbers: number[];

    // Loop iterations tracking
    currentLoopInIterationScope: number | null;

    // Variable multi-selection
    selectedVariableNames: string[];

    // Argument sub-selection (when modifier = "arguments")
    argumentKeys: string[] | null;

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
        argumentKeys: null,
        selectedElementData: null,
    });

    // Initialize state from initialSelection prop
    useEffect(() => {
        if (!initialSelection) return;

        // Reconstruct scope path step by step, stopping at the first invalid item
        let currentTree = codeInfo.code_tree;
        const validScopePath: ScopePathItem[] = [];
        for (const scopeItem of initialSelection.scope_path) {
            const subtree = findSubtreeInCodeTree(currentTree, scopeItem.type, scopeItem.id);
            if (!subtree) break;
            validScopePath.push(scopeItem);
            currentTree = subtree;
        }
        const scopeTruncated = validScopePath.length < initialSelection.scope_path.length;
        const scopePath = scopeTruncated ? validScopePath : initialSelection.scope_path;
        const currentLoopInIterationScope = getLoopInIterationScope(validScopePath);

        // Resets state to a partial level with no element selected, notifies parent
        const stopAt = (overrides: Partial<SelectionState> = {}) => {
            setSelectionState({
                type: null,
                elementId: null,
                scopePath,
                modifier: null,
                currentTree,
                functionNameSelected: null,
                functionLineStage: false,
                selectedLineNumbers: [],
                currentLoopInIterationScope,
                selectedVariableNames: [],
                argumentKeys: null,
                selectedElementData: null,
                ...overrides,
            });
            onTargetChange(null);
        };

        if (scopeTruncated) {
            stopAt();
            return;
        }

        if (initialSelection.type === ElementType.Function) {
            const functionNameSelected = initialSelection.name || null;
            const nameStillExists = currentTree.function_indices.some(
                (id) => codeInfo.functions[id]?.name === functionNameSelected,
            );
            if (!nameStillExists) {
                stopAt({ type: ElementType.Function });
                return;
            }

            if (Array.isArray(initialSelection.element_id)) {
                const validIds = initialSelection.element_id.filter((id) => codeInfo.functions[id]);
                if (validIds.length === 0) {
                    stopAt({
                        type: ElementType.Function,
                        functionNameSelected,
                        functionLineStage: true,
                    });
                    return;
                }
                // Preserve element_id reference if nothing was filtered — prevents infinite re-trigger
                const elementId =
                    validIds.length === initialSelection.element_id.length
                        ? (initialSelection.element_id as number[])
                        : validIds;
                setSelectionState({
                    type: ElementType.Function,
                    elementId: -1,
                    scopePath,
                    modifier: initialSelection.modifier || null,
                    currentTree,
                    functionNameSelected,
                    functionLineStage: true,
                    selectedLineNumbers: elementId,
                    currentLoopInIterationScope,
                    selectedVariableNames: [],
                    argumentKeys: initialSelection.argument_keys ?? null,
                    selectedElementData: { name: functionNameSelected || undefined },
                });
                onTargetChange(
                    elementId === initialSelection.element_id
                        ? initialSelection
                        : { ...initialSelection, element_id: elementId },
                );
            } else {
                const globalId = initialSelection.element_id as number;
                const matchingIds = currentTree.function_indices.filter(
                    (id) => codeInfo.functions[id]?.name === functionNameSelected,
                );
                const matchIndex = matchingIds.indexOf(globalId);
                if (matchIndex === -1) {
                    stopAt({
                        type: ElementType.Function,
                        functionNameSelected,
                        functionLineStage: true,
                    });
                    return;
                }
                const fn = codeInfo.functions[globalId];
                setSelectionState({
                    type: ElementType.Function,
                    elementId: matchIndex + 1,
                    scopePath,
                    modifier: initialSelection.modifier || null,
                    currentTree,
                    functionNameSelected,
                    functionLineStage: true,
                    selectedLineNumbers: [],
                    currentLoopInIterationScope,
                    selectedVariableNames: [],
                    argumentKeys: initialSelection.argument_keys ?? null,
                    selectedElementData: { globalId, name: fn.name, line_number: fn.line_number },
                });
                onTargetChange(initialSelection);
            }
        } else if (initialSelection.type === ElementType.Variable) {
            const allNames = initialSelection.name ? initialSelection.name.split(",") : [];
            const validNames = allNames.filter((name) => currentTree.variables.includes(name));
            if (validNames.length === 0) {
                stopAt({ type: ElementType.Variable });
                return;
            }
            const validName = validNames.join(",");
            setSelectionState({
                type: ElementType.Variable,
                elementId: 0,
                scopePath,
                modifier: initialSelection.modifier || null,
                currentTree,
                functionNameSelected: null,
                functionLineStage: false,
                selectedLineNumbers: [],
                currentLoopInIterationScope,
                selectedVariableNames: validNames,
                argumentKeys: null,
                selectedElementData: { name: validName },
            });
            onTargetChange(
                validName === initialSelection.name
                    ? initialSelection
                    : { ...initialSelection, name: validName },
            );
        } else {
            // Loop or Branch
            const globalId = initialSelection.element_id as number;
            const isLoop = initialSelection.type === ElementType.Loop;
            const elementId = isLoop
                ? currentTree.loop_indices.indexOf(globalId)
                : currentTree.branch_indices.indexOf(globalId);
            if (elementId === -1) {
                stopAt({ type: initialSelection.type });
                return;
            }

            const selectedElementData: SelectionState["selectedElementData"] = isLoop
                ? { globalId, line_number: codeInfo.loops[globalId].line_number }
                : (() => {
                      const b = codeInfo.branches[globalId];
                      return {
                          globalId,
                          line_number: b.line_number,
                          condition: b.condition,
                          name: b.condition,
                      };
                  })();

            setSelectionState({
                type: initialSelection.type,
                elementId,
                scopePath,
                modifier: initialSelection.modifier || null,
                currentTree,
                functionNameSelected: null,
                functionLineStage: false,
                selectedLineNumbers: [],
                currentLoopInIterationScope,
                selectedVariableNames: [],
                argumentKeys: initialSelection.argument_keys ?? null,
                selectedElementData,
            });
            onTargetChange(initialSelection);
        }
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
                argumentKeys: null,
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
                argumentKeys: null,
                selectedElementData: null,
            });
            onTargetChange(null);
        },
        [selectionState, onTargetChange],
    );

    // Handle function line selection
    const handleFunctionLineSelect = useCallback(
        (index: number) => {
            setSelectionState((prev) => {
                const functionIds = prev.currentTree.function_indices;

                if (index === -1) {
                    // "All" selected
                    const allIds = functionIds.filter(
                        (id) => codeInfo.functions[id].name === prev.functionNameSelected,
                    );

                    if (allIds.length === 0) {
                        console.error("No matching functions found");
                        return prev;
                    }

                    const target: TargetSelection = {
                        type: ElementType.Function,
                        element_id: allIds,
                        name: prev.functionNameSelected || undefined,
                        scope_path: prev.scopePath,
                    };

                    onTargetChange(target);

                    return {
                        ...prev,
                        selectedLineNumbers: allIds,
                        elementId: -1,
                        argumentKeys: null,
                        selectedElementData: {
                            name: prev.functionNameSelected || undefined,
                        },
                    };
                } else {
                    // Specific line selected (index is 1-based, adjust to 0-based)
                    const matchingFunctions = functionIds
                        .map((id) => ({ ...codeInfo.functions[id], globalId: id }))
                        .filter((f) => f.name === prev.functionNameSelected);

                    const actualIndex = index - 1;
                    if (actualIndex < 0 || actualIndex >= matchingFunctions.length) {
                        console.error("Invalid function index");
                        return prev;
                    }

                    const selectedFunc = matchingFunctions[actualIndex];

                    const target: TargetSelection = {
                        type: ElementType.Function,
                        element_id: selectedFunc.globalId,
                        name: selectedFunc.name,
                        line_number: selectedFunc.line_number,
                        scope_path: prev.scopePath,
                    };

                    onTargetChange(target);

                    return {
                        ...prev,
                        elementId: index,
                        argumentKeys: null,
                        selectedElementData: {
                            globalId: selectedFunc.globalId,
                            name: selectedFunc.name,
                            line_number: selectedFunc.line_number,
                        },
                    };
                }
            });
        },
        [codeInfo, onTargetChange],
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

            // Reset argument_keys when modifier changes away from "arguments"
            const newArgumentKeys =
                newModifier === "arguments" ? selectionState.argumentKeys : null;

            setSelectionState({
                ...selectionState,
                modifier: newModifier,
                argumentKeys: newArgumentKeys,
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

    // Handle argument key sub-selection
    const handleArgumentKeysChange = useCallback(
        (keys: string[] | null) => {
            setSelectionState((prev) => ({ ...prev, argumentKeys: keys }));

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
                    modifier: selectionState.modifier || undefined,
                    argument_keys: keys ?? undefined,
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
            argumentKeys: null,
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
                argumentKeys: null,
                selectedElementData: null,
            });

            onTargetChange(null);
        },
        [selectionState, codeInfo, onTargetChange],
    );

    // Functions matching current selection (for ArgumentSelector)
    const selectedFunctionsForArgSelector = useMemo(() => {
        if (
            selectionState.type !== ElementType.Function ||
            !selectionState.functionNameSelected ||
            selectionState.elementId === null
        ) {
            return [];
        }

        const allMatching = selectionState.currentTree.function_indices
            .filter((id) => codeInfo.functions[id].name === selectionState.functionNameSelected)
            .map((id) => codeInfo.functions[id]);

        if (selectionState.elementId === -1) return allMatching;

        const idx = selectionState.elementId - 1;
        return allMatching[idx] ? [allMatching[idx]] : [];
    }, [
        selectionState.type,
        selectionState.functionNameSelected,
        selectionState.elementId,
        selectionState.currentTree,
        codeInfo,
    ]);

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
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Target Selection</h3>
                <Link
                    to={ROUTES.KNOWN_LIMITATIONS}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-muted-foreground hover:text-foreground"
                >
                    Known limitations
                </Link>
            </div>

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

            {selectionState.modifier === "arguments" &&
                selectionState.elementId !== null &&
                selectedFunctionsForArgSelector.length > 0 && (
                    <ArgumentSelector
                        selectedFunctions={selectedFunctionsForArgSelector}
                        argumentKeys={selectionState.argumentKeys}
                        onArgumentKeysChange={handleArgumentKeysChange}
                    />
                )}

            <NavigationButton
                canNavigateInto={canNavigateInto}
                elementType={selectionState.type}
                selectedModifier={selectionState.modifier}
                onNavigateInto={handleNavigateInto}
            />
        </div>
    );
}
