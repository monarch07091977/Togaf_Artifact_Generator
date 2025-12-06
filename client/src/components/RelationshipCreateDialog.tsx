import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { ArrowRight } from "lucide-react";

type EntityType = 'businessCapability' | 'application' | 'businessProcess' | 'dataEntity' | 'requirement';

interface RelationshipCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: number;
  onSuccess: () => void;
}

// Relationship type matrix - defines which relationship types are allowed between entity types
const RELATIONSHIP_MATRIX: Record<string, string[]> = {
  'businessCapability-businessCapability': ['SUPPORTS', 'DEPENDS_ON'],
  'businessCapability-application': ['REALIZES'],
  'businessCapability-businessProcess': ['SUPPORTS'],
  'application-application': ['DEPENDS_ON', 'FLOWS_TO'],
  'application-businessProcess': ['SUPPORTS', 'IMPLEMENTS'],
  'application-dataEntity': ['OWNS', 'FLOWS_TO', 'ORIGINATES_FROM'],
  'businessProcess-businessProcess': ['DEPENDS_ON', 'FLOWS_TO'],
  'businessProcess-dataEntity': ['FLOWS_TO', 'ORIGINATES_FROM'],
  'businessProcess-requirement': ['IMPLEMENTS'],
  'dataEntity-dataEntity': ['DEPENDS_ON', 'FLOWS_TO'],
  'requirement-businessCapability': ['ASSIGNED_TO'],
  'requirement-application': ['ASSIGNED_TO'],
  'requirement-businessProcess': ['ASSIGNED_TO'],
};

const RELATIONSHIP_LABELS: Record<string, string> = {
  SUPPORTS: 'Supports',
  DEPENDS_ON: 'Depends On',
  IMPLEMENTS: 'Implements',
  REALIZES: 'Realizes',
  FLOWS_TO: 'Flows To',
  ORIGINATES_FROM: 'Originates From',
  ASSIGNED_TO: 'Assigned To',
  OWNS: 'Owns',
  SERVES: 'Serves',
};

const ENTITY_TYPE_LABELS: Record<EntityType, string> = {
  businessCapability: 'Business Capability',
  application: 'Application',
  businessProcess: 'Business Process',
  dataEntity: 'Data Entity',
  requirement: 'Requirement',
};

export function RelationshipCreateDialog({
  open,
  onOpenChange,
  projectId,
  onSuccess,
}: RelationshipCreateDialogProps) {
  const [sourceEntityType, setSourceEntityType] = useState<EntityType | ''>('');
  const [sourceEntityId, setSourceEntityId] = useState<number | null>(null);
  const [targetEntityType, setTargetEntityType] = useState<EntityType | ''>('');
  const [targetEntityId, setTargetEntityId] = useState<number | null>(null);
  const [relationshipType, setRelationshipType] = useState<string>('');
  const [description, setDescription] = useState('');

  const utils = trpc.useUtils();

  // Fetch source entities
  const { data: sourceEntities } = trpc.eaEntity.listEntities.useQuery(
    { projectId, entityType: sourceEntityType as EntityType },
    { enabled: !!sourceEntityType }
  );

  // Fetch target entities
  const { data: targetEntities } = trpc.eaEntity.listEntities.useQuery(
    { projectId, entityType: targetEntityType as EntityType },
    { enabled: !!targetEntityType }
  );

  // Get allowed relationship types based on source and target entity types
  const allowedRelationshipTypes = useMemo(() => {
    if (!sourceEntityType || !targetEntityType) return [];
    const key = `${sourceEntityType}-${targetEntityType}`;
    return RELATIONSHIP_MATRIX[key] || [];
  }, [sourceEntityType, targetEntityType]);

  const createRelationship = trpc.eaEntity.createRelationship.useMutation({
    onSuccess: () => {
      toast.success("Relationship created successfully");
      utils.eaEntity.listRelationships.invalidate();
      resetForm();
      onSuccess();
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(`Failed to create relationship: ${error.message}`);
    },
  });

  const resetForm = () => {
    setSourceEntityType('');
    setSourceEntityId(null);
    setTargetEntityType('');
    setTargetEntityId(null);
    setRelationshipType('');
    setDescription('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!sourceEntityType || !sourceEntityId || !targetEntityType || !targetEntityId || !relationshipType) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (sourceEntityType === targetEntityType && sourceEntityId === targetEntityId) {
      toast.error("Source and target must be different entities");
      return;
    }

    createRelationship.mutate({
      projectId,
      sourceEntityType,
      sourceEntityId,
      targetEntityType,
      targetEntityId,
      relationshipType,
      description: description.trim() || undefined,
    });
  };

  // Reset relationship type when entity types change
  const handleSourceTypeChange = (value: EntityType) => {
    setSourceEntityType(value);
    setSourceEntityId(null);
    setRelationshipType('');
  };

  const handleTargetTypeChange = (value: EntityType) => {
    setTargetEntityType(value);
    setTargetEntityId(null);
    setRelationshipType('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create Relationship</DialogTitle>
          <DialogDescription>
            Create a relationship between two EA entities. Only valid relationship types are shown.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Source Entity */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="flex-1 space-y-2">
                <Label>Source Entity Type *</Label>
                <Select value={sourceEntityType} onValueChange={handleSourceTypeChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(ENTITY_TYPE_LABELS).map(([type, label]) => (
                      <SelectItem key={type} value={type}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex-1 space-y-2">
                <Label>Source Entity *</Label>
                <Select
                  value={sourceEntityId?.toString() || ''}
                  onValueChange={(v) => setSourceEntityId(parseInt(v))}
                  disabled={!sourceEntityType}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select entity" />
                  </SelectTrigger>
                  <SelectContent>
                    {sourceEntities?.map((entity: any) => (
                      <SelectItem key={entity.id} value={entity.id.toString()}>
                        {entity.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Relationship Type */}
          <div className="flex items-center justify-center">
            <div className="flex items-center gap-2 text-muted-foreground">
              <ArrowRight className="h-5 w-5" />
              <span className="text-sm font-medium">
                {relationshipType ? RELATIONSHIP_LABELS[relationshipType] : 'Select relationship'}
              </span>
              <ArrowRight className="h-5 w-5" />
            </div>
          </div>

          {/* Target Entity */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="flex-1 space-y-2">
                <Label>Target Entity Type *</Label>
                <Select value={targetEntityType} onValueChange={handleTargetTypeChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(ENTITY_TYPE_LABELS).map(([type, label]) => (
                      <SelectItem key={type} value={type}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex-1 space-y-2">
                <Label>Target Entity *</Label>
                <Select
                  value={targetEntityId?.toString() || ''}
                  onValueChange={(v) => setTargetEntityId(parseInt(v))}
                  disabled={!targetEntityType}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select entity" />
                  </SelectTrigger>
                  <SelectContent>
                    {targetEntities?.map((entity: any) => (
                      <SelectItem key={entity.id} value={entity.id.toString()}>
                        {entity.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Relationship Type Selector */}
          <div className="space-y-2">
            <Label>Relationship Type *</Label>
            <Select
              value={relationshipType}
              onValueChange={setRelationshipType}
              disabled={allowedRelationshipTypes.length === 0}
            >
              <SelectTrigger>
                <SelectValue placeholder={
                  allowedRelationshipTypes.length === 0
                    ? "Select source and target types first"
                    : "Select relationship type"
                } />
              </SelectTrigger>
              <SelectContent>
                {allowedRelationshipTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {RELATIONSHIP_LABELS[type]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {sourceEntityType && targetEntityType && allowedRelationshipTypes.length === 0 && (
              <p className="text-xs text-destructive">
                No valid relationship types between {ENTITY_TYPE_LABELS[sourceEntityType]} and {ENTITY_TYPE_LABELS[targetEntityType]}
              </p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe this relationship..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                resetForm();
                onOpenChange(false);
              }}
              disabled={createRelationship.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createRelationship.isPending}>
              {createRelationship.isPending ? "Creating..." : "Create Relationship"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
