import type {
    TargetElementType,
    LoopElement,
    BranchElement,
} from "../../../types/api.types";

type ElementItem = LoopElement | BranchElement | { name: string };

interface ElementListProps {
    elementType: TargetElementType;
    elements: ElementItem[];
    selectedElementId: number | null;
    selectedVariableNames?: string[];
    onElementSelect: (index: number) => void;
    onVariableToggle?: (name: string) => void;
}

export function ElementList({
    elementType,
    elements,
    selectedElementId,
    selectedVariableNames = [],
    onElementSelect,
    onVariableToggle,
}: ElementListProps) {
    if (elements.length === 0) {
        return null;
    }

    const getDisplayText = (element: ElementItem): string => {
        switch (elementType) {
            case "loop": {
                const loop = element as LoopElement;
                return `${loop.loop_type} ${loop.condition} [line ${loop.line_number}]`;
            }
            case "branch": {
                const branch = element as BranchElement;
                return `${branch.condition} [line ${branch.line_number}]`;
            }
            case "variable": {
                const variable = element as { name: string };
                return variable.name;
            }
            default:
                return String(element);
        }
    };

    const getLabel = (): string => {
        switch (elementType) {
            case "variable":
                return "Select Variable(s):";
            default:
                return `Select ${
                    elementType.charAt(0).toUpperCase() + elementType.slice(1)
                }:`;
        }
    };

    return (
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
                {getLabel()}
            </label>
            <div className="space-y-2 max-h-64 overflow-y-auto">
                {elements.map((element, index) => {
                    const displayText = getDisplayText(element);

                    // Handle variable multi-select
                    if (elementType === "variable" && onVariableToggle) {
                        const variable = element as { name: string };
                        const variableName = variable.name;
                        const isSelected = selectedVariableNames.includes(variableName);

                        return (
                            <button
                                type="button"
                                key={index}
                                onClick={() => onVariableToggle(variableName)}
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

                    // Handle single select for other types
                    return (
                        <button
                            type="button"
                            key={index}
                            onClick={() => onElementSelect(index)}
                            className={`w-full p-3 border rounded-md text-left text-sm transition-colors ${
                                selectedElementId === index
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
    );
}
