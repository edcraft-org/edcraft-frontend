import { lazy, Suspense } from "react";
import type { ComponentType } from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { ROUTES } from "./paths";
import { QuestionGeneratorPage } from "./components/QuestionGenerator/QuestionGeneratorPage";

// Re-export ROUTES for convenience
export { ROUTES } from "./paths";

// Lazy load pages
// const FolderPage = lazy(() => import("@/features/folders/FolderPage"));
// const QuestionBuilderPage = lazy(() => import("@/features/question-builder/QuestionBuilderPage"));
// const AssessmentPage = lazy(() => import("@/features/assessments/AssessmentPage"));
// const AssessmentTemplatePage = lazy(() => import("@/features/assessment-templates/AssessmentTemplatePage"));
// const TemplateBuilderPage = lazy(() => import("@/features/templates/TemplateBuilderPage"));

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

// Helper to wrap lazy loaded components with Suspense
function lazyRoute(Component: ComponentType) {
  return (
    <Suspense fallback={<PageLoader />}>
      <Component />
    </Suspense>
  );
}

// Router configuration
export const router = createBrowserRouter([
  {
    path: "/",
    element: <QuestionGeneratorPage />,
    // children: [
    //   {
    //     index: true,
    //     element: <Navigate to={ROUTES.FOLDER_ROOT} replace />,
    //   },
    //   {
    //     path: "folders/:folderId",
    //     element: lazyRoute(FolderPage),
    //   },
    //   {
    //     path: "question-builder",
    //     element: lazyRoute(QuestionBuilderPage),
    //   },
    //   {
    //     path: "questions/:questionId/edit",
    //     element: lazyRoute(QuestionBuilderPage),
    //   },
    //   {
    //     path: "template-builder",
    //     element: lazyRoute(TemplateBuilderPage),
    //   },
    //   {
    //     path: "templates/:templateId/edit",
    //     element: lazyRoute(TemplateBuilderPage),
    //   },
    //   {
    //     path: "assessments/:assessmentId",
    //     element: lazyRoute(AssessmentPage),
    //   },
    //   {
    //     path: "assessment-templates/:templateId",
    //     element: lazyRoute(AssessmentTemplatePage),
    //   },
    // ],
  },
]);

export default router;
