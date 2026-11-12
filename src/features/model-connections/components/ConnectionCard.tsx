import { Eye, KeyRound, Loader2, Pencil, RefreshCw, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { PROVIDER_LABELS, type ProviderConnection } from "../types";

interface ConnectionCardProps {
    connection: ProviderConnection;
    onEdit: () => void;
    onDelete: () => void;
    onTest: () => void;
    onToggleEnabled: (enabled: boolean) => void;
    testing: boolean;
    toggling: boolean;
}

function formatDate(value: string): string {
    return new Date(value).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
    });
}

export function ConnectionCard({
    connection,
    onEdit,
    onDelete,
    onTest,
    onToggleEnabled,
    testing,
    toggling,
}: ConnectionCardProps) {
    return (
        <Card>
            <CardHeader className="gap-2 pb-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                        <CardTitle className="flex flex-wrap items-center gap-2 text-base">
                            {connection.name}
                            <Badge variant="outline">{PROVIDER_LABELS[connection.kind]}</Badge>
                            {!connection.enabled && <Badge variant="secondary">Disabled</Badge>}
                        </CardTitle>
                        <p className="text-xs text-muted-foreground">
                            {connection.base_url ?? "Provider default endpoint"}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Label
                            htmlFor={`connection-enabled-${connection.id}`}
                            className="text-xs text-muted-foreground"
                        >
                            Enabled
                        </Label>
                        <Switch
                            id={`connection-enabled-${connection.id}`}
                            checked={connection.enabled}
                            disabled={toggling}
                            onCheckedChange={onToggleEnabled}
                            aria-label={`Enable ${connection.name}`}
                        />
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid gap-2 text-sm sm:grid-cols-2">
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <KeyRound className="h-4 w-4" aria-hidden="true" />
                        Key ending {connection.key_last4}
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Eye className="h-4 w-4" aria-hidden="true" />
                        {connection.models.length} model
                        {connection.models.length === 1 ? "" : "s"} available
                    </div>
                    <div className="text-muted-foreground">
                        Default: <span className="text-foreground">{connection.default_model}</span>
                    </div>
                    <div className="text-muted-foreground">
                        {connection.verified_at
                            ? `Verified ${formatDate(connection.verified_at)}`
                            : "Not verified yet"}
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 border-t pt-3">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={onTest}
                        disabled={testing}
                    >
                        {testing ? (
                            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                        ) : (
                            <RefreshCw className="h-4 w-4" aria-hidden="true" />
                        )}
                        {testing ? "Testing…" : "Test"}
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={onEdit}>
                        <Pencil className="h-4 w-4" aria-hidden="true" />
                        Edit
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={onDelete}
                    >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                        Delete
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
