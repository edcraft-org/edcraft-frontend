import { useParams, useSearchParams } from "react-router-dom";

function QuestionBuilderPage() {
  const { questionId } = useParams<{ questionId?: string }>();
  const [searchParams] = useSearchParams();
  const destinationAssessmentId = searchParams.get("destination");

  const isEditing = !!questionId;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">
          {isEditing ? "Edit Question" : "Question Builder"}
        </h1>
        <p className="text-muted-foreground mt-1">
          {isEditing
            ? "Edit the question details below"
            : "Create a new question by providing code and configuring the target"}
        </p>
      </div>

      {destinationAssessmentId && (
        <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <p className="text-sm text-blue-700 dark:text-blue-300">
            After generating the question, it will be saved to the selected assessment.
          </p>
        </div>
      )}

      <div className="bg-muted/50 rounded-lg p-8 text-center text-muted-foreground">
        <p>Question Builder component will be migrated here from the existing QuestionGenerator.</p>
        <p className="text-sm mt-2">
          The existing code analysis and question generation UI will be reused.
        </p>
      </div>
    </div>
  );
}

export default QuestionBuilderPage;
