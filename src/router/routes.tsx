import { lazy, Suspense } from "react";
import type { ComponentType } from "react";
import { createBrowserRouter } from "react-router-dom";
import { MainLayout } from "@/components/layout";
import { PageSkeleton } from "@/shared/components/LoadingSkeleton";
import { ProtectedRoute } from "./ProtectedRoute";

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
const QuestionTemplateBankPage = lazy(
    () => import("@/features/question-template-banks/QuestionTemplateBankPage"),
);
const TemplateBuilderPage = lazy(
    () => import("@/features/question-template-builder/TemplateBuilderPage"),
);
const OAuthCallbackPage = lazy(() => import("@/features/auth/OAuthCallbackPage"));
const VerifyEmailPage = lazy(() => import("@/features/auth/VerifyEmailPage"));
const HomeRoute = lazy(() => import("./HomeRoute"));

const TutorialPage = lazy(() => import("@/features/landing/TutorialPage"));
const TemplateBuilderTutorialPage = lazy(
    () => import("@/features/landing/TemplateBuilderTutorialPage"),
);

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
                element: lazyRoute(HomeRoute),
            },
            // Public routes
            {
                path: "tutorial",
                children: [
                    {
                        index: true,
                        element: lazyRoute(TutorialPage),
                    },
                    {
                        path: "template-builder",
                        element: lazyRoute(TemplateBuilderTutorialPage),
                    },
                ],
            },
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
            {
                path: "question-template-banks/:templateBankId",
                element: lazyRoute(QuestionTemplateBankPage),
            },
            // Protected routes
            {
                element: <ProtectedRoute />,
                children: [
                    {
                        path: "folders/:folderId",
                        element: lazyRoute(FolderPage),
                    },
                ],
            },
        ],
    },
]);

export default router;
