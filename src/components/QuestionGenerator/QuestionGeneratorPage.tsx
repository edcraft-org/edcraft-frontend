import { useCodeAnalysis } from '../../hooks/useCodeAnalysis';
import { CodeInputSection } from './CodeInputSection';
import { QuestionForm } from './QuestionForm';
import { QuestionDisplay } from './QuestionDisplay';

export function QuestionGeneratorPage() {
  const {
    formSchema,
    submittedCode,
    isAnalysing,
    analyseError,
    isGenerating,
    generateError,
    generatedQuestion,
    questionType,
    analyseCode,
    generateQuestion,
    reset,
  } = useCodeAnalysis();

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Algorithm Question Generator
          </h1>
          <p className="text-lg text-gray-600">
            Generate practice questions to help students learn about algorithms
          </p>
        </header>

        {/* Code Input Section */}
        <div className="mb-8">
          <CodeInputSection
            onAnalyse={analyseCode}
            isAnalysing={isAnalysing}
            error={analyseError}
          />
        </div>

        {/* Question Form Section */}
        {formSchema && (
          <div className="mb-8">
            <QuestionForm
              formSchema={formSchema}
              submittedCode={submittedCode}
              onSubmit={generateQuestion}
              isSubmitting={isGenerating}
            />
          </div>
        )}

        {/* Error Display */}
        {generateError && (
          <div className="max-w-4xl mx-auto p-4 bg-red-50 border border-red-200 rounded-lg">
            <h3 className="text-lg font-semibold text-red-800 mb-2">Error Generating Question</h3>
            <p className="text-red-600">{generateError}</p>
          </div>
        )}

        {/* Generated Question Display */}
        {generatedQuestion && questionType && (
          <div className="mb-8">
            <div className="max-w-4xl mx-auto mb-4 flex justify-end">
              <button
                type="button"
                onClick={reset}
                className="px-4 py-2 bg-gray-200 text-gray-700 font-medium rounded-md hover:bg-gray-300 transition-colors"
              >
                Start Over
              </button>
            </div>
            <QuestionDisplay response={generatedQuestion} questionType={questionType} />
          </div>
        )}

        {/* Instructions/Help Section */}
        {!formSchema && !isAnalysing && (
          <div className="max-w-4xl mx-auto p-6 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-900 mb-3">How to use:</h3>
            <ol className="list-decimal list-inside space-y-2 text-blue-800">
              <li>Paste your algorithm code in the text area above</li>
              <li>Click &#34;Analyse Code&#34; to extract the code structure</li>
              <li>Select the target element you want to query (e.g., a specific function)</li>
              <li>Choose the output type and question type</li>
              <li>Provide test input data for your algorithm</li>
              <li>Click &#34;Generate Question&#34; to create a practice question</li>
            </ol>
          </div>
        )}
      </div>
    </div>
  );
}
