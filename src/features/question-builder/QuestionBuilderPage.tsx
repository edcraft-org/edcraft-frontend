import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { QuestionGeneratorPage } from "@/components/QuestionBuilder";

function QuestionBuilderPage() {
  const { questionId } = useParams<{ questionId?: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const destinationAssessmentId = searchParams.get("destination");

  const isEditing = !!questionId;

  return (
    <div className="min-h-screen bg-background">
      {/* Header with back navigation */}
      <div className="border-b bg-background sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-lg font-semibold">
              {isEditing ? "Edit Question" : "Question Builder"}
            </h1>
          </div>
        </div>
      </div>

      {/* Destination assessment notice */}
      {destinationAssessmentId && (
        <div className="max-w-6xl mx-auto px-4 mt-4">
          <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              After generating the question, it will be saved to the selected assessment.
            </p>
          </div>
        </div>
      )}

      {/* Question Generator */}
      <QuestionGeneratorPage destinationAssessmentId={destinationAssessmentId || undefined} />
    </div>
  );
}

export default QuestionBuilderPage;
