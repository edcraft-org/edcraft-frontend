import { describe, expect, it } from "vitest";
import { ApiError } from "@/api/axiosInstance";
import { getAuthoringErrorMessage, isStaleArtifactError } from "../errors";

function validationError(detail: unknown): ApiError {
    const error = new ApiError(422, "Unprocessable Entity");
    Object.defineProperty(error, "detail", { value: detail });
    return error;
}

describe("getAuthoringErrorMessage", () => {
    it("normalizes a FastAPI 422 detail array to a readable string", () => {
        const message = getAuthoringErrorMessage(
            validationError([
                { loc: ["body", "seed"], msg: "Input should be greater than or equal to 0" },
                {
                    loc: ["body", "quantity"],
                    msg: "Input should be less than or equal to 50",
                },
            ]),
            "The request failed.",
        );

        expect(typeof message).toBe("string");
        expect(message).toBe(
            "body.seed: Input should be greater than or equal to 0; " +
                "body.quantity: Input should be less than or equal to 50",
        );
    });

    it("falls back to a string when detail is not readable", () => {
        expect(getAuthoringErrorMessage(validationError([{ loc: ["body"] }]), "Fallback")).toBe(
            "Fallback",
        );
        expect(getAuthoringErrorMessage(validationError({ unexpected: true }), "Fallback")).toBe(
            "Fallback",
        );
    });

    it("keeps the existing status-specific messages", () => {
        expect(getAuthoringErrorMessage(new ApiError(401, "nope"), "Fallback")).toBe(
            "Please sign in to continue.",
        );
        expect(getAuthoringErrorMessage(new ApiError(404, "nope"), "Fallback")).toBe(
            "This question was not found or is not yours.",
        );
    });
});

describe("isStaleArtifactError", () => {
    it("recognises the artifact-change conflicts", () => {
        expect(
            isStaleArtifactError(
                new ApiError(409, "The artifact changed; refresh the review before deciding."),
            ),
        ).toBe(true);
        expect(
            isStaleArtifactError(
                new ApiError(409, "The stored artifact failed its integrity check; refresh the review."),
            ),
        ).toBe(true);
    });

    it("does not treat other 409 conflicts as stale artifacts", () => {
        expect(
            isStaleArtifactError(
                new ApiError(409, "The exact artifact must be approved before generating questions."),
            ),
        ).toBe(false);
        expect(
            isStaleArtifactError(
                new ApiError(409, "The artifact could not produce a question for this seed."),
            ),
        ).toBe(false);
    });
});
