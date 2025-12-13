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
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

type EntityType = "businessCapability" | "application" | "businessProcess" | "dataEntity" | "requirement";

interface BulkDeleteConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: number;
  entityType: EntityType;
  selectedEntityIds: number[];
  onSuccess: () => void;
}

export function BulkDeleteConfirmDialog({
  open,
  onOpenChange,
  projectId,
  entityType,
  selectedEntityIds,
  onSuccess,
}: BulkDeleteConfirmDialogProps) {
  const utils = trpc.useUtils();
  const bulkDeleteMutation = trpc.bulkOperations.bulkDelete.useMutation({
    onSuccess: () => {
      toast.success(`Successfully deleted ${selectedEntityIds.length} entities`);
      utils.eaEntity.listEntities.invalidate({ projectId, entityType });
      onSuccess();
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(`Failed to delete entities: ${error.message}`);
    },
  });

  const handleConfirm = () => {
    bulkDeleteMutation.mutate({
      projectId,
      entityType,
      entityIds: selectedEntityIds,
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete {selectedEntityIds.length} selected entities and all their
            relationships. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={bulkDeleteMutation.isPending}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={bulkDeleteMutation.isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {bulkDeleteMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Delete {selectedEntityIds.length} Entities
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
