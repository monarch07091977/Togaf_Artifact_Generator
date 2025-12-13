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
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

type EntityType = "businessCapability" | "application" | "businessProcess" | "dataEntity" | "requirement";

interface BulkRelationshipDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: number;
  sourceEntityType: EntityType;
  sourceEntityId: number;
  onSuccess: () => void;
}

export function BulkRelationshipDialog({
  open,
  onOpenChange,
  projectId,
  sourceEntityType,
  sourceEntityId,
  onSuccess,
}: BulkRelationshipDialogProps) {
  const [targetEntityType, setTargetEntityType] = useState<EntityType>("application");
  const [selectedTargetIds, setSelectedTargetIds] = useState<number[]>([]);
  const [relationshipType, setRelationshipType] = useState("");
  const [description, setDescription] = useState("");

  // Fetch potential target entities
  const { data: targetEntities } = trpc.eaEntity.listEntities.useQuery({
    projectId,
    entityType: targetEntityType,
  });

  const utils = trpc.useUtils();
  const bulkCreateRelationshipsMutation = trpc.bulkOperations.bulkCreateRelationships.useMutation({
    onSuccess: () => {
      toast.success(`Successfully created ${selectedTargetIds.length} relationships`);
      utils.eaEntity.listRelationships.invalidate({ projectId });
      onSuccess();
      onOpenChange(false);
      // Reset form
      setSelectedTargetIds([]);
      setRelationshipType("");
      setDescription("");
    },
    onError: (error) => {
      toast.error(`Failed to create relationships: ${error.message}`);
    },
  });

  const handleSubmit = () => {
    if (selectedTargetIds.length === 0) {
      toast.error("Please select at least one target entity");
      return;
    }
    if (!relationshipType) {
      toast.error("Please select a relationship type");
      return;
    }

    bulkCreateRelationshipsMutation.mutate({
      projectId,
      sourceEntityType,
      sourceEntityId,
      targetEntityType,
      targetEntityIds: selectedTargetIds,
      relationshipType,
      description: description || undefined,
    });
  };

  const toggleTargetSelection = (targetId: number) => {
    setSelectedTargetIds((prev) =>
      prev.includes(targetId)
        ? prev.filter((id) => id !== targetId)
        : [...prev, targetId]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Bulk Relationships</DialogTitle>
          <DialogDescription>
            Create relationships from the selected source entity to multiple target entities.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="targetEntityType">Target Entity Type</Label>
            <Select value={targetEntityType} onValueChange={(value) => {
              setTargetEntityType(value as EntityType);
              setSelectedTargetIds([]);
            }}>
              <SelectTrigger id="targetEntityType">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="businessCapability">Business Capability</SelectItem>
                <SelectItem value="application">Application</SelectItem>
                <SelectItem value="businessProcess">Business Process</SelectItem>
                <SelectItem value="dataEntity">Data Entity</SelectItem>
                <SelectItem value="requirement">Requirement</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="relationshipType">Relationship Type</Label>
            <Select value={relationshipType} onValueChange={setRelationshipType}>
              <SelectTrigger id="relationshipType">
                <SelectValue placeholder="Select relationship type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SUPPORTS">Supports</SelectItem>
                <SelectItem value="DEPENDS_ON">Depends On</SelectItem>
                <SelectItem value="REALIZES">Realizes</SelectItem>
                <SelectItem value="USES">Uses</SelectItem>
                <SelectItem value="PROVIDES_DATA_TO">Provides Data To</SelectItem>
                <SelectItem value="CONSUMES_DATA_FROM">Consumes Data From</SelectItem>
                <SelectItem value="TRACES_TO">Traces To</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Describe the relationship..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Select Target Entities ({selectedTargetIds.length} selected)</Label>
            <div className="border rounded-md p-4 max-h-[300px] overflow-y-auto space-y-2">
              {targetEntities && targetEntities.length > 0 ? (
                targetEntities.map((entity: any) => (
                  <div
                    key={entity.id}
                    className={`p-3 border rounded cursor-pointer transition-colors ${
                      selectedTargetIds.includes(entity.id)
                        ? "bg-primary/10 border-primary"
                        : "hover:bg-muted"
                    }`}
                    onClick={() => toggleTargetSelection(entity.id)}
                  >
                    <div className="font-medium">{entity.name}</div>
                    {entity.description && (
                      <div className="text-sm text-muted-foreground line-clamp-1">
                        {entity.description}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-sm text-muted-foreground text-center py-8">
                  No {targetEntityType} entities found
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              selectedTargetIds.length === 0 ||
              !relationshipType ||
              bulkCreateRelationshipsMutation.isPending
            }
          >
            {bulkCreateRelationshipsMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Create {selectedTargetIds.length} Relationships
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
