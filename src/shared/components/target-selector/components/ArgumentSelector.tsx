import { useState } from "react";
import type { FunctionElement } from "@/api/models";

interface ArgumentSelectorProps {
    selectedFunctions: FunctionElement[];
    argumentKeys: string[] | null;
    onArgumentKeysChange: (keys: string[] | null) => void;
}

export function ArgumentSelector({
    selectedFunctions,
    argumentKeys,
    onArgumentKeysChange,
}: ArgumentSelectorProps) {
    const [inputValue, setInputValue] = useState("");

    // Find a definition with named parameters
    const definition = selectedFunctions.find(
        (f) => f.is_definition && f.parameters.length > 0,
    );
    const selectedKeys = argumentKeys ?? [];

    const toggleKey = (key: string) => {
        const next = selectedKeys.includes(key)
            ? selectedKeys.filter((k) => k !== key)
            : [...selectedKeys, key];
        onArgumentKeysChange(next.length > 0 ? next : null);
    };

    const addInputKey = () => {
        const trimmed = inputValue.trim();
        if (!trimmed || selectedKeys.includes(trimmed)) {
            setInputValue("");
            return;
        }
        // Convert plain integer to positional key
        const key = /^\d+$/.test(trimmed) ? `_arg${trimmed}` : trimmed;
        const next = [...selectedKeys, key];
        onArgumentKeysChange(next);
        setInputValue("");
    };

    const removeKey = (key: string) => {
        const next = selectedKeys.filter((k) => k !== key);
        onArgumentKeysChange(next.length > 0 ? next : null);
    };

    return (
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Argument(s):
            </label>

            {definition ? (
                // Named parameter toggle buttons (defined function)
                <div className="flex flex-wrap gap-2">
                    <button
                        type="button"
                        onClick={() => onArgumentKeysChange(null)}
                        className={`px-3 py-2 border rounded-md text-sm font-medium transition-colors ${
                            selectedKeys.length === 0
                                ? "bg-green-100 border-green-500 text-green-700"
                                : "bg-white border-gray-300 hover:bg-gray-50"
                        }`}
                    >
                        All
                    </button>
                    {definition.parameters.map((param) => (
                        <button
                            type="button"
                            key={param}
                            onClick={() => toggleKey(param)}
                            className={`px-3 py-2 border rounded-md text-sm font-medium transition-colors ${
                                selectedKeys.includes(param)
                                    ? "bg-green-100 border-green-500 text-green-700"
                                    : "bg-white border-gray-300 hover:bg-gray-50"
                            }`}
                        >
                            {param}
                        </button>
                    ))}
                </div>
            ) : (
                // Text input for call-site-only functions
                <div className="space-y-2">
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={() => onArgumentKeysChange(null)}
                            className={`px-3 py-2 border rounded-md text-sm font-medium transition-colors ${
                                selectedKeys.length === 0
                                    ? "bg-green-100 border-green-500 text-green-700"
                                    : "bg-white border-gray-300 hover:bg-gray-50"
                            }`}
                        >
                            All
                        </button>
                        <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && addInputKey()}
                            placeholder="param name or position (0, 1, ...)"
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                        <button
                            type="button"
                            onClick={addInputKey}
                            className="px-3 py-2 border border-gray-300 rounded-md text-sm bg-white hover:bg-gray-50"
                        >
                            Add
                        </button>
                    </div>
                    {selectedKeys.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                            {selectedKeys.map((key) => (
                                <span
                                    key={key}
                                    className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 border border-green-500 text-green-700 rounded text-xs"
                                >
                                    {key}
                                    <button
                                        type="button"
                                        onClick={() => removeKey(key)}
                                        className="hover:text-green-900"
                                        aria-label={`Remove ${key}`}
                                    >
                                        ×
                                    </button>
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
