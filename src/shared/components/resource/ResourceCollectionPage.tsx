import type { ReactNode } from "react";
import { PageSkeleton } from "@/shared/components/feedback/LoadingSkeleton";
import { ResourcePageHeader } from "./ResourcePageHeader";

interface ResourcePageResource {
    title: string;
    description?: string | null;
}

interface ResourceCollectionPageMessages {
    missingResource: string;
    notFound: string;
}

interface ResourceCollectionPageProps<TResource extends ResourcePageResource> {
    resourceId?: string | null;
    resource?: TResource | null;
    isLoading: boolean;
    messages: ResourceCollectionPageMessages;
    onBack: (resource: TResource) => void;
    actions?: (resource: TResource) => ReactNode;
    children: (resource: TResource) => ReactNode;
}

function ResourcePageMessage({ children }: { children: ReactNode }) {
    return <div className="p-6 text-center text-muted-foreground">{children}</div>;
}

export function ResourceCollectionPage<TResource extends ResourcePageResource>({
    resourceId,
    resource,
    isLoading,
    messages,
    onBack,
    actions,
    children,
}: ResourceCollectionPageProps<TResource>) {
    if (!resourceId) {
        return <ResourcePageMessage>{messages.missingResource}</ResourcePageMessage>;
    }

    if (isLoading) {
        return <PageSkeleton />;
    }

    if (!resource) {
        return <ResourcePageMessage>{messages.notFound}</ResourcePageMessage>;
    }

    return (
        <div className="space-y-6 p-6">
            <ResourcePageHeader
                title={resource.title}
                description={resource.description}
                onBack={() => onBack(resource)}
                actions={actions?.(resource)}
            />

            {children(resource)}
        </div>
    );
}
