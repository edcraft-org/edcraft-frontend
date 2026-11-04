import "@testing-library/jest-dom/vitest";

// Radix primitives measure their triggers with ResizeObserver. jsdom does not
// provide it, so tests only need a no-op implementation.
class ResizeObserverMock {
    observe() {}
    unobserve() {}
    disconnect() {}
}

globalThis.ResizeObserver = ResizeObserverMock as unknown as typeof ResizeObserver;
