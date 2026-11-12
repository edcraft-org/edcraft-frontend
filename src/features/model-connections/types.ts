// UI-facing aliases for generated provider-connection models. The generated
// API models remain authoritative and are never edited by hand.
import type {
    ProviderConnectionCreate,
    ProviderConnectionCreateKind,
    ProviderConnectionResponse,
    ProviderConnectionResponseKind,
    ProviderConnectionUpdate,
    ProviderModelList,
    ProviderProbeRequest,
} from "@/api/models";

export type ProviderConnection = ProviderConnectionResponse;
export type ProviderConnectionKind = ProviderConnectionResponseKind;
export type CreateProviderConnectionInput = ProviderConnectionCreate;
export type UpdateProviderConnectionInput = ProviderConnectionUpdate;
export type ProbeProviderInput = ProviderProbeRequest;
export type DiscoveredModels = ProviderModelList;

export const PROVIDER_KINDS: ProviderConnectionCreateKind[] = ["soclaas", "openai"];

export const PROVIDER_LABELS: Record<ProviderConnectionKind, string> = {
    soclaas: "SocLaas",
    openai: "OpenAI",
};
