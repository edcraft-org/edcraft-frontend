import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CollectionPageHeaderProps {
    title: string;
    description?: string | null;
    onBack: () => void;
    actions?: ReactNode;
}

export function CollectionPageHeader({
    title,
    description,
    onBack,
    actions,
}: CollectionPageHeaderProps) {
    return (
        <header className="flex flex-wrap items-start gap-4">
            <Button variant="ghost" size="icon" onClick={onBack} aria-label="Go back">
                <ArrowLeft className="h-4 w-4" />
            </Button>

            <div className="min-w-0 flex-1">
                <h1 className="break-words text-2xl font-semibold">{title}</h1>
                {description && (
                    <p className="mt-1 break-words text-muted-foreground">{description}</p>
                )}
            </div>

            {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </header>
    );
}
