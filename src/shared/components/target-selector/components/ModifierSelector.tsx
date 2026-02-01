import { getModifierLabel } from '@/constants';
import type { Modifier } from '@/types/frontend.types';

interface ModifierSelectorProps {
    availableModifiers: string[];
    selectedModifier: Modifier | null;
    onModifierSelect: (modifier: string) => void;
}

export function ModifierSelector({
    availableModifiers,
    selectedModifier,
    onModifierSelect,
}: ModifierSelectorProps) {
    if (availableModifiers.length === 0) {
        return null;
    }

    return (
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Options:
            </label>
            <div className="grid grid-cols-2 gap-2">
                {availableModifiers.map((modifier) => {
                    // Check if this modifier is selected
                    const isSelected = selectedModifier === modifier;

                    return (
                        <button
                            type="button"
                            key={modifier}
                            onClick={() => onModifierSelect(modifier)}
                            className={`p-3 border rounded-md text-sm font-medium transition-colors ${
                                isSelected
                                    ? "bg-green-100 border-green-500 text-green-700"
                                    : "bg-white border-gray-300 hover:bg-gray-50"
                            }`}
                        >
                            {getModifierLabel(modifier as Modifier)}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
