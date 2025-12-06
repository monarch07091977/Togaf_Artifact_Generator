import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { trpc } from "@/lib/trpc";
import { Network, ArrowRight, ArrowLeft } from "lucide-react";

interface EntityDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entity: any;
  entityType: string;
}

const RELATIONSHIP_LABELS: Record<string, string> = {
  SUPPORTS: "Supports",
  DEPENDS_ON: "Depends On",
  IMPLEMENTS: "Implements",
  REALIZES: "Realizes",
  FLOWS_TO: "Flows To",
  ORIGINATES_FROM: "Originates From",
  ASSIGNED_TO: "Assigned To",
  OWNS: "Owns",
  SERVES: "Serves",
};

export function EntityDetailDialog({
  open,
  onOpenChange,
  entity,
  entityType,
}: EntityDetailDialogProps) {
  const { data: relationships, isLoading } = trpc.eaEntity.listRelationships.useQuery(
    {
      projectId: entity?.projectId,
      entityType,
      entityId: entity?.id,
    },
    { enabled: !!entity && open }
  );

  if (!entity) return null;

  const outgoingRelationships = relationships?.filter(
    (r: any) => r.sourceEntityType === entityType && r.sourceEntityId === entity.id
  ) || [];

  const incomingRelationships = relationships?.filter(
    (r: any) => r.targetEntityType === entityType && r.targetEntityId === entity.id
  ) || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{entity.name}</DialogTitle>
          <DialogDescription>
            {entityType === 'businessCapability' && 'Business Capability'}
            {entityType === 'application' && 'Application'}
            {entityType === 'businessProcess' && 'Business Process'}
            {entityType === 'dataEntity' && 'Data Entity'}
            {entityType === 'requirement' && 'Requirement'}
            {' • ID: '}{entity.id}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <div>
            <h3 className="text-sm font-semibold mb-2">Description</h3>
            <p className="text-sm text-muted-foreground">
              {entity.description || 'No description provided'}
            </p>
          </div>

          {/* Entity-specific fields */}
          <div className="grid grid-cols-2 gap-4">
            {entity.level && (
              <div>
                <h4 className="text-sm font-medium mb-1">Level</h4>
                <Badge variant="secondary">Level {entity.level}</Badge>
              </div>
            )}
            {entity.lifecycle && (
              <div>
                <h4 className="text-sm font-medium mb-1">Lifecycle</h4>
                <Badge variant="secondary">{entity.lifecycle}</Badge>
              </div>
            )}
            {entity.sensitivity && (
              <div>
                <h4 className="text-sm font-medium mb-1">Sensitivity</h4>
                <Badge variant="secondary">{entity.sensitivity}</Badge>
              </div>
            )}
            {entity.priority && (
              <div>
                <h4 className="text-sm font-medium mb-1">Priority</h4>
                <Badge variant="secondary">{entity.priority}</Badge>
              </div>
            )}
            {entity.type && (
              <div>
                <h4 className="text-sm font-medium mb-1">Type</h4>
                <Badge variant="secondary">{entity.type}</Badge>
              </div>
            )}
          </div>

          <Separator />

          {/* Relationships */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Network className="h-5 w-5" />
              <h3 className="text-lg font-semibold">Relationships</h3>
            </div>

            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading relationships...</p>
            ) : (
              <div className="space-y-4">
                {/* Outgoing Relationships */}
                {outgoingRelationships.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center gap-2">
                        <ArrowRight className="h-4 w-4" />
                        Outgoing ({outgoingRelationships.length})
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Relationships where this entity is the source
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {outgoingRelationships.map((rel: any) => (
                          <div key={rel.id} className="flex items-center gap-2 text-sm p-2 rounded-md bg-muted/50">
                            <Badge variant="outline" className="text-xs">
                              {RELATIONSHIP_LABELS[rel.relationshipType] || rel.relationshipType}
                            </Badge>
                            <ArrowRight className="h-3 w-3 text-muted-foreground" />
                            <span className="font-medium">{rel.targetEntityType}</span>
                            <span className="text-muted-foreground">#{rel.targetEntityId}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Incoming Relationships */}
                {incomingRelationships.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center gap-2">
                        <ArrowLeft className="h-4 w-4" />
                        Incoming ({incomingRelationships.length})
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Relationships where this entity is the target
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {incomingRelationships.map((rel: any) => (
                          <div key={rel.id} className="flex items-center gap-2 text-sm p-2 rounded-md bg-muted/50">
                            <span className="font-medium">{rel.sourceEntityType}</span>
                            <span className="text-muted-foreground">#{rel.sourceEntityId}</span>
                            <ArrowRight className="h-3 w-3 text-muted-foreground" />
                            <Badge variant="outline" className="text-xs">
                              {RELATIONSHIP_LABELS[rel.relationshipType] || rel.relationshipType}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {outgoingRelationships.length === 0 && incomingRelationships.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No relationships found for this entity
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
