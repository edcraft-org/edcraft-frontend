import { useEffect, useState } from "react";
import { Eye, EyeOff, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { getConnectionErrorMessage } from "../errors";
import {
    useCreateProviderConnection,
    useProbeProviderConnection,
    useTestProviderConnection,
    useUpdateProviderConnection,
} from "../hooks/useModelConnections";
import {
    PROVIDER_KINDS,
    PROVIDER_LABELS,
    type DiscoveredModels,
    type ProviderConnection,
    type ProviderConnectionKind,
} from "../types";

interface ConnectionDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    connection?: ProviderConnection | null;
}

export function ConnectionDialog({
    open,
    onOpenChange,
    connection = null,
}: ConnectionDialogProps) {
    const createConnection = useCreateProviderConnection();
    const updateConnection = useUpdateProviderConnection();
    const probe = useProbeProviderConnection();
    const testStored = useTestProviderConnection();

    const [name, setName] = useState("");
    const [kind, setKind] = useState<ProviderConnectionKind>("openai");
    const [baseUrl, setBaseUrl] = useState("");
    const [apiKey, setApiKey] = useState("");
    const [defaultModel, setDefaultModel] = useState("");
    const [models, setModels] = useState<string[]>([]);
    const [showKey, setShowKey] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!open) return;
        setName(connection?.name ?? "");
        setKind(connection?.kind ?? "openai");
        setBaseUrl(connection?.base_url ?? "");
        setApiKey("");
        setDefaultModel(connection?.default_model ?? "");
        setModels(connection?.models ?? []);
        setShowKey(false);
        setError(null);
    }, [open, connection]);

    const saving = createConnection.isPending || updateConnection.isPending;
    const loadingModels = probe.isPending || testStored.isPending;
    const busy = saving || loadingModels;
    const canSave =
        name.trim().length > 0 &&
        defaultModel.trim().length > 0 &&
        (connection !== null || apiKey.trim().length > 0);

    const applyModels = (result: DiscoveredModels) => {
        setModels(result.models);
        setDefaultModel((current) => {
            if (current && result.models.includes(current)) return current;
            return result.default_model ?? result.models[0] ?? current;
        });
    };

    const handleProbe = () => {
        setError(null);
        if (!apiKey.trim() && !connection) {
            setError("Enter an API key before loading models.");
            return;
        }
        if (!apiKey.trim() && connection) {
            testStored.mutate(connection.id, {
                onSuccess: (result) => {
                    applyModels(result);
                    toast.success(
                        `${result.models.length} model${result.models.length === 1 ? "" : "s"} found.`,
                    );
                },
                onError: (cause) =>
                    setError(
                        getConnectionErrorMessage(cause, "The provider could not be reached."),
                    ),
            });
            return;
        }
        probe.mutate(
            {
                kind,
                base_url: baseUrl.trim() || null,
                api_key: apiKey.trim(),
            },
            {
                onSuccess: (result) => {
                    applyModels(result);
                    toast.success(
                        `${result.models.length} model${result.models.length === 1 ? "" : "s"} found.`,
                    );
                },
                onError: (cause) =>
                    setError(
                        getConnectionErrorMessage(cause, "The provider could not be reached."),
                    ),
            },
        );
    };

    const handleSave = () => {
        setError(null);
        if (!canSave) {
            setError("Name, API key and default model are required.");
            return;
        }
        const trimmedName = name.trim();
        const trimmedModel = defaultModel.trim();
        const trimmedUrl = baseUrl.trim() || null;

        if (!connection) {
            createConnection.mutate(
                {
                    name: trimmedName,
                    kind,
                    base_url: trimmedUrl,
                    api_key: apiKey.trim(),
                    default_model: trimmedModel,
                    models,
                },
                {
                    onSuccess: () => {
                        toast.success("Model connection added.");
                        onOpenChange(false);
                    },
                    onError: (cause) =>
                        setError(
                            getConnectionErrorMessage(cause, "The connection could not be saved."),
                        ),
                },
            );
            return;
        }

        updateConnection.mutate(
            {
                connectionId: connection.id,
                input: {
                    name: trimmedName,
                    base_url: trimmedUrl,
                    default_model: trimmedModel,
                    models,
                    ...(apiKey.trim() ? { api_key: apiKey.trim() } : {}),
                },
            },
            {
                onSuccess: () => {
                    toast.success("Model connection updated.");
                    onOpenChange(false);
                },
                onError: (cause) =>
                    setError(
                        getConnectionErrorMessage(cause, "The connection could not be saved."),
                    ),
            },
        );
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>
                        {connection ? "Edit model connection" : "Add model connection"}
                    </DialogTitle>
                    <DialogDescription>
                        Keys are encrypted at rest and are only used for your own authoring
                        jobs. They are never returned by the API.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    <div className="space-y-2">
                        <Label htmlFor="connection-name">Name</Label>
                        <Input
                            id="connection-name"
                            value={name}
                            onChange={(event) => setName(event.target.value)}
                            placeholder="Work OpenAI"
                            maxLength={120}
                        />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="connection-kind">Provider</Label>
                            <Select
                                value={kind}
                                onValueChange={(value) =>
                                    setKind(value as ProviderConnectionKind)
                                }
                                disabled={Boolean(connection)}
                            >
                                <SelectTrigger id="connection-kind" className="w-full">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {PROVIDER_KINDS.map((provider) => (
                                        <SelectItem key={provider} value={provider}>
                                            {PROVIDER_LABELS[provider]}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="connection-base-url">Base URL</Label>
                            <Input
                                id="connection-base-url"
                                value={baseUrl}
                                onChange={(event) => setBaseUrl(event.target.value)}
                                placeholder={
                                    kind === "openai"
                                        ? "https://api.openai.com/v1"
                                        : "https://your-soclaas-host/v1"
                                }
                                maxLength={500}
                            />
                        </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        {kind === "openai"
                            ? "Leave the base URL blank to use OpenAI's default endpoint."
                            : "Enter the SocLaas OpenAI-compatible base URL, usually ending in /v1."}
                    </p>

                    <div className="space-y-2">
                        <Label htmlFor="connection-api-key">
                            {connection ? "Replace API key (optional)" : "API key"}
                        </Label>
                        <div className="relative">
                            <Input
                                id="connection-api-key"
                                type={showKey ? "text" : "password"}
                                value={apiKey}
                                onChange={(event) => setApiKey(event.target.value)}
                                placeholder={
                                    connection
                                        ? `Leave blank to keep the key ending ${connection.key_last4}`
                                        : "sk-..."
                                }
                                className="pr-10"
                                autoComplete="off"
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute right-0 top-0 h-full w-10"
                                onClick={() => setShowKey((visible) => !visible)}
                                aria-label={showKey ? "Hide API key" : "Show API key"}
                            >
                                {showKey ? (
                                    <EyeOff className="h-4 w-4" />
                                ) : (
                                    <Eye className="h-4 w-4" />
                                )}
                            </Button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="connection-default-model">Default model</Label>
                        <Input
                            id="connection-default-model"
                            value={defaultModel}
                            onChange={(event) => setDefaultModel(event.target.value)}
                            placeholder="gpt-4.1-mini"
                            maxLength={120}
                        />
                        <div className="flex flex-wrap items-center gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={handleProbe}
                                disabled={busy}
                            >
                                {loadingModels ? (
                                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                                ) : (
                                    <RefreshCw className="h-4 w-4" aria-hidden="true" />
                                )}
                                {loadingModels ? "Loading models…" : "Load models"}
                            </Button>
                            {models.length > 0 && (
                                <Select value="" onValueChange={setDefaultModel}>
                                    <SelectTrigger size="sm" className="w-56">
                                        <SelectValue placeholder="Pick a discovered model" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {models.map((model) => (
                                            <SelectItem key={model} value={model}>
                                                {model}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {models.length > 0
                                ? `${models.length} model${models.length === 1 ? "" : "s"} discovered from this provider.`
                                : "Load models to discover the names this key can use."}
                        </p>
                    </div>

                    {error && (
                        <Alert variant="destructive">
                            <AlertTitle>Connection could not be saved</AlertTitle>
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}
                </div>

                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={busy}
                    >
                        Cancel
                    </Button>
                    <Button type="button" onClick={handleSave} disabled={busy || !canSave}>
                        {saving && (
                            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                        )}
                        {connection ? "Save changes" : "Add connection"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
