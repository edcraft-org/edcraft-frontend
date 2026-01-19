import { useState } from "react";

interface CodeInputSectionProps {
    onAnalyse: (code: string) => void;
    isAnalysing: boolean;
    error: string | null;
}

export function CodeInputSection({ onAnalyse, isAnalysing, error }: CodeInputSectionProps) {
    const [code, setCode] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (code.trim()) {
            onAnalyse(code);
        }
    };

    return (
        <section className="w-full max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-4">Step 1: Input Your Algorithm Code</h2>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label
                        htmlFor="code-input"
                        className="block text-sm font-medium text-gray-700 mb-2"
                    >
                        Paste your algorithm code below:
                    </label>
                    <textarea
                        id="code-input"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        className="w-full h-64 p-3 font-mono text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="def bubble_sort(arr):&#10;    # Your code here..."
                        disabled={isAnalysing}
                    />
                </div>

                {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                        <p className="text-sm text-red-600">{error}</p>
                    </div>
                )}

                <button
                    type="submit"
                    disabled={isAnalysing || !code.trim()}
                    className="w-full py-3 px-4 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    {isAnalysing ? "Analysing Code..." : "Analyse Code"}
                </button>
            </form>
        </section>
    );
}
