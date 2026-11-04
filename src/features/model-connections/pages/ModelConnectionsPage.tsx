import { useState } from "react";
import { AlertCircle, KeyRound, Plus, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ConnectionCard } from "../components/ConnectionCard";
import { ConnectionDialog } from "../components/ConnectionDialog";
import { getConnectionErrorMessage } from "../errors";
import {
    useDeleteProviderConnection,
    useProviderConnections,
    useTestProviderConnection,
    useUpdateProviderConnection,
} from "../hooks/useModelConnections";
import type { ProviderConnection } from "../types";

export default function ModelConnectionsPage() {
    const connectionsQuery = useProviderConnections();
    const deleteConnection = useDeleteProviderConnection();
    const testConnection = useTestProviderConnection();
    const updateConnection = useUpdateProviderConnection();

    const [dialogOpen, setDialogOpen] = useState(false);
    const [editing, setEditing] = useState<ProviderConnection | null>(null);
    const [deleting, setDeleting] = useState<ProviderConnection | null>(null);
    const [testingId, setTestingId] = useState<string | null>(null);
    const [togglingId, setTogglingId] = useState<string | null>(null);

    const openCreate = () => {
        setEditing(null);
        setDialogOpen(true);
    };

    const openEdit = (connection: ProviderConnection) => {
        setEditing(connection);
        setDialogOpen(true);
    };

    const handleTest = async (connection: ProviderConnection) => {
        setTestingId(connection.id);
        try {
            const result = await testConnection.mutateAsync(connection.id);
            toast.success(
                `${result.models.length} model${result.models.length === 1 ? "" : "s"} available.`,
            );
        } catch (error) {
            toast.error(
                getConnectionErrorMessage(error, "The connection could not be tested."),
            );
        } finally {
            setTestingId(null);
        }
    };

    const handleToggle = (connection: ProviderConnection, enabled: boolean) => {
        setTogglingId(connection.id);
        updateConnection.mutate(
            { connectionId: connection.id, input: { enabled } },
            {
                onSuccess: () => toast.success(enabled ? "Connection enabled." : "Connection disabled."),
                onError: (error) =>
                    toast.error(
                        getConnectionErrorMessage(error, "The connection could not be updated."),
                    ),
                onSettled: () => setTogglingId(null),
            },
        );
    };

    const handleDelete = async () => {
        if (!deleting) return;
        try {
            await deleteConnection.mutateAsync(deleting.id);
            toast.success("Model connection deleted.");
            setDeleting(null);
        } catch (error) {
            toast.error(
                getConnectionErrorMessage(error, "The connection could not be deleted."),
            );
        }
    };

    const connections = connectionsQuery.data ?? [];

    return (
        <div className="mx-auto w-full max-w-5xl space-y-6 p-4 md:p-6">
            <header className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h1 className="flex items-center gap-2 text-2xl font-semibold">
                        <KeyRound className="h-6 w-6" aria-hidden="true" />
                        Model connections
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Bring your own OpenAI or SocLaas key for AI question authoring.
                    </p>
                </div>
                <Button type="button" onClick={openCreate}>
                    <Plus className="h-4 w-4" aria-hidden="true" />
                    Add connection
                </Button>
            </header>

            <Alert>
                <KeyRound className="h-4 w-4" />
                <AlertTitle>Your keys stay yours</AlertTitle>
                <AlertDescription>
                    Keys are encrypted at rest and used only for your own authoring jobs.
                    The API never returns a saved key.
                </AlertDescription>
            </Alert>

            {connectionsQuery.isPending && (
                <Card>
                    <CardContent className="py-6 text-sm text-muted-foreground">
                        Loading model connections…
                    </CardContent>
                </Card>
            )}

            {connectionsQuery.isError && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Model connections could not be loaded</AlertTitle>
                    <AlertDescription className="space-y-2">
                        <p>
                            {getConnectionErrorMessage(
                                connectionsQuery.error,
                                "The model connections could not be loaded.",
                            )}
                        </p>
                        <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => void connectionsQuery.refetch()}
                        >
                            <RefreshCw className="h-4 w-4" />
                            Retry
                        </Button>
                    </AlertDescription>
                </Alert>
            )}

            {connectionsQuery.isSuccess && connections.length === 0 && (
                <Card>
                    <CardContent className="space-y-3 py-8 text-center">
                        <p className="font-medium">No model connections yet</p>
                        <p className="text-sm text-muted-foreground">
                            Add an OpenAI or SocLaas key to author questions with your own
                            models.
                        </p>
                        <Button type="button" onClick={openCreate}>
                            <Plus className="h-4 w-4" aria-hidden="true" />
                            Add your first connection
                        </Button>
                    </CardContent>
                </Card>
            )}

            {connections.length > 0 && (
                <div className="grid gap-4 md:grid-cols-2">
                    {connections.map((connection) => (
                        <ConnectionCard
                            key={connection.id}
                            connection={connection}
                            onEdit={() => openEdit(connection)}
                            onDelete={() => setDeleting(connection)}
                            onTest={() => void handleTest(connection)}
                            onToggleEnabled={(enabled) => handleToggle(connection, enabled)}
                            testing={testingId === connection.id}
                            toggling={togglingId === connection.id}
                        />
                    ))}
                </div>
            )}

            <ConnectionDialog
                key={editing?.id ?? "new"}
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                connection={editing}
            />

            <AlertDialog
                open={deleting !== null}
                onOpenChange={(open) => {
                    if (!open) setDeleting(null);
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete this connection?</AlertDialogTitle>
                        <AlertDialogDescription>
                            {deleting
                                ? `${deleting.name} will be removed. Existing jobs keep their model snapshot, but new jobs cannot use this key.`
                                : "This connection will be removed."}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => void handleDelete()}>
                            Delete connection
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
