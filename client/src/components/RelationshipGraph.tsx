import { useCallback, useEffect, useMemo, useState } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
} from 'reactflow';
import 'reactflow/dist/style.css';
import CustomEntityNode from './CustomEntityNode';
import { transformToGraphData, getLayoutedElements, filterGraphData, EntityNode, EntityRelationship } from '@/lib/graphUtils';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { LayoutGrid, Download, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

const nodeTypes = {
  custom: CustomEntityNode,
};

interface RelationshipGraphProps {
  entities: EntityNode[];
  relationships: EntityRelationship[];
  onNodeClick?: (entity: EntityNode) => void;
}

export function RelationshipGraph({
  entities,
  relationships,
  onNodeClick,
}: RelationshipGraphProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [layoutDirection, setLayoutDirection] = useState<'TB' | 'LR'>('TB');
  const [entityTypeFilter, setEntityTypeFilter] = useState<Set<string>>(new Set());
  const [relationshipTypeFilter, setRelationshipTypeFilter] = useState<Set<string>>(new Set());

  // Get unique entity types and relationship types
  const entityTypes = useMemo(() => {
    const types = new Set<string>();
    entities.forEach((e) => types.add(e.type));
    return Array.from(types);
  }, [entities]);

  const relationshipTypes = useMemo(() => {
    const types = new Set<string>();
    relationships.forEach((r) => types.add(r.relationshipType));
    return Array.from(types);
  }, [relationships]);

  // Transform and layout graph data
  useEffect(() => {
    if (entities.length === 0) {
      setNodes([]);
      setEdges([]);
      return;
    }

    const { nodes: rawNodes, edges: rawEdges } = transformToGraphData(entities, relationships);
    const { nodes: filteredNodes, edges: filteredEdges } = filterGraphData(
      rawNodes,
      rawEdges,
      entityTypeFilter,
      relationshipTypeFilter
    );
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
      filteredNodes,
      filteredEdges,
      layoutDirection
    );

    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
  }, [entities, relationships, layoutDirection, entityTypeFilter, relationshipTypeFilter, setNodes, setEdges]);

  const handleNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      if (onNodeClick && node.data.entity) {
        onNodeClick(node.data.entity);
      }
    },
    [onNodeClick]
  );

  const toggleEntityTypeFilter = (type: string) => {
    setEntityTypeFilter((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(type)) {
        newSet.delete(type);
      } else {
        newSet.add(type);
      }
      return newSet;
    });
  };

  const toggleRelationshipTypeFilter = (type: string) => {
    setRelationshipTypeFilter((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(type)) {
        newSet.delete(type);
      } else {
        newSet.add(type);
      }
      return newSet;
    });
  };

  const clearFilters = () => {
    setEntityTypeFilter(new Set());
    setRelationshipTypeFilter(new Set());
  };

  if (entities.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">No entities to visualize. Create some entities first.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card className="p-4">
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-semibold mb-2">Entity Types</h4>
            <div className="flex flex-wrap gap-2">
              {entityTypes.map((type) => (
                <Badge
                  key={type}
                  variant={entityTypeFilter.has(type) ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => toggleEntityTypeFilter(type)}
                >
                  {type}
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-2">Relationship Types</h4>
            <div className="flex flex-wrap gap-2">
              {relationshipTypes.map((type) => (
                <Badge
                  key={type}
                  variant={relationshipTypeFilter.has(type) ? 'default' : 'outline'}
                  className="cursor-pointer text-xs"
                  onClick={() => toggleRelationshipTypeFilter(type)}
                >
                  {type.replace(/_/g, ' ')}
                </Badge>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setLayoutDirection(layoutDirection === 'TB' ? 'LR' : 'TB')}
            >
              <LayoutGrid className="mr-2 h-4 w-4" />
              {layoutDirection === 'TB' ? 'Vertical' : 'Horizontal'}
            </Button>
            {(entityTypeFilter.size > 0 || relationshipTypeFilter.size > 0) && (
              <Button size="sm" variant="outline" onClick={clearFilters}>
                Clear Filters
              </Button>
            )}
            <div className="ml-auto text-sm text-muted-foreground">
              {nodes.length} nodes, {edges.length} edges
            </div>
          </div>
        </div>
      </Card>

      {/* Graph */}
      <Card className="h-[600px] overflow-hidden">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={handleNodeClick}
          nodeTypes={nodeTypes}
          fitView
          attributionPosition="bottom-left"
        >
          <Background />
          <Controls />
          <MiniMap
            nodeColor={(node) => node.data.color || '#6b7280'}
            nodeStrokeWidth={3}
            zoomable
            pannable
          />
        </ReactFlow>
      </Card>
    </div>
  );
}
