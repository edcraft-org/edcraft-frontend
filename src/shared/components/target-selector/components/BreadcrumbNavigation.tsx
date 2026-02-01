import type { ScopePathItem } from '@/types/frontend.types';
import { getBreadcrumbDisplayName } from "../utils/scopePathUtils";

interface BreadcrumbNavigationProps {
    scopePath: ScopePathItem[];
    onNavigateBack: (index: number) => void;
}

export function BreadcrumbNavigation({
    scopePath,
    onNavigateBack,
}: BreadcrumbNavigationProps) {
    if (scopePath.length === 0) {
        return null;
    }

    return (
        <div className="flex items-center space-x-2 text-sm text-gray-600 flex-wrap">
            <button
                type="button"
                onClick={() => onNavigateBack(0)}
                className="hover:text-blue-600 font-medium"
            >
                Root
            </button>
            {scopePath.map((scope, index) => {
                const displayName = getBreadcrumbDisplayName(scope);

                return (
                    <div key={index} className="flex items-center space-x-2">
                        <span>/</span>
                        <button
                            type="button"
                            onClick={() => onNavigateBack(index + 1)}
                            className="hover:text-blue-600 font-medium"
                        >
                            {displayName}
                        </button>
                    </div>
                );
            })}
        </div>
    );
}
