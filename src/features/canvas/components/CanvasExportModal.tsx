import { useEffect, useState } from "react";
import { ChevronLeft, Loader2, Settings2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useCanvasStore } from "@/shared/stores/canvas.store";
import type { QuestionResponse } from "@/types/frontend.types";
import { useCanvasCourses, useCanvasQuizzes, useUploadToCanvas } from "../useCanvas";
import type { CanvasCourse, CanvasExportTarget, CanvasQuiz } from "../types";
import { CanvasSettingsDialog } from "./CanvasSettingsDialog";

interface CanvasExportModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    questions: QuestionResponse[];
    quizTitle?: string;
    mode: "assessment" | "question";
}

type Step = "course" | "quiz" | "confirm";

export function CanvasExportModal({
    open,
    onOpenChange,
    questions,
    quizTitle,
    mode,
}: CanvasExportModalProps) {
    const { canvasBaseUrl, canvasAccessToken } = useCanvasStore();
    const hasCredentials = Boolean(canvasBaseUrl && canvasAccessToken);

    const [showSettings, setShowSettings] = useState(false);
    const [step, setStep] = useState<Step>("course");
    const [selectedCourse, setSelectedCourse] = useState<CanvasCourse | null>(null);
    const [exportTarget, setExportTarget] = useState<CanvasExportTarget | null>(null);
    const [newQuizTitle, setNewQuizTitle] = useState(quizTitle ?? "");

    const {
        data: coursesData,
        isLoading: coursesLoading,
        error: coursesError,
        fetchNextPage: fetchNextCoursePage,
        hasNextPage: hasNextCoursePage,
        isFetchingNextPage: isFetchingNextCoursePage,
    } = useCanvasCourses(open && hasCredentials);
    const {
        data: quizzesData,
        isLoading: quizzesLoading,
        fetchNextPage: fetchNextQuizPage,
        hasNextPage: hasNextQuizPage,
        isFetchingNextPage: isFetchingNextQuizPage,
    } = useCanvasQuizzes(step === "quiz" ? (selectedCourse?.id ?? null) : null);

    const courses = coursesData?.pages.flatMap((p) => p.data);
    const quizzes = quizzesData?.pages.flatMap((p) => p.data);

    const uploadMutation = useUploadToCanvas();

    useEffect(() => {
        if (!open) {
            setStep("course");
            setSelectedCourse(null);
            setExportTarget(null);
            setNewQuizTitle(quizTitle ?? "");
            uploadMutation.reset();
        }
    }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleSelectCourse = (course: CanvasCourse) => {
        setSelectedCourse(course);
        if (mode === "assessment") {
            setExportTarget({
                mode: "new",
                courseId: course.id,
                courseName: course.name,
                quizTitle: quizTitle ?? "New Quiz",
            });
            setStep("confirm");
        } else {
            setStep("quiz");
        }
    };

    const handleSelectExistingQuiz = (quiz: CanvasQuiz) => {
        setExportTarget({
            mode: "existing",
            courseId: selectedCourse!.id,
            courseName: selectedCourse!.name,
            quizId: quiz.id,
            quizTitle: quiz.title,
        });
        setStep("confirm");
    };

    const handleCreateNewQuiz = () => {
        if (!newQuizTitle.trim()) return;
        setExportTarget({
            mode: "new",
            courseId: selectedCourse!.id,
            courseName: selectedCourse!.name,
            quizTitle: newQuizTitle.trim(),
        });
        setStep("confirm");
    };

    const handleUpload = async () => {
        if (!exportTarget) return;
        try {
            await uploadMutation.mutateAsync({ questions, target: exportTarget });
            toast.success(
                `Uploaded ${questions.length} question${questions.length !== 1 ? "s" : ""} to Canvas.`,
            );
            onOpenChange(false);
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Upload failed. Please try again.");
        }
    };

    const getStepTitle = () => {
        if (!hasCredentials) return "Canvas Settings Required";
        if (step === "course") return "Select Course";
        if (step === "quiz") return "Choose Quiz";
        return "Confirm Upload";
    };

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>{getStepTitle()}</DialogTitle>
                    </DialogHeader>

                    {!hasCredentials ? (
                        <div className="flex flex-col items-center gap-4 py-6 text-center">
                            <Settings2 className="h-10 w-10 text-muted-foreground" />
                            <div>
                                <p className="font-medium">Canvas not configured</p>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Add your Canvas URL and access token to get started.
                                </p>
                            </div>
                            <Button onClick={() => setShowSettings(true)}>
                                Open Canvas Settings
                            </Button>
                        </div>
                    ) : step === "course" ? (
                        <CourseStep
                            courses={courses}
                            isLoading={coursesLoading}
                            error={coursesError}
                            hasNextPage={hasNextCoursePage}
                            isFetchingNextPage={isFetchingNextCoursePage}
                            onLoadMore={fetchNextCoursePage}
                            onSelect={handleSelectCourse}
                        />
                    ) : step === "quiz" ? (
                        <QuizStep
                            quizzes={quizzes}
                            isLoading={quizzesLoading}
                            hasNextPage={hasNextQuizPage}
                            isFetchingNextPage={isFetchingNextQuizPage}
                            onLoadMore={fetchNextQuizPage}
                            newQuizTitle={newQuizTitle}
                            onNewQuizTitleChange={setNewQuizTitle}
                            onSelectExisting={handleSelectExistingQuiz}
                            onCreateNew={handleCreateNewQuiz}
                            onBack={() => setStep("course")}
                        />
                    ) : (
                        <ConfirmStep
                            exportTarget={exportTarget}
                            questionCount={questions.length}
                            isUploading={uploadMutation.isPending}
                            onUpload={handleUpload}
                            onBack={() => setStep(mode === "assessment" ? "course" : "quiz")}
                        />
                    )}
                </DialogContent>
            </Dialog>

            <CanvasSettingsDialog open={showSettings} onOpenChange={setShowSettings} />
        </>
    );
}

function CourseStep({
    courses,
    isLoading,
    error,
    hasNextPage,
    isFetchingNextPage,
    onLoadMore,
    onSelect,
}: {
    courses: CanvasCourse[] | undefined;
    isLoading: boolean;
    error: Error | null;
    hasNextPage: boolean;
    isFetchingNextPage: boolean;
    onLoadMore: () => void;
    onSelect: (course: CanvasCourse) => void;
}) {
    if (isLoading) {
        return (
            <div className="space-y-2 py-2">
                {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-12 w-full rounded-md" />
                ))}
            </div>
        );
    }

    if (error) {
        return (
            <p className="py-6 text-center text-sm text-destructive">
                Could not load courses. Check your Canvas credentials in Settings.
            </p>
        );
    }

    if (!courses?.length) {
        return (
            <p className="py-6 text-center text-sm text-muted-foreground">
                No courses found. Make sure you have teacher access to at least one course.
            </p>
        );
    }

    return (
        <div className="space-y-2">
            <ScrollArea className="h-64">
                <div className="space-y-1 pr-3">
                    {courses.map((course) => (
                        <button
                            key={course.id}
                            className="w-full rounded-md px-3 py-2.5 text-left hover:bg-accent transition-colors"
                            onClick={() => onSelect(course)}
                        >
                            <p className="font-medium text-sm">{course.name}</p>
                            <p className="text-xs text-muted-foreground">{course.course_code}</p>
                        </button>
                    ))}
                </div>
            </ScrollArea>
            {hasNextPage && (
                <Button
                    variant="ghost"
                    size="sm"
                    className="w-full"
                    onClick={onLoadMore}
                    disabled={isFetchingNextPage}
                >
                    {isFetchingNextPage ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        "Load more"
                    )}
                </Button>
            )}
        </div>
    );
}

function QuizStep({
    quizzes,
    isLoading,
    hasNextPage,
    isFetchingNextPage,
    onLoadMore,
    newQuizTitle,
    onNewQuizTitleChange,
    onSelectExisting,
    onCreateNew,
    onBack,
}: {
    quizzes: CanvasQuiz[] | undefined;
    isLoading: boolean;
    hasNextPage: boolean;
    isFetchingNextPage: boolean;
    onLoadMore: () => void;
    newQuizTitle: string;
    onNewQuizTitleChange: (title: string) => void;
    onSelectExisting: (quiz: CanvasQuiz) => void;
    onCreateNew: () => void;
    onBack: () => void;
}) {
    return (
        <div className="space-y-4">
            {isLoading ? (
                <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-10 w-full rounded-md" />
                    ))}
                </div>
            ) : quizzes && quizzes.length > 0 ? (
                <>
                    <p className="text-sm text-muted-foreground">Add to existing quiz</p>
                    <ScrollArea className="h-36">
                        <div className="space-y-1 pr-3">
                            {quizzes.map((quiz) => (
                                <button
                                    key={quiz.id}
                                    className="w-full rounded-md px-3 py-2 text-left hover:bg-accent transition-colors"
                                    onClick={() => onSelectExisting(quiz)}
                                >
                                    <div className="flex items-center gap-2">
                                        <p className="font-medium text-sm">{quiz.title}</p>
                                        <span
                                            className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                                                quiz.published
                                                    ? "bg-green-100 text-green-700"
                                                    : "bg-gray-100 text-gray-500"
                                            }`}
                                        >
                                            {quiz.published ? "Published" : "Unpublished"}
                                        </span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </ScrollArea>
                    {hasNextPage && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="w-full"
                            onClick={onLoadMore}
                            disabled={isFetchingNextPage}
                        >
                            {isFetchingNextPage ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                "Load more"
                            )}
                        </Button>
                    )}
                    <Separator />
                </>
            ) : null}

            <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Create new quiz</p>
                <div className="flex gap-2">
                    <Input
                        placeholder="Quiz title"
                        value={newQuizTitle}
                        onChange={(e) => onNewQuizTitleChange(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") onCreateNew();
                        }}
                    />
                    <Button onClick={onCreateNew} disabled={!newQuizTitle.trim()}>
                        Next
                    </Button>
                </div>
            </div>

            <DialogFooter className="sm:justify-start">
                <Button variant="ghost" size="sm" onClick={onBack}>
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Back
                </Button>
            </DialogFooter>
        </div>
    );
}

function ConfirmStep({
    exportTarget,
    questionCount,
    isUploading,
    onUpload,
    onBack,
}: {
    exportTarget: CanvasExportTarget | null;
    questionCount: number;
    isUploading: boolean;
    onUpload: () => void;
    onBack: () => void;
}) {
    if (!exportTarget) return null;

    return (
        <div className="space-y-4">
            <div className="rounded-md border p-4 space-y-1 text-sm">
                <p>
                    <span className="text-muted-foreground">Course: </span>
                    {exportTarget.courseName}
                </p>
                <p>
                    <span className="text-muted-foreground">Quiz: </span>
                    {exportTarget.quizTitle}
                </p>
                <p>
                    <span className="text-muted-foreground">Questions: </span>
                    {questionCount}
                </p>
            </div>

            <DialogFooter>
                <Button variant="outline" onClick={onBack} disabled={isUploading}>
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Back
                </Button>
                <Button onClick={onUpload} disabled={isUploading}>
                    {isUploading ? (
                        <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Uploading {questionCount} question
                            {questionCount !== 1 ? "s" : ""}...
                        </>
                    ) : (
                        "Upload to Canvas"
                    )}
                </Button>
            </DialogFooter>
        </div>
    );
}
