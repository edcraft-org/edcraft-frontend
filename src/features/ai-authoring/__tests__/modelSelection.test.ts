import { describe, expect, it } from "vitest";
import {
    connectionSource,
    INHERIT_SOURCE,
    profileSource,
    resolveModelSelection,
    resolveStoredJudgeSelection,
    resolveStoredModelSelection,
} from "../modelSelection";
import { capabilities, connection } from "./fixtures";

const connections = [connection];
const profiles = capabilities.model_profiles;

describe("stored model selection", () => {
    it("resolves a stored connection and model exactly", () => {
        expect(
            resolveStoredModelSelection({
                connections,
                profiles: [],
                connectionId: "connection-1",
                model: "gpt-other",
            }),
        ).toEqual({
            source: connectionSource("connection-1"),
            model: "gpt-other",
            missing: false,
        });
    });

    it("resolves a stored profile exactly", () => {
        expect(
            resolveStoredModelSelection({
                connections: [],
                profiles,
                profileId: "default",
            }),
        ).toEqual({
            source: profileSource("default"),
            model: "",
            missing: false,
        });
    });

    it("marks a removed connection as missing", () => {
        expect(
            resolveStoredModelSelection({
                connections,
                profiles,
                connectionId: "deleted-connection",
                model: "gpt-other",
            }),
        ).toEqual({ source: "", model: "", missing: true });
    });

    it("marks a removed profile as missing", () => {
        expect(
            resolveStoredModelSelection({
                connections,
                profiles,
                profileId: "deleted-profile",
            }),
        ).toEqual({ source: "", model: "", missing: true });
    });

    it("marks a model no longer listed on its connection as missing", () => {
        expect(
            resolveStoredModelSelection({
                connections,
                profiles,
                connectionId: "connection-1",
                model: "gpt-removed",
            }),
        ).toEqual({ source: "", model: "", missing: true });
    });

    it("accepts a saved manual model when the connection has no discovered list", () => {
        const manualConnection = {
            ...connection,
            default_model: "manual-model",
            models: [],
        };

        expect(
            resolveStoredModelSelection({
                connections: [manualConnection],
                profiles,
                connectionId: manualConnection.id,
                model: "manual-model",
            }),
        ).toEqual({
            source: connectionSource(manualConnection.id),
            model: "manual-model",
            missing: false,
        });
    });

    it("prefills a saved manual model when the connection has no discovered list", () => {
        const manualConnection = {
            ...connection,
            default_model: "fallback-model",
            models: [],
        };

        expect(
            resolveModelSelection({
                connections: [manualConnection],
                profiles,
                connectionId: manualConnection.id,
                model: "manual-model",
            }),
        ).toEqual({
            source: connectionSource(manualConnection.id),
            model: "manual-model",
        });
    });

    it("falls back to a default model when nothing is stored", () => {
        expect(
            resolveStoredModelSelection({
                connections,
                profiles,
            }),
        ).toEqual({
            source: connectionSource("connection-1"),
            model: "gpt-test",
            missing: false,
        });
    });
});

describe("stored judge selection", () => {
    it("defaults an undefined judge to inherit", () => {
        expect(
            resolveStoredJudgeSelection({
                connections,
                profiles,
                selection: undefined,
            }),
        ).toEqual({
            source: INHERIT_SOURCE,
            model: "",
            missing: false,
        });
    });

    it("resolves a stored judge exactly", () => {
        expect(
            resolveStoredJudgeSelection({
                connections,
                profiles,
                selection: {
                    connection_id: "connection-1",
                    model: "gpt-other",
                },
            }),
        ).toEqual({
            source: connectionSource("connection-1"),
            model: "gpt-other",
            missing: false,
        });
    });

    it("marks a removed judge model as missing instead of inheriting", () => {
        expect(
            resolveStoredJudgeSelection({
                connections,
                profiles,
                selection: {
                    connection_id: "connection-1",
                    model: "gpt-removed",
                },
            }),
        ).toEqual({ source: "", model: "", missing: true });
    });
});
