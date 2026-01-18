import { createBrowserRouter, Navigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { ROUTES } from "./paths";

// Re-export ROUTES for convenience
export { ROUTES } from "./paths";

// Lazy load pages for code splitting
import { lazy, Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

const FolderPage = lazy(() => import("@/features/folders/FolderPage"));
const QuestionBuilderPage = lazy(() => import("@/features/question-builder/QuestionBuilderPage"));
const AssessmentPage = lazy(() => import("@/features/assessments/AssessmentPage"));
const AssessmentTemplatePage = lazy(() => import("@/features/assessment-templates/AssessmentTemplatePage"));
const TemplateBuilderPage = lazy(() => import("@/features/templates/TemplateBuilderPage"));

// Loading fallback component
function PageLoader() {
  return (
    <div className="p-6 space-y-4">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <div className="grid grid-cols-3 gap-4 mt-6">
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
      </div>
    </div>
  );
}

// Router configuration
export const router = createBrowserRouter([
  {
    path: "/",
    element: <MainLayout />,
    children: [
      {
        index: true,
        element: <Navigate to={ROUTES.FOLDER_ROOT} replace />,
      },
      {
        path: "folders/:folderId",
        element: (
          <Suspense fallback={<PageLoader />}>
            <FolderPage />
          </Suspense>
        ),
      },
      {
        path: "question-builder",
        element: (
          <Suspense fallback={<PageLoader />}>
            <QuestionBuilderPage />
          </Suspense>
        ),
      },
      {
        path: "questions/:questionId/edit",
        element: (
          <Suspense fallback={<PageLoader />}>
            <QuestionBuilderPage />
          </Suspense>
        ),
      },
      {
        path: "template-builder",
        element: (
          <Suspense fallback={<PageLoader />}>
            <TemplateBuilderPage />
          </Suspense>
        ),
      },
      {
        path: "templates/:templateId/edit",
        element: (
          <Suspense fallback={<PageLoader />}>
            <TemplateBuilderPage />
          </Suspense>
        ),
      },
      {
        path: "assessments/:assessmentId",
        element: (
          <Suspense fallback={<PageLoader />}>
            <AssessmentPage />
          </Suspense>
        ),
      },
      {
        path: "assessment-templates/:templateId",
        element: (
          <Suspense fallback={<PageLoader />}>
            <AssessmentTemplatePage />
          </Suspense>
        ),
      },
    ],
  },
]);

export default router;
