import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

type EntityType = "businessCapability" | "application" | "businessProcess" | "dataEntity" | "requirement";

interface BulkUpdateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: number;
  entityType: EntityType;
  selectedEntityIds: number[];
  onSuccess: () => void;
}

export function BulkUpdateDialog({
  open,
  onOpenChange,
  projectId,
  entityType,
  selectedEntityIds,
  onSuccess,
}: BulkUpdateDialogProps) {
  const [maturityLevel, setMaturityLevel] = useState<string>("");
  const [lifecycle, setLifecycle] = useState<string>("");
  const [sensitivity, setSensitivity] = useState<string>("");
  const [priority, setPriority] = useState<string>("");
  const [requirementType, setRequirementType] = useState<string>("");

  const utils = trpc.useUtils();
  const bulkUpdateMutation = trpc.bulkOperations.bulkUpdate.useMutation({
    onSuccess: () => {
      toast.success(`Successfully updated ${selectedEntityIds.length} entities`);
      utils.eaEntity.listEntities.invalidate({ projectId, entityType });
      onSuccess();
      onOpenChange(false);
      // Reset form
      setMaturityLevel("");
      setLifecycle("");
      setSensitivity("");
      setPriority("");
      setRequirementType("");
    },
    onError: (error) => {
      toast.error(`Failed to update entities: ${error.message}`);
    },
  });

  const handleSubmit = () => {
    const updates: any = {};

    if (maturityLevel) updates.maturityLevel = maturityLevel;
    if (lifecycle) updates.lifecycle = lifecycle;
    if (sensitivity) updates.sensitivity = sensitivity;
    if (priority) updates.priority = priority;
    if (requirementType) updates.requirementType = requirementType;

    if (Object.keys(updates).length === 0) {
      toast.error("Please select at least one field to update");
      return;
    }

    bulkUpdateMutation.mutate({
      projectId,
      entityType,
      entityIds: selectedEntityIds,
      updates,
    });
  };

  const hasChanges =
    maturityLevel || lifecycle || sensitivity || priority || requirementType;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Bulk Update Entities</DialogTitle>
          <DialogDescription>
            Update {selectedEntityIds.length} selected entities. Only fill in the fields you want to change.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Business Capability fields */}
          {entityType === "businessCapability" && (
            <div className="space-y-2">
              <Label htmlFor="maturityLevel">Maturity Level</Label>
              <Select value={maturityLevel} onValueChange={setMaturityLevel}>
                <SelectTrigger id="maturityLevel">
                  <SelectValue placeholder="Select maturity level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="initial">Initial</SelectItem>
                  <SelectItem value="developing">Developing</SelectItem>
                  <SelectItem value="defined">Defined</SelectItem>
                  <SelectItem value="managed">Managed</SelectItem>
                  <SelectItem value="optimizing">Optimizing</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Application fields */}
          {entityType === "application" && (
            <div className="space-y-2">
              <Label htmlFor="lifecycle">Lifecycle Stage</Label>
              <Select value={lifecycle} onValueChange={setLifecycle}>
                <SelectTrigger id="lifecycle">
                  <SelectValue placeholder="Select lifecycle stage" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="plan">Plan</SelectItem>
                  <SelectItem value="develop">Develop</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="retire">Retire</SelectItem>
                  <SelectItem value="retired">Retired</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Data Entity fields */}
          {entityType === "dataEntity" && (
            <div className="space-y-2">
              <Label htmlFor="sensitivity">Sensitivity Level</Label>
              <Select value={sensitivity} onValueChange={setSensitivity}>
                <SelectTrigger id="sensitivity">
                  <SelectValue placeholder="Select sensitivity level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">Public</SelectItem>
                  <SelectItem value="internal">Internal</SelectItem>
                  <SelectItem value="confidential">Confidential</SelectItem>
                  <SelectItem value="restricted">Restricted</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Requirement fields */}
          {entityType === "requirement" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger id="priority">
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="requirementType">Requirement Type</Label>
                <Select value={requirementType} onValueChange={setRequirementType}>
                  <SelectTrigger id="requirementType">
                    <SelectValue placeholder="Select requirement type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="functional">Functional</SelectItem>
                    <SelectItem value="non_functional">Non-Functional</SelectItem>
                    <SelectItem value="constraint">Constraint</SelectItem>
                    <SelectItem value="assumption">Assumption</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          {/* Business Process has no specific fields to update */}
          {entityType === "businessProcess" && (
            <div className="text-sm text-muted-foreground">
              Business Processes don't have additional fields that can be bulk updated.
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!hasChanges || bulkUpdateMutation.isPending}
          >
            {bulkUpdateMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Update {selectedEntityIds.length} Entities
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
