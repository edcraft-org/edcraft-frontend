import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

// Skeleton for a single card
export function CardSkeleton() {
    return (
        <Card>
            <CardHeader className="pb-2">
                <Skeleton className="h-5 w-3/4" />
            </CardHeader>
            <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3" />
            </CardContent>
        </Card>
    );
}

// Skeleton for a grid of cards
export function CardGridSkeleton({ count = 6 }: { count?: number }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: count }).map((_, i) => (
                <CardSkeleton key={i} />
            ))}
        </div>
    );
}

// Skeleton for folder tree
export function TreeSkeleton() {
    return (
        <div className="space-y-1 p-2">
            <Skeleton className="h-8 w-full" />
            <div className="pl-4 space-y-1">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <div className="pl-4 space-y-1">
                    <Skeleton className="h-8 w-full" />
                </div>
            </div>
            <Skeleton className="h-8 w-full" />
        </div>
    );
}

// Skeleton for a page header
export function PageHeaderSkeleton() {
    return (
        <div className="space-y-4">
            <Skeleton className="h-4 w-48" /> {/* Breadcrumb */}
            <div className="flex items-center justify-between">
                <Skeleton className="h-8 w-64" /> {/* Title */}
                <Skeleton className="h-10 w-32" /> {/* Action button */}
            </div>
        </div>
    );
}

// Full page skeleton
export function PageSkeleton() {
    return (
        <div className="p-6 space-y-6">
            <PageHeaderSkeleton />
            <CardGridSkeleton />
        </div>
    );
}
