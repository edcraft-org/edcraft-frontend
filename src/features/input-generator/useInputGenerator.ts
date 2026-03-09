import { useMutation } from "@tanstack/react-query";
import { api } from "@/api/client";
import type { GenerateInputsRequestInputs } from "@/api/models";

export function useGenerateInputs() {
    return useMutation({
        mutationFn: (inputs: GenerateInputsRequestInputs) =>
            api.generateInputsInputGeneratorGeneratePost({ inputs }),
    });
}
