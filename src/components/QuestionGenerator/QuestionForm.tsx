import { useState } from "react";
import type {
    FormSchema,
    TargetSelection,
    GenerateQuestionRequest,
    FormElement,
    OutputType,
    QuestionType,
} from "../../types/api.types";
import { OutputType as OutputTypeEnum, QuestionType as QuestionTypeEnum, FormElementType } from "../../constants";
import { TargetSelector } from "./TargetSelector";
import { flattenTarget } from "../../utils/transformTarget";

interface QuestionFormProps {
    formSchema: FormSchema;
    submittedCode: string;
    onSubmit: (request: GenerateQuestionRequest) => void;
    isSubmitting: boolean;
}

export function QuestionForm({
    formSchema,
    submittedCode,
    onSubmit,
    isSubmitting,
}: QuestionFormProps) {
    const [targetSelection, setTargetSelection] = useState<TargetSelection | null>(null);
    const [outputType, setOutputType] = useState<OutputType>(OutputTypeEnum.List);
    const [questionType, setQuestionType] = useState<QuestionType>(QuestionTypeEnum.MCQ);
    const [numDistractors, setNumDistractors] = useState(4);
    const [entryFunction, setEntryFunction] = useState("");
    const [inputDataJson, setInputDataJson] = useState("");
    const [jsonError, setJsonError] = useState<string | null>(null);

    // Get form elements from schema
    const outputTypeElement = formSchema.form_elements.find(
        (el) => el.element_type === FormElementType.OutputTypeSelector
    );
    const questionTypeElement = formSchema.form_elements.find(
        (el) => el.element_type === FormElementType.QuestionTypeSelector
    );

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!targetSelection) {
            alert("Please select a target element");
            return;
        }

        if (!entryFunction.trim()) {
            alert("Please specify the entry function name");
            return;
        }

        // Parse input data JSON
        let inputData: Record<string, unknown> = {};
        if (inputDataJson.trim()) {
            try {
                inputData = JSON.parse(inputDataJson);
                setJsonError(null);
            } catch (error) {
                setJsonError("Invalid JSON format");
                return;
            }
        }

        const request: GenerateQuestionRequest = {
            code: submittedCode,
            question_spec: {
                target: flattenTarget(targetSelection),
                output_type: outputType,
                question_type: questionType,
            },
            execution_spec: {
                entry_function: entryFunction,
                input_data: inputData,
            },
            generation_options: {
                num_distractors: numDistractors,
            },
        };

        onSubmit(request);
    };

    // Helper function to render a select field
    const renderSelectField = (
        element: FormElement,
        value: string,
        onChange: (value: string) => void
    ) => {
        return (
            <div key={element.element_type}>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    {element.label}
                    {element.is_required && <span className="text-red-500 ml-1">*</span>}
                </label>
                {element.description && (
                    <p className="text-sm text-gray-500 mb-2">{element.description}</p>
                )}
                <select
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required={element.is_required}
                >
                    {element.options.map((option) => (
                        <option key={option.id} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
            </div>
        );
    };

    const renderFormElement = (element: FormElement) => {
        // Configuration map for different selector types
        const selectorConfig: Record<
            string,
            {
                value: string;
                onChange: (value: string) => void;
            }
        > = {
            output_type_selector: {
                value: outputType,
                onChange: (value) => setOutputType(value as OutputType),
            },
            question_type_selector: {
                value: questionType,
                onChange: (value) => setQuestionType(value as QuestionType),
            },
        };

        const config = selectorConfig[element.element_type];

        if (config) {
            return renderSelectField(element, config.value, config.onChange);
        }

        return null;
    };

    // Get entry function options
    const entryFunctionOptions = formSchema.code_info.functions.filter((f) => f.is_definition);

    return (
        <section className="w-full max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-6">Step 2: Configure Question Parameters</h2>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Target Selector */}
                <div className="p-4 bg-gray-50 rounded-lg">
                    <TargetSelector
                        codeInfo={formSchema.code_info}
                        onTargetChange={setTargetSelection}
                    />
                </div>

                {/* Output Type Selector */}
                {outputTypeElement && renderFormElement(outputTypeElement)}

                {/* Question Type Selector */}
                {questionTypeElement && renderFormElement(questionTypeElement)}

                {/* Number of Distractors (only for MCQ/MRQ) */}
                {(questionType === QuestionTypeEnum.MCQ || questionType === QuestionTypeEnum.MRQ) && (
                    <div>
                        <label
                            htmlFor="num-distractors"
                            className="block text-sm font-medium text-gray-700 mb-2"
                        >
                            Number of Distractors
                        </label>
                        <p className="text-sm text-gray-500 mb-2">
                            How many incorrect answer options should be generated?
                        </p>
                        <input
                            type="number"
                            id="num-distractors"
                            min="1"
                            max="10"
                            value={numDistractors}
                            onChange={(e) => setNumDistractors(Number(e.target.value))}
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                )}

                {/* Algorithm Input Section */}
                <div className="p-4 bg-gray-50 rounded-lg space-y-4">
                    <h3 className="text-lg font-semibold">Algorithm Input</h3>

                    <div>
                        <label
                            htmlFor="entry-function"
                            className="block text-sm font-medium text-gray-700 mb-2"
                        >
                            Entry Function <span className="text-red-500">*</span>
                        </label>
                        <p className="text-sm text-gray-500 mb-2">
                            Select the main function to execute with the test data
                        </p>
                        <select
                            id="entry-function"
                            value={entryFunction}
                            onChange={(e) => setEntryFunction(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            required
                        >
                            <option value="">-- Select Entry Function --</option>
                            {entryFunctionOptions.map((func, index) => (
                                <option key={index} value={func.name}>
                                    {func.name} (Line {func.line_number})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label
                            htmlFor="input-data"
                            className="block text-sm font-medium text-gray-700 mb-2"
                        >
                            Input Data (JSON)
                        </label>
                        <p className="text-sm text-gray-500 mb-2">
                            Provide input parameters for the algorithm. Example: {"{"}&#34;arr&#34;:
                            [5, 2, 8, 1]{"}"}
                        </p>
                        <textarea
                            id="input-data"
                            value={inputDataJson}
                            onChange={(e) => setInputDataJson(e.target.value)}
                            className="w-full h-32 p-3 font-mono text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder='{"arr": [5, 2, 8, 1]}'
                        />
                        {jsonError && <p className="text-sm text-red-600 mt-1">{jsonError}</p>}
                    </div>
                </div>

                {/* Submit Button */}
                <button
                    type="submit"
                    disabled={isSubmitting || !targetSelection}
                    className="w-full py-3 px-4 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    {isSubmitting ? "Generating Question..." : "Generate Question"}
                </button>
            </form>
        </section>
    );
}
