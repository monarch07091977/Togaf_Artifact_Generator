import { useState } from "react";
import { useRoute } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  History, 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  User,
  Clock,
  Filter,
  Database,
  Layers,
  Workflow,
  FileText,
  CheckSquare,
  Link as LinkIcon,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const ENTITY_CONFIG = {
  businessCapability: { label: 'Business Capability', icon: Layers, color: 'bg-blue-100 text-blue-800' },
  application: { label: 'Application', icon: Database, color: 'bg-purple-100 text-purple-800' },
  businessProcess: { label: 'Business Process', icon: Workflow, color: 'bg-green-100 text-green-800' },
  dataEntity: { label: 'Data Entity', icon: FileText, color: 'bg-orange-100 text-orange-800' },
  requirement: { label: 'Requirement', icon: CheckSquare, color: 'bg-pink-100 text-pink-800' },
};

const ACTION_CONFIG = {
  create: { label: 'Created', icon: Plus, color: 'bg-green-100 text-green-800' },
  update: { label: 'Updated', icon: Edit, color: 'bg-blue-100 text-blue-800' },
  delete: { label: 'Deleted', icon: Trash2, color: 'bg-red-100 text-red-800' },
};

export default function AuditHistory() {
  const [, params] = useRoute("/projects/:projectId/audit-history");
  const projectId = params?.projectId ? parseInt(params.projectId) : null;
  
  const [entityTypeFilter, setEntityTypeFilter] = useState<string>('all');
  const [actionTypeFilter, setActionTypeFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [offset, setOffset] = useState(0);
  const limit = 50;

  const { data, isLoading } = trpc.eaEntity.getAuditHistory.useQuery(
    {
      projectId: projectId!,
      entityType: entityTypeFilter as any,
      actionType: actionTypeFilter as any,
      searchTerm: searchTerm || undefined,
      limit,
      offset,
    },
    { enabled: !!projectId }
  );

  if (!projectId) {
    return (
      <div className="container py-8">
        <Card>
          <CardContent className="py-12">
            <p className="text-center text-muted-foreground">
              Project ID not found. Please navigate from a project page.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleLoadMore = () => {
    setOffset(offset + limit);
  };

  const handleReset = () => {
    setOffset(0);
  };

  return (
    <div className="container py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <History className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Audit History</h1>
        </div>
        <p className="text-muted-foreground">
          Complete timeline of all changes to entities and relationships
        </p>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
          <CardDescription>Filter audit events by type, action, or search term</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Entity Type</label>
              <Select value={entityTypeFilter} onValueChange={(value) => { setEntityTypeFilter(value); handleReset(); }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="businessCapability">Business Capabilities</SelectItem>
                  <SelectItem value="application">Applications</SelectItem>
                  <SelectItem value="businessProcess">Business Processes</SelectItem>
                  <SelectItem value="dataEntity">Data Entities</SelectItem>
                  <SelectItem value="requirement">Requirements</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Action Type</label>
              <Select value={actionTypeFilter} onValueChange={(value) => { setActionTypeFilter(value); handleReset(); }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="create">Created</SelectItem>
                  <SelectItem value="update">Updated</SelectItem>
                  <SelectItem value="delete">Deleted</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by entity name..."
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); handleReset(); }}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timeline */}
      {isLoading ? (
        <Card>
          <CardContent className="py-12">
            <p className="text-center text-muted-foreground">Loading audit history...</p>
          </CardContent>
        </Card>
      ) : data && data.events.length > 0 ? (
        <div className="space-y-4">
          {data.events.map((event: any) => {
            const isEntity = event.type === 'entity';
            const entityConfig = isEntity ? ENTITY_CONFIG[event.entityType as keyof typeof ENTITY_CONFIG] : null;
            const actionConfig = ACTION_CONFIG[event.action as keyof typeof ACTION_CONFIG];
            const EntityIcon = entityConfig?.icon || LinkIcon;
            const ActionIcon = actionConfig.icon;

            return (
              <Card key={event.id} className="relative pl-12">
                {/* Timeline dot */}
                <div className="absolute left-4 top-6 w-4 h-4 rounded-full bg-primary border-4 border-background" />
                
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3 flex-1">
                      <EntityIcon className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <CardTitle className="text-base">
                          {isEntity ? (
                            <>
                              <Badge variant="outline" className={entityConfig?.color}>
                                {entityConfig?.label}
                              </Badge>
                              <span className="ml-2 font-semibold">{event.entityName}</span>
                            </>
                          ) : (
                            <>
                              <Badge variant="outline" className="bg-gray-100 text-gray-800">
                                Relationship
                              </Badge>
                              <span className="ml-2 text-sm text-muted-foreground">
                                {event.relationshipType}
                              </span>
                            </>
                          )}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-4 mt-1">
                          <span className="flex items-center gap-1">
                            <ActionIcon className="h-3 w-3" />
                            <Badge variant="secondary" className={actionConfig.color}>
                              {actionConfig.label}
                            </Badge>
                          </span>
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {event.user}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDistanceToNow(new Date(event.timestamp), { addSuffix: true })}
                          </span>
                        </CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>

                {event.details && (
                  <CardContent className="pt-0">
                    <div className="text-sm text-muted-foreground">
                      {event.details.description && (
                        <p className="line-clamp-2">{event.details.description}</p>
                      )}
                      {!isEntity && (
                        <p>
                          {event.sourceEntityType} → {event.targetEntityType}
                        </p>
                      )}
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}

          {/* Load More Button */}
          {data.hasMore && (
            <div className="flex justify-center pt-4">
              <Button onClick={handleLoadMore} variant="outline">
                Load More
              </Button>
            </div>
          )}

          {/* Total Count */}
          <p className="text-center text-sm text-muted-foreground pt-4">
            Showing {data.events.length} of {data.total} events
          </p>
        </div>
      ) : (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <History className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {searchTerm || entityTypeFilter !== 'all' || actionTypeFilter !== 'all'
                  ? 'No events found matching your filters'
                  : 'No audit history yet'}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
