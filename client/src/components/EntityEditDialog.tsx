import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface EntityEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entity: any;
  entityType: string;
  onSuccess?: () => void;
}

export function EntityEditDialog({
  open,
  onOpenChange,
  entity,
  entityType,
  onSuccess,
}: EntityEditDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [level, setLevel] = useState<number | undefined>(undefined);
  const [lifecycle, setLifecycle] = useState<string | undefined>(undefined);
  const [sensitivity, setSensitivity] = useState<string | undefined>(undefined);
  const [type, setType] = useState<string | undefined>(undefined);
  const [priority, setPriority] = useState<string | undefined>(undefined);

  const utils = trpc.useUtils();

  // Initialize form with entity data
  useEffect(() => {
    if (entity && open) {
      setName(entity.name || "");
      setDescription(entity.description || "");
      setLevel(entity.level);
      setLifecycle(entity.lifecycle);
      setSensitivity(entity.sensitivity);
      setType(entity.type);
      setPriority(entity.priority);
    }
  }, [entity, open]);

  const updateEntity = trpc.eaEntity.updateEntity.useMutation({
    onSuccess: () => {
      toast.success("Entity updated successfully");
      utils.eaEntity.listEntities.invalidate();
      utils.eaEntity.listRelationships.invalidate();
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(`Failed to update entity: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }

    const data: any = {
      name: name.trim(),
      description: description.trim() || null,
    };

    // Add entity-specific fields
    if (entityType === 'businessCapability' && level !== undefined) {
      data.level = level;
    }
    if (entityType === 'application' && lifecycle) {
      data.lifecycle = lifecycle;
    }
    if (entityType === 'dataEntity' && sensitivity) {
      data.sensitivity = sensitivity;
    }
    if (entityType === 'requirement') {
      if (type) data.type = type;
      if (priority) data.priority = priority;
    }

    updateEntity.mutate({
      entityType: entityType as any,
      entityId: entity.id,
      projectId: entity.projectId,
      data,
    });
  };

  if (!entity) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit {entityType === 'businessCapability' ? 'Business Capability' :
            entityType === 'application' ? 'Application' :
            entityType === 'businessProcess' ? 'Business Process' :
            entityType === 'dataEntity' ? 'Data Entity' :
            'Requirement'}</DialogTitle>
          <DialogDescription>
            Update the entity properties below
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter entity name"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter description"
              rows={3}
            />
          </div>

          {/* Business Capability specific fields */}
          {entityType === 'businessCapability' && (
            <div>
              <Label htmlFor="level">Level *</Label>
              <Select value={level?.toString()} onValueChange={(v) => setLevel(parseInt(v))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Level 1</SelectItem>
                  <SelectItem value="2">Level 2</SelectItem>
                  <SelectItem value="3">Level 3</SelectItem>
                  <SelectItem value="4">Level 4</SelectItem>
                  <SelectItem value="5">Level 5</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Application specific fields */}
          {entityType === 'application' && (
            <div>
              <Label htmlFor="lifecycle">Lifecycle</Label>
              <Select value={lifecycle} onValueChange={setLifecycle}>
                <SelectTrigger>
                  <SelectValue placeholder="Select lifecycle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="planned">Planned</SelectItem>
                  <SelectItem value="development">Development</SelectItem>
                  <SelectItem value="production">Production</SelectItem>
                  <SelectItem value="deprecated">Deprecated</SelectItem>
                  <SelectItem value="retired">Retired</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Data Entity specific fields */}
          {entityType === 'dataEntity' && (
            <div>
              <Label htmlFor="sensitivity">Sensitivity</Label>
              <Select value={sensitivity} onValueChange={setSensitivity}>
                <SelectTrigger>
                  <SelectValue placeholder="Select sensitivity" />
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

          {/* Requirement specific fields */}
          {entityType === 'requirement' && (
            <>
              <div>
                <Label htmlFor="type">Type</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="functional">Functional</SelectItem>
                    <SelectItem value="non-functional">Non-Functional</SelectItem>
                    <SelectItem value="business">Business</SelectItem>
                    <SelectItem value="technical">Technical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger>
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
            </>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={updateEntity.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={updateEntity.isPending}>
              {updateEntity.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
