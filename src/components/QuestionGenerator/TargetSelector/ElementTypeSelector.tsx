import type { TargetElementType } from "../../../types/api.types";

interface ElementTypeSelectorProps {
    availableTypes: TargetElementType[];
    selectedType: TargetElementType | null;
    onTypeSelect: (type: TargetElementType) => void;
}

export function ElementTypeSelector({
    availableTypes,
    selectedType,
    onTypeSelect,
}: ElementTypeSelectorProps) {
    return (
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Element Type:
            </label>
            <div className="grid grid-cols-2 gap-2">
                {availableTypes.map((type) => (
                    <button
                        type="button"
                        key={type}
                        onClick={() => onTypeSelect(type)}
                        className={`p-3 border rounded-md text-sm font-medium transition-colors ${
                            selectedType === type
                                ? "bg-blue-100 border-blue-500 text-blue-700"
                                : "bg-white border-gray-300 hover:bg-gray-50"
                        }`}
                    >
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                    </button>
                ))}
            </div>
        </div>
    );
}
