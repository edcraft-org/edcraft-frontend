import type { TargetElementType, Modifier } from "../../../types/api.types";
import { ElementType, Modifier as ModifierEnum, isNavigationModifier } from "../../../constants";

interface NavigationButtonProps {
    canNavigateInto: boolean;
    elementType: TargetElementType | null;
    selectedModifier: Modifier | null;
    onNavigateInto: () => void;
}

export function NavigationButton({
    canNavigateInto,
    elementType,
    selectedModifier,
    onNavigateInto,
}: NavigationButtonProps) {
    if (!canNavigateInto) {
        return null;
    }

    let buttonText = `View elements inside this ${elementType}`;

    // Customize button text for navigation modifiers
    if (selectedModifier && isNavigationModifier(selectedModifier)) {
        if (elementType === ElementType.Loop && selectedModifier === ModifierEnum.LoopIterations) {
            buttonText = "View elements inside this loop (iterations)";
        } else if (elementType === ElementType.Branch && selectedModifier === ModifierEnum.BranchTrue) {
            buttonText = "View elements inside this branch (when true)";
        } else if (elementType === ElementType.Branch && selectedModifier === ModifierEnum.BranchFalse) {
            buttonText = "View elements inside this branch (when false)";
        }
    }

    return (
        <button
            type="button"
            onClick={onNavigateInto}
            className="w-full py-2 px-4 bg-purple-600 text-white font-medium rounded-md hover:bg-purple-700 transition-colors"
        >
            {buttonText}
        </button>
    );
}
