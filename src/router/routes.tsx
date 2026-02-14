import { lazy, Suspense } from "react";
import type { ComponentType } from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import { MainLayout } from "@/components/layout";
import { PageSkeleton } from "@/shared/components/LoadingSkeleton";
import { ProtectedRoute } from "./ProtectedRoute";
import { ROUTES } from "./paths";

// Re-export ROUTES for convenience
export { ROUTES } from "./paths";

// Lazy load pages
const FolderPage = lazy(() => import("@/features/folders/FolderPage"));
const QuestionBuilderPage = lazy(() => import("@/features/question-builder/QuestionBuilderPage"));
const AssessmentPage = lazy(() => import("@/features/assessments/AssessmentPage"));
const AssessmentTemplatePage = lazy(
    () => import("@/features/assessment-templates/AssessmentTemplatePage"),
);
const QuestionBankPage = lazy(() => import("@/features/question-banks/QuestionBankPage"));
const TemplateBuilderPage = lazy(
    () => import("@/features/question-template-builder/TemplateBuilderPage"),
);
const OAuthCallbackPage = lazy(() => import("@/features/auth/OAuthCallbackPage"));
const VerifyEmailPage = lazy(() => import("@/features/auth/VerifyEmailPage"));

// Helper to wrap lazy loaded components with Suspense
function lazyRoute(Component: ComponentType) {
    return (
        <Suspense fallback={<PageSkeleton />}>
            <Component />
        </Suspense>
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
            // Public routes
            {
                path: "question-builder",
                element: lazyRoute(QuestionBuilderPage),
            },
            {
                path: "template-builder",
                element: lazyRoute(TemplateBuilderPage),
            },
            {
                path: "auth/callback",
                element: lazyRoute(OAuthCallbackPage),
            },
            {
                path: "auth/verify-email",
                element: lazyRoute(VerifyEmailPage),
            },
            // Protected routes
            {
                element: <ProtectedRoute />,
                children: [
                    {
                        path: "folders/:folderId",
                        element: lazyRoute(FolderPage),
                    },
                    {
                        path: "assessments/:assessmentId",
                        element: lazyRoute(AssessmentPage),
                    },
                    {
                        path: "assessment-templates/:templateId",
                        element: lazyRoute(AssessmentTemplatePage),
                    },
                    {
                        path: "question-banks/:questionBankId",
                        element: lazyRoute(QuestionBankPage),
                    },
                ],
            },
        ],
    },
]);

export default router;
