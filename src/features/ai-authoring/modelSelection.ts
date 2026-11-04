import type {
    AuthoringJudgeSelections,
    AuthoringModelSelection,
} from "@/api/models";
import type { ProviderConnection } from "@/features/model-connections/types";
import type { AuthoringModelProfile } from "./types";

const CONNECTION_PREFIX = "connection:";
const PROFILE_PREFIX = "profile:";

/** Picker sentinel for "use the question's authoring model". */
export const INHERIT_SOURCE = "inherit";

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

export function isInheritSource(source: string): boolean {
    return source === INHERIT_SOURCE;
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

/** A selected connection needs a non-blank model; inherit and profiles do not. */
export function isModelSelectionComplete(source: string, model: string): boolean {
    if (isInheritSource(source)) return true;
    const parsed = parseModelSource(source);
    if (!parsed) return false;
    return parsed.kind !== "connection" || model.trim().length > 0;
}

/**
 * Build the optional judge overrides. Inherit entries are omitted so the
 * backend keeps following the question model.
 */
export function buildJudgeSelections(
    difficulty: ModelSelection,
    relevance: ModelSelection,
): AuthoringJudgeSelections | undefined {
    const selections: AuthoringJudgeSelections = {};
    if (!isInheritSource(difficulty.source)) {
        const request = buildModelRequest(difficulty.source, difficulty.model);
        if (Object.keys(request).length > 0) selections.difficulty = request;
    }
    if (!isInheritSource(relevance.source)) {
        const request = buildModelRequest(relevance.source, relevance.model);
        if (Object.keys(request).length > 0) selections.relevance = request;
    }
    return Object.keys(selections).length > 0 ? selections : undefined;
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

interface ResolveJudgeSelectionInput {
    connections: ProviderConnection[];
    profiles: AuthoringModelProfile[];
    selection?: AuthoringModelSelection | null;
}

/**
 * Resolve one stored judge override, defaulting to inherit. A removed
 * connection or profile also falls back to inherit so a retry can still start.
 */
export function resolveJudgeSelection({
    connections,
    profiles,
    selection,
}: ResolveJudgeSelectionInput): ModelSelection {
    if (selection?.connection_id) {
        const connection = connections.find(
            (item) => item.id === selection.connection_id,
        );
        if (connection) {
            return resolveModelSelection({
                connections,
                profiles,
                connectionId: connection.id,
                model: selection.model,
            });
        }
    } else if (selection?.model_profile) {
        const profile = profiles.find((item) => item.id === selection.model_profile);
        if (profile) {
            return { source: profileSource(profile.id), model: "" };
        }
    }
    return { source: INHERIT_SOURCE, model: "" };
}
