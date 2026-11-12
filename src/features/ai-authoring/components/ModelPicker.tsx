import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import type { ProviderConnection } from "@/features/model-connections/types";
import { PROVIDER_LABELS } from "@/features/model-connections/types";
import {
    connectionModel,
    connectionSource,
    INHERIT_SOURCE,
    parseModelSource,
} from "../modelSelection";
import type { AuthoringModelProfile } from "../types";

interface ModelPickerProps {
    connections: ProviderConnection[];
    profiles: AuthoringModelProfile[];
    source: string;
    model: string;
    onSourceChange: (source: string, model: string) => void;
    onModelChange: (model: string) => void;
    disabled?: boolean;
    idPrefix?: string;
    sourceError?: string;
    modelError?: string;
    label?: string;
    /** Offer an explicit "use the question model" choice for advisory checks. */
    allowInherit?: boolean;
    inheritLabel?: string;
}

/**
 * One model picker for both user-owned connections and legacy server profiles.
 * Values are encoded as `connection:<id>` or `profile:<id>` so the form keeps
 * a single accessible select while the two domains stay distinct.
 */
export function ModelPicker({
    connections,
    profiles,
    source,
    model,
    onSourceChange,
    onModelChange,
    disabled = false,
    idPrefix = "authoring-model",
    sourceError,
    modelError,
    label = "Question model",
    allowInherit = false,
    inheritLabel = "Same as question model",
}: ModelPickerProps) {
    const parsed = parseModelSource(source);
    const selectedConnection =
        parsed?.kind === "connection"
            ? connections.find((connection) => connection.id === parsed.id)
            : undefined;
    const selectedProfile =
        parsed?.kind === "profile"
            ? profiles.find((profile) => profile.id === parsed.id)
            : undefined;

    const handleSourceChange = (nextSource: string) => {
        const next = parseModelSource(nextSource);
        if (next?.kind === "connection") {
            const connection = connections.find((item) => item.id === next.id);
            onSourceChange(nextSource, connection ? connectionModel(connection) : "");
            return;
        }
        onSourceChange(nextSource, "");
    };

    const modelOptions = selectedConnection?.models ?? [];
    const modelIsListed = modelOptions.includes(model);

    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor={`${idPrefix}-source`}>{label}</Label>
                <Select
                    value={source}
                    onValueChange={handleSourceChange}
                    disabled={disabled}
                >
                    <SelectTrigger id={`${idPrefix}-source`} className="w-full">
                        <SelectValue placeholder="Choose a model" />
                    </SelectTrigger>
                    <SelectContent>
                        {allowInherit && (
                            <SelectItem value={INHERIT_SOURCE}>{inheritLabel}</SelectItem>
                        )}
                        {connections.length > 0 && (
                            <SelectGroup>
                                <SelectLabel>Your connections</SelectLabel>
                                {connections.map((connection) => (
                                    <SelectItem
                                        key={connection.id}
                                        value={connectionSource(connection.id)}
                                    >
                                        {connection.name} · {PROVIDER_LABELS[connection.kind]}
                                    </SelectItem>
                                ))}
                            </SelectGroup>
                        )}
                        {profiles.length > 0 && (
                            <SelectGroup>
                                <SelectLabel>Server models</SelectLabel>
                                {profiles.map((profile) => (
                                    <SelectItem key={profile.id} value={`profile:${profile.id}`}>
                                        {profile.label} · {profile.provider}/{profile.model}
                                    </SelectItem>
                                ))}
                            </SelectGroup>
                        )}
                    </SelectContent>
                </Select>
                {sourceError && <p className="text-sm text-destructive">{sourceError}</p>}
            </div>

            {selectedConnection && (
                <div className="space-y-2">
                    <Label htmlFor={`${idPrefix}-model`}>Model</Label>
                    {modelOptions.length > 0 ? (
                        <Select
                            value={model}
                            onValueChange={onModelChange}
                            disabled={disabled}
                        >
                            <SelectTrigger id={`${idPrefix}-model`} className="w-full">
                                <SelectValue placeholder="Choose a model" />
                            </SelectTrigger>
                            <SelectContent>
                                {modelOptions.map((option) => (
                                    <SelectItem key={option} value={option}>
                                        {option}
                                    </SelectItem>
                                ))}
                                {model && !modelIsListed && (
                                    <SelectItem value={model}>{model}</SelectItem>
                                )}
                            </SelectContent>
                        </Select>
                    ) : (
                        <Input
                            id={`${idPrefix}-model`}
                            value={model}
                            onChange={(event) => onModelChange(event.target.value)}
                            disabled={disabled}
                            placeholder="Model name"
                        />
                    )}
                    <p className="text-xs text-muted-foreground">
                        {selectedConnection.models.length} model
                        {selectedConnection.models.length === 1 ? "" : "s"} from{" "}
                        {selectedConnection.name} · key ending {selectedConnection.key_last4}
                    </p>
                    {modelError && <p className="text-sm text-destructive">{modelError}</p>}
                </div>
            )}

            {selectedProfile && (
                <p className="rounded-md border bg-muted/30 p-3 text-xs text-muted-foreground">
                    Server-configured model · {selectedProfile.provider}/
                    {selectedProfile.model}
                </p>
            )}
        </div>
    );
}
