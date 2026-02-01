import type { CodeInfo } from "@/api/models";
import { useMemo } from "react";

interface FunctionSelectorProps {
    codeInfo: CodeInfo;
    functionIndices: number[];
    functionNameSelected: string | null;
    selectedElementId: number | null;
    onFunctionNameSelect: (name: string) => void;
    onFunctionLineSelect: (index: number) => void;
}

export function FunctionSelector({
    codeInfo,
    functionIndices,
    functionNameSelected,
    selectedElementId,
    onFunctionNameSelect,
    onFunctionLineSelect,
}: FunctionSelectorProps) {
    // Get unique function names
    const uniqueFunctionNames = useMemo(() => {
        const allFunctions = functionIndices.map((id) => codeInfo.functions[id]);
        return [...new Set(allFunctions.map((f) => f.name))];
    }, [functionIndices, codeInfo.functions]);

    // Get matching function lines for selected name
    const matchingFunctionLines = useMemo(() => {
        if (!functionNameSelected) return [];

        return functionIndices
            .map((id, localIndex) => ({
                ...codeInfo.functions[id],
                localIndex,
                globalId: id,
            }))
            .filter((f) => f.name === functionNameSelected);
    }, [functionIndices, functionNameSelected, codeInfo.functions]);

    return (
        <>
            {/* Function Name Selection */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Function Name:
                </label>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                    {uniqueFunctionNames.map((name, index) => (
                        <button
                            type="button"
                            key={index}
                            onClick={() => onFunctionNameSelect(name)}
                            className={`w-full p-3 border rounded-md text-left text-sm transition-colors ${
                                functionNameSelected === name
                                    ? "bg-blue-100 border-blue-500 text-blue-700"
                                    : "bg-white border-gray-300 hover:bg-gray-50"
                            }`}
                        >
                            {name}
                        </button>
                    ))}
                </div>
            </div>

            {/* Line Selection - only shown when a function name is selected */}
            {functionNameSelected && (
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Select Line for "{functionNameSelected}":
                    </label>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                        {/* "All" option */}
                        <button
                            type="button"
                            onClick={() => onFunctionLineSelect(-1)}
                            className={`w-full p-3 border rounded-md text-left text-sm transition-colors ${
                                selectedElementId === -1
                                    ? "bg-blue-100 border-blue-500 text-blue-700"
                                    : "bg-white border-gray-300 hover:bg-gray-50"
                            }`}
                        >
                            All
                        </button>
                        {/* Individual function lines */}
                        {matchingFunctionLines.map((func, index) => {
                            const displayText = `Line ${func.line_number}${
                                func.is_definition ? " [Definition]" : " [Call]"
                            }`;

                            return (
                                <button
                                    type="button"
                                    key={index}
                                    onClick={() => onFunctionLineSelect(index + 1)}
                                    className={`w-full p-3 border rounded-md text-left text-sm transition-colors ${
                                        selectedElementId === index + 1
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
            )}
        </>
    );
}
