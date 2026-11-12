import { api } from "@/api/client";
import type {
    CreateProviderConnectionInput,
    DiscoveredModels,
    ProbeProviderInput,
    ProviderConnection,
    UpdateProviderConnectionInput,
} from "../types";

export async function listProviderConnections(): Promise<ProviderConnection[]> {
    const response = await api.listConnectionsAiAuthoringConnectionsGet();
    return response.data;
}

export async function createProviderConnection(
    input: CreateProviderConnectionInput,
): Promise<ProviderConnection> {
    const response = await api.createConnectionAiAuthoringConnectionsPost(input);
    return response.data;
}

export async function probeProviderConnection(
    input: ProbeProviderInput,
): Promise<DiscoveredModels> {
    const response = await api.probeConnectionAiAuthoringConnectionsProbePost(input);
    return response.data;
}

export async function updateProviderConnection(
    connectionId: string,
    input: UpdateProviderConnectionInput,
): Promise<ProviderConnection> {
    const response = await api.updateConnectionAiAuthoringConnectionsConnectionIdPatch(
        connectionId,
        input,
    );
    return response.data;
}

export async function deleteProviderConnection(connectionId: string): Promise<void> {
    await api.deleteConnectionAiAuthoringConnectionsConnectionIdDelete(connectionId);
}

export async function testProviderConnection(
    connectionId: string,
): Promise<DiscoveredModels> {
    const response = await api.testConnectionAiAuthoringConnectionsConnectionIdTestPost(
        connectionId,
    );
    return response.data;
}
