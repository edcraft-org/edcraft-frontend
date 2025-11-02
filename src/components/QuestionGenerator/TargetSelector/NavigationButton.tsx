import type { TargetElementType, Modifier } from "../../../types/api.types";

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

    if (elementType === "loop" && selectedModifier === "loop_iterations") {
        buttonText = "View elements inside this loop (iterations)";
    } else if (elementType === "branch" && selectedModifier === "branch_true") {
        buttonText = "View elements inside this branch (when true)";
    } else if (elementType === "branch" && selectedModifier === "branch_false") {
        buttonText = "View elements inside this branch (when false)";
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
