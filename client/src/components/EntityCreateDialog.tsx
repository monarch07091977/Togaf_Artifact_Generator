import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

type EntityType = 'businessCapability' | 'application' | 'businessProcess' | 'dataEntity' | 'requirement';

interface EntityCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: number;
  entityType: EntityType;
  onSuccess: () => void;
}

export function EntityCreateDialog({
  open,
  onOpenChange,
  projectId,
  entityType,
  onSuccess,
}: EntityCreateDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [level, setLevel] = useState("1");
  const [lifecycle, setLifecycle] = useState("development");
  const [sensitivity, setSensitivity] = useState("internal");
  const [priority, setPriority] = useState("medium");
  const [type, setType] = useState("functional");

  const utils = trpc.useUtils();

  const createBusinessCapability = trpc.eaEntity.createBusinessCapability.useMutation({
    onSuccess: () => {
      toast.success("Business Capability created successfully");
      utils.eaEntity.listEntities.invalidate();
      resetForm();
      onSuccess();
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(`Failed to create: ${error.message}`);
    },
  });

  const createApplication = trpc.eaEntity.createApplication.useMutation({
    onSuccess: () => {
      toast.success("Application created successfully");
      utils.eaEntity.listEntities.invalidate();
      resetForm();
      onSuccess();
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(`Failed to create: ${error.message}`);
    },
  });

  const createBusinessProcess = trpc.eaEntity.createBusinessProcess.useMutation({
    onSuccess: () => {
      toast.success("Business Process created successfully");
      utils.eaEntity.listEntities.invalidate();
      resetForm();
      onSuccess();
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(`Failed to create: ${error.message}`);
    },
  });

  const createDataEntity = trpc.eaEntity.createDataEntity.useMutation({
    onSuccess: () => {
      toast.success("Data Entity created successfully");
      utils.eaEntity.listEntities.invalidate();
      resetForm();
      onSuccess();
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(`Failed to create: ${error.message}`);
    },
  });

  const createRequirement = trpc.eaEntity.createRequirement.useMutation({
    onSuccess: () => {
      toast.success("Requirement created successfully");
      utils.eaEntity.listEntities.invalidate();
      resetForm();
      onSuccess();
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(`Failed to create: ${error.message}`);
    },
  });

  const resetForm = () => {
    setName("");
    setDescription("");
    setLevel("1");
    setLifecycle("development");
    setSensitivity("internal");
    setPriority("medium");
    setType("functional");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }

    const baseData = {
      projectId,
      name: name.trim(),
      description: description.trim() || undefined,
    };

    switch (entityType) {
      case 'businessCapability':
        createBusinessCapability.mutate({
          ...baseData,
          level: parseInt(level),
        });
        break;
      case 'application':
        createApplication.mutate({
          ...baseData,
          lifecycle: lifecycle as any,
        });
        break;
      case 'businessProcess':
        createBusinessProcess.mutate(baseData);
        break;
      case 'dataEntity':
        createDataEntity.mutate({
          ...baseData,
          sensitivity: sensitivity as any,
        });
        break;
      case 'requirement':
        createRequirement.mutate({
          ...baseData,
          type: type as any,
          priority: priority as any,
        });
        break;
    }
  };

  const isLoading =
    createBusinessCapability.isPending ||
    createApplication.isPending ||
    createBusinessProcess.isPending ||
    createDataEntity.isPending ||
    createRequirement.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            Create {entityType === 'businessCapability' ? 'Business Capability' :
                    entityType === 'application' ? 'Application' :
                    entityType === 'businessProcess' ? 'Business Process' :
                    entityType === 'dataEntity' ? 'Data Entity' :
                    'Requirement'}
          </DialogTitle>
          <DialogDescription>
            Add a new entity to your enterprise architecture meta-model
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter entity name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter description (optional)"
              rows={3}
            />
          </div>

          {entityType === 'businessCapability' && (
            <div className="space-y-2">
              <Label htmlFor="level">Level</Label>
              <Select value={level} onValueChange={setLevel}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Level 1 (Strategic)</SelectItem>
                  <SelectItem value="2">Level 2 (Tactical)</SelectItem>
                  <SelectItem value="3">Level 3 (Operational)</SelectItem>
                  <SelectItem value="4">Level 4 (Detailed)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {entityType === 'application' && (
            <div className="space-y-2">
              <Label htmlFor="lifecycle">Lifecycle</Label>
              <Select value={lifecycle} onValueChange={setLifecycle}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="development">Development</SelectItem>
                  <SelectItem value="production">Production</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="retirement">Retirement</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {entityType === 'dataEntity' && (
            <div className="space-y-2">
              <Label htmlFor="sensitivity">Sensitivity</Label>
              <Select value={sensitivity} onValueChange={setSensitivity}>
                <SelectTrigger>
                  <SelectValue />
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

          {entityType === 'requirement' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="functional">Functional</SelectItem>
                    <SelectItem value="non-functional">Non-Functional</SelectItem>
                    <SelectItem value="constraint">Constraint</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger>
                    <SelectValue />
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
              onClick={() => {
                resetForm();
                onOpenChange(false);
              }}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
