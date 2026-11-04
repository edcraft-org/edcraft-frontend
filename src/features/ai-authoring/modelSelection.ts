import type { ProviderConnection } from "@/features/model-connections/types";
import type { AuthoringModelProfile } from "./types";

const CONNECTION_PREFIX = "connection:";
const PROFILE_PREFIX = "profile:";

export interface ParsedModelSource {
    kind: "connection" | "profile";
    id: string;
}

export interface ModelSelection {
    source: string;
    model: string;
}

/** Fields submitted to the backend for the chosen model source. */
export interface ModelRequestFields {
    model_profile?: string;
    connection_id?: string;
    model?: string;
}

export function connectionSource(connectionId: string): string {
    return `${CONNECTION_PREFIX}${connectionId}`;
}

export function profileSource(profileId: string): string {
    return `${PROFILE_PREFIX}${profileId}`;
}

export function parseModelSource(source: string): ParsedModelSource | null {
    if (source.startsWith(CONNECTION_PREFIX)) {
        const id = source.slice(CONNECTION_PREFIX.length);
        return id ? { kind: "connection", id } : null;
    }
    if (source.startsWith(PROFILE_PREFIX)) {
        const id = source.slice(PROFILE_PREFIX.length);
        return id ? { kind: "profile", id } : null;
    }
    return null;
}

export function connectionModel(connection: ProviderConnection): string {
    return connection.default_model || connection.models[0] || "";
}

export function buildModelRequest(
    source: string,
    model: string,
): ModelRequestFields {
    const parsed = parseModelSource(source);
    if (parsed?.kind === "connection") {
        return { connection_id: parsed.id, model };
    }
    if (parsed?.kind === "profile") {
        return { model_profile: parsed.id };
    }
    return {};
}

interface ResolveModelSelectionInput {
    connections: ProviderConnection[];
    profiles: AuthoringModelProfile[];
    connectionId?: string | null;
    profileId?: string | null;
    model?: string | null;
}

/** Pick the prefill or first available model source for a form. */
export function resolveModelSelection({
    connections,
    profiles,
    connectionId,
    profileId,
    model,
}: ResolveModelSelectionInput): ModelSelection {
    const requestedConnection = connections.find(
        (connection) => connection.id === connectionId,
    );
    if (requestedConnection) {
        return {
            source: connectionSource(requestedConnection.id),
            model:
                model && requestedConnection.models.includes(model)
                    ? model
                    : connectionModel(requestedConnection),
        };
    }

    const requestedProfile = profiles.find((profile) => profile.id === profileId);
    if (requestedProfile) {
        return { source: profileSource(requestedProfile.id), model: "" };
    }

    const fallbackConnection = connections[0];
    if (fallbackConnection) {
        return {
            source: connectionSource(fallbackConnection.id),
            model: connectionModel(fallbackConnection),
        };
    }

    const fallbackProfile = profiles[0];
    if (fallbackProfile) {
        return { source: profileSource(fallbackProfile.id), model: "" };
    }

    return { source: "", model: "" };
}
