// DeleteWarningModal - Warning modal showing where items are used before deletion

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertTriangle, Loader2 } from "lucide-react";

interface UsageItem {
  id: string;
  name: string;
  type: string;
}

interface DeleteWarningModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemName: string;
  itemType: string;
  usedIn: UsageItem[];
  isLoadingUsage?: boolean;
  onConfirmDelete: () => void;
  isDeleting?: boolean;
}

export function DeleteWarningModal({
  open,
  onOpenChange,
  itemName,
  itemType,
  usedIn,
  isLoadingUsage,
  onConfirmDelete,
  isDeleting,
}: DeleteWarningModalProps) {
  const hasUsage = usedIn.length > 0;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            {hasUsage && <AlertTriangle className="h-5 w-5 text-amber-500" />}
            Delete {itemType}?
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3">
              <p>
                Are you sure you want to delete <strong>"{itemName}"</strong>?
              </p>

              {isLoadingUsage ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Checking usage...
                </div>
              ) : hasUsage ? (
                <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-md p-3">
                  <p className="text-sm text-amber-800 dark:text-amber-200 font-medium mb-2">
                    This {itemType.toLowerCase()} is currently used in:
                  </p>
                  <ul className="text-sm text-amber-700 dark:text-amber-300 space-y-1 list-disc list-inside">
                    {usedIn.slice(0, 5).map((item) => (
                      <li key={item.id}>
                        {item.name} ({item.type})
                      </li>
                    ))}
                    {usedIn.length > 5 && (
                      <li className="text-muted-foreground">
                        ...and {usedIn.length - 5} more
                      </li>
                    )}
                  </ul>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  This {itemType.toLowerCase()} is not currently used anywhere.
                </p>
              )}

              {hasUsage && (
                <p className="text-sm text-muted-foreground">
                  Deleting this will remove it from all the items listed above.
                </p>
              )}

              <p className="text-sm text-destructive">
                This action cannot be undone.
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              onConfirmDelete();
            }}
            disabled={isDeleting || isLoadingUsage}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Deleting...
              </>
            ) : (
              "Delete"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
