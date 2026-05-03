interface EmptyResourceStateProps {
    title: string;
    description: string;
}

export function EmptyResourceState({ title, description }: EmptyResourceStateProps) {
    return (
        <div className="rounded-lg border border-dashed p-8 text-center">
            <p className="font-medium text-muted-foreground">{title}</p>
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
    );
}
