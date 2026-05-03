interface EmptyResourceStateProps {
    title: string;
    description: string;
}

export function EmptyResourceState({ title, description }: EmptyResourceStateProps) {
    return (
        <div className="py-12 text-center text-muted-foreground">
            <p>{title}</p>
            <p className="text-sm">{description}</p>
        </div>
    );
}
