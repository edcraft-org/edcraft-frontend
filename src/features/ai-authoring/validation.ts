// Server-authoritative seed bounds shared by preview and generation inputs.
export const MAX_SEED = 2_147_483_647;

export function seedError(seed: number): string | null {
    if (!Number.isInteger(seed) || seed < 0 || seed > MAX_SEED) {
        return `Enter a seed from 0 to ${MAX_SEED}.`;
    }
    return null;
}

export function seedRangeError(seed: number, quantity: number): string | null {
    const invalidSeed = seedError(seed);
    if (invalidSeed) return invalidSeed;
    const lastSeed = seed + quantity - 1;
    if (lastSeed > MAX_SEED) {
        return `The last seed (${lastSeed}) exceeds ${MAX_SEED}. Lower the seed or quantity.`;
    }
    return null;
}
