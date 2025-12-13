import { useState } from "react";
import { useLocation, useRoute } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Building2, Boxes, GitBranch, Database, FileText, Network, List, Link, Upload } from "lucide-react";
import { toast } from "sonner";
import { EntityCreateDialog } from "@/components/EntityCreateDialog";
import { EntityDetailDialog } from "@/components/EntityDetailDialog";
import { RelationshipGraph } from "@/components/RelationshipGraph";
import { RelationshipCreateDialog } from "@/components/RelationshipCreateDialog";
import { ImportDialog } from "@/components/ImportDialog";
import { GlobalSearch } from "@/components/GlobalSearch";
import FilterPanel, { type FilterConfig } from "@/components/FilterPanel";
import SavedViewsDropdown from "@/components/SavedViewsDropdown";
import { BulkActionBar } from "@/components/BulkActionBar";
import { Checkbox } from "@/components/ui/checkbox";
import { BulkUpdateDialog } from "@/components/BulkUpdateDialog";
import { BulkDeleteConfirmDialog } from "@/components/BulkDeleteConfirmDialog";
import { BulkRelationshipDialog } from "@/components/BulkRelationshipDialog";

type EntityType = 'businessCapability' | 'application' | 'businessProcess' | 'dataEntity' | 'requirement';

const ENTITY_CONFIG = {
  businessCapability: {
    label: 'Business Capabilities',
    icon: Building2,
    description: 'Abilities or capacities that a business may possess or exchange',
    color: 'bg-blue-100 text-blue-800',
  },
  application: {
    label: 'Applications',
    icon: Boxes,
    description: 'Deployed and operational IT systems that support business functions',
    color: 'bg-green-100 text-green-800',
  },
  businessProcess: {
    label: 'Business Processes',
    icon: GitBranch,
    description: 'Structured activities that produce a specific service or product',
    color: 'bg-purple-100 text-purple-800',
  },
  dataEntity: {
    label: 'Data Entities',
    icon: Database,
    description: 'Encapsulation of data recognized by a business domain expert',
    color: 'bg-orange-100 text-orange-800',
  },
  requirement: {
    label: 'Requirements',
    icon: FileText,
    description: 'Statements of need that must be met by the architecture',
    color: 'bg-pink-100 text-pink-800',
  },
};

interface EntityListProps {
  projectId: number;
  entityType: EntityType;
  onCreateClick: () => void;
  onImportClick: () => void;
  onEntityClick: (entity: any) => void;
  selectedEntities: Set<number>;
  onToggleSelection: (entityId: number) => void;
  onClearSelection: () => void;
  onSelectAll: (entityIds: number[]) => void;
  onBulkDelete: () => void;
  onBulkUpdate: () => void;
  onBulkCreateRelationships: () => void;
  onExportCSV: () => void;
}

function EntityList({ projectId, entityType, onCreateClick, onImportClick, onEntityClick, selectedEntities, onToggleSelection, onClearSelection, onSelectAll, onBulkDelete, onBulkUpdate, onBulkCreateRelationships, onExportCSV }: EntityListProps) {
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<FilterConfig>({});
  const config = ENTITY_CONFIG[entityType];
  const Icon = config.icon;

  // Calculate active filter count
  const activeFilterCount = Object.values(filters).filter(value => {
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'object' && value !== null) return Object.keys(value).length > 0;
    return value !== undefined;
  }).length;

  const { data: entities, isLoading } = trpc.eaEntity.listEntities.useQuery({
    projectId,
    entityType,
    search: search || undefined,
    limit: 50,
    ...filters,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Loading {config.label.toLowerCase()}...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={`Search ${config.label.toLowerCase()}...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <SavedViewsDropdown
          projectId={projectId}
          currentFilters={filters}
          onLoadView={(loadedFilters) => setFilters(loadedFilters)}
        />
        <Button onClick={onImportClick} variant="outline">
          <Upload className="h-4 w-4 mr-2" />
          Import
        </Button>
        <Button onClick={onCreateClick}>
          <Plus className="h-4 w-4 mr-2" />
          Create {config.label.slice(0, -1)}
        </Button>
      </div>

      <FilterPanel
        entityType={entityType}
        filters={filters}
        onFiltersChange={setFilters}
        activeFilterCount={activeFilterCount}
      />

      {entities && entities.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Icon className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">
              {search
                ? `No ${config.label.toLowerCase()} found matching "${search}"`
                : `No ${config.label.toLowerCase()} yet. Create your first one to get started.`}
            </p>
            {!search && (
              <Button onClick={onCreateClick} className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                Create {config.label.slice(0, -1)}
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {entities?.map((entity: any) => (
            <Card
              key={entity.id}
              className="hover:shadow-lg transition-shadow relative"
            >
              <div className="absolute top-3 left-3 z-10">
                <Checkbox
                  checked={selectedEntities.has(entity.id)}
                  onCheckedChange={() => onToggleSelection(entity.id)}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
              <div className="cursor-pointer" onClick={() => onEntityClick(entity)}>
              <CardHeader className="pl-12">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className="h-5 w-5 text-muted-foreground" />
                    <CardTitle className="text-lg">{entity.name}</CardTitle>
                  </div>
                  <Badge className={config.color} variant="secondary">
                    {entityType === 'businessCapability' && entity.level && `L${entity.level}`}
                    {entityType === 'application' && entity.lifecycle}
                    {entityType === 'dataEntity' && entity.sensitivity}
                    {entityType === 'requirement' && entity.priority}
                  </Badge>
                </div>
                {entity.description && (
                  <CardDescription className="line-clamp-2">
                    {entity.description}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>ID: {entity.id}</span>
                  {entity.normalizedName && (
                    <span className="text-xs truncate max-w-[150px]" title={entity.normalizedName}>
                      {entity.normalizedName}
                    </span>
                  )}
                </div>
              </CardContent>
              </div>
            </Card>
          ))}
        </div>
      )}

      {entities && entities.length > 0 && (
        <div className="text-sm text-muted-foreground text-center">
          Showing {entities.length} {config.label.toLowerCase()}
        </div>
      )}

      {/* Bulk Action Bar */}
      <BulkActionBar
        selectedCount={selectedEntities.size}
        totalCount={entities?.length || 0}
        onClearSelection={onClearSelection}
        onSelectAll={() => onSelectAll(entities?.map((e: any) => e.id) || [])}
        onBulkDelete={onBulkDelete}
        onBulkUpdate={onBulkUpdate}
        onBulkCreateRelationships={onBulkCreateRelationships}
        onExportCSV={onExportCSV}
      />
    </div>
  );
}

interface GraphViewProps {
  projectId: number;
  onEntityClick: (entity: any) => void;
}

function GraphView({ projectId, onEntityClick }: GraphViewProps) {
  // Fetch all entities across all types
  const { data: businessCapabilities } = trpc.eaEntity.listEntities.useQuery({
    projectId,
    entityType: 'businessCapability',
  });
  const { data: applications } = trpc.eaEntity.listEntities.useQuery({
    projectId,
    entityType: 'application',
  });
  const { data: businessProcesses } = trpc.eaEntity.listEntities.useQuery({
    projectId,
    entityType: 'businessProcess',
  });
  const { data: dataEntities } = trpc.eaEntity.listEntities.useQuery({
    projectId,
    entityType: 'dataEntity',
  });
  const { data: requirements } = trpc.eaEntity.listEntities.useQuery({
    projectId,
    entityType: 'requirement',
  });

  // Fetch all relationships for the project
  const { data: allRelationships } = trpc.eaEntity.listRelationships.useQuery({
    projectId,
  });

  // Combine all entities
  const allEntities = [
    ...(businessCapabilities?.map((e: any) => ({ ...e, type: 'businessCapability' })) || []),
    ...(applications?.map((e: any) => ({ ...e, type: 'application' })) || []),
    ...(businessProcesses?.map((e: any) => ({ ...e, type: 'businessProcess' })) || []),
    ...(dataEntities?.map((e: any) => ({ ...e, type: 'dataEntity' })) || []),
    ...(requirements?.map((e: any) => ({ ...e, type: 'requirement' })) || []),
  ];

  return (
    <RelationshipGraph
      entities={allEntities}
      relationships={allRelationships || []}
      onNodeClick={onEntityClick}
    />
  );
}

export default function EAEntityBrowser() {
  const [, params] = useRoute("/projects/:projectId/ea-entities");
  const projectId = params?.projectId ? parseInt(params.projectId) : null;
  const [activeTab, setActiveTab] = useState<EntityType>('businessCapability');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState<any>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'graph'>('list');
  const [relationshipDialogOpen, setRelationshipDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [selectedEntities, setSelectedEntities] = useState<Set<number>>(new Set());
  const [bulkUpdateDialogOpen, setBulkUpdateDialogOpen] = useState(false);
  const [bulkRelationshipDialogOpen, setBulkRelationshipDialogOpen] = useState(false);
  const [bulkDeleteConfirmOpen, setBulkDeleteConfirmOpen] = useState(false);

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

  const handleCreateClick = () => {
    setCreateDialogOpen(true);
  };

  const handleImportClick = () => {
    setImportDialogOpen(true);
  };

  const handleCreateSuccess = () => {
    // Dialog will invalidate queries automatically
  };

  const handleEntityClick = (entity: any) => {
    setSelectedEntity(entity);
    setDetailDialogOpen(true);
  };

  // Bulk operation handlers
  const handleToggleSelection = (entityId: number) => {
    setSelectedEntities(prev => {
      const newSet = new Set(prev);
      if (newSet.has(entityId)) {
        newSet.delete(entityId);
      } else {
        newSet.add(entityId);
      }
      return newSet;
    });
  };

  const handleClearSelection = () => {
    setSelectedEntities(new Set());
  };

  const handleSelectAll = (entityIds: number[]) => {
    setSelectedEntities(new Set(entityIds));
  };

  const handleBulkDelete = () => {
    setBulkDeleteConfirmOpen(true);
  };

  const handleBulkUpdate = () => {
    setBulkUpdateDialogOpen(true);
  };

  const handleBulkCreateRelationships = () => {
    setBulkRelationshipDialogOpen(true);
  };

  const handleExportCSV = () => {
    const entityIds = Array.from(selectedEntities);
    // TODO: Implement CSV export
    toast.success(`Exporting ${entityIds.length} entities to CSV...`);
  };

  return (
    <div className="container py-8 space-y-6">
      {/* Global Search */}
      <div className="mb-6">
        <GlobalSearch />
      </div>
      
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">EA Entity Browser</h1>
          <p className="text-muted-foreground mt-2">
            Browse and manage your Enterprise Architecture meta-model entities
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="default"
            size="sm"
            onClick={() => setRelationshipDialogOpen(true)}
          >
            <Link className="mr-2 h-4 w-4" />
            Create Relationship
          </Button>
          <div className="h-6 w-px bg-border" />
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            <List className="mr-2 h-4 w-4" />
            List
          </Button>
          <Button
            variant={viewMode === 'graph' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('graph')}
          >
            <Network className="mr-2 h-4 w-4" />
            Graph
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as EntityType)}>
        <TabsList className="grid w-full grid-cols-5">
          {Object.entries(ENTITY_CONFIG).map(([type, config]) => {
            const Icon = config.icon;
            return (
              <TabsTrigger key={type} value={type} className="flex items-center gap-2">
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{config.label}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {Object.entries(ENTITY_CONFIG).map(([type, config]) => {
          const Icon = config.icon;
          return (
            <TabsContent key={type} value={type} className="mt-6">
              <Card className="mb-4">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icon className="h-5 w-5" />
                    {config.label}
                  </CardTitle>
                  <CardDescription>{config.description}</CardDescription>
                </CardHeader>
              </Card>
              {viewMode === 'list' ? (
                <EntityList
                  projectId={projectId}
                  entityType={type as EntityType}
                  onCreateClick={handleCreateClick}
                  onImportClick={handleImportClick}
                  onEntityClick={handleEntityClick}
                  selectedEntities={selectedEntities}
                  onToggleSelection={handleToggleSelection}
                  onClearSelection={handleClearSelection}
                  onSelectAll={handleSelectAll}
                  onBulkDelete={handleBulkDelete}
                  onBulkUpdate={handleBulkUpdate}
                  onBulkCreateRelationships={handleBulkCreateRelationships}
                  onExportCSV={handleExportCSV}
                />
              ) : (
                <GraphView
                  projectId={projectId}
                  onEntityClick={handleEntityClick}
                />
              )}
            </TabsContent>
          );
        })}
      </Tabs>

      <EntityCreateDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        projectId={projectId}
        entityType={activeTab}
        onSuccess={handleCreateSuccess}
      />

      <EntityDetailDialog
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        entity={selectedEntity}
        entityType={activeTab}
      />

      <RelationshipCreateDialog
        open={relationshipDialogOpen}
        onOpenChange={setRelationshipDialogOpen}
        projectId={projectId}
        onSuccess={() => {
          // Refresh graph and list views
        }}
      />

      <ImportDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        projectId={projectId}
        entityType={activeTab}
        onSuccess={() => {
          // Refresh list and graph views
        }}
      />

      {/* Bulk Operation Dialogs */}
      <BulkUpdateDialog
        open={bulkUpdateDialogOpen}
        onOpenChange={setBulkUpdateDialogOpen}
        projectId={projectId}
        entityType={activeTab}
        selectedEntityIds={Array.from(selectedEntities)}
        onSuccess={handleClearSelection}
      />

      <BulkDeleteConfirmDialog
        open={bulkDeleteConfirmOpen}
        onOpenChange={setBulkDeleteConfirmOpen}
        projectId={projectId}
        entityType={activeTab}
        selectedEntityIds={Array.from(selectedEntities)}
        onSuccess={handleClearSelection}
      />

      {selectedEntities.size === 1 && (
        <BulkRelationshipDialog
          open={bulkRelationshipDialogOpen}
          onOpenChange={setBulkRelationshipDialogOpen}
          projectId={projectId}
          sourceEntityType={activeTab}
          sourceEntityId={Array.from(selectedEntities)[0]}
          onSuccess={handleClearSelection}
        />
      )}
    </div>
  );
}
