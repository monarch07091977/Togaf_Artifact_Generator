import dagre from 'dagre';
import { Node, Edge, Position } from 'reactflow';

export interface EntityNode {
  id: number;
  name: string;
  type: string;
  description?: string;
  [key: string]: any;
}

export interface EntityRelationship {
  id: number;
  sourceEntityType: string;
  sourceEntityId: number;
  targetEntityType: string;
  targetEntityId: number;
  relationshipType: string;
  description?: string;
}

const ENTITY_COLORS: Record<string, string> = {
  businessCapability: '#3b82f6', // blue
  application: '#10b981', // green
  businessProcess: '#8b5cf6', // purple
  dataEntity: '#f97316', // orange
  requirement: '#ec4899', // pink
};

const ENTITY_LABELS: Record<string, string> = {
  businessCapability: 'BC',
  application: 'APP',
  businessProcess: 'BP',
  dataEntity: 'DE',
  requirement: 'REQ',
};

/**
 * Transform entities and relationships into React Flow nodes and edges
 */
export function transformToGraphData(
  entities: EntityNode[],
  relationships: EntityRelationship[]
): { nodes: Node[]; edges: Edge[] } {
  // Create nodes from entities
  const nodes: Node[] = entities.map((entity) => ({
    id: `${entity.type}-${entity.id}`,
    type: 'custom',
    data: {
      label: entity.name,
      entityType: entity.type,
      entityId: entity.id,
      entity: entity,
      color: ENTITY_COLORS[entity.type] || '#6b7280',
      typeLabel: ENTITY_LABELS[entity.type] || entity.type.substring(0, 3).toUpperCase(),
    },
    position: { x: 0, y: 0 }, // Will be calculated by layout
  }));

  // Create edges from relationships
  const edges: Edge[] = relationships.map((rel) => ({
    id: `edge-${rel.id}`,
    source: `${rel.sourceEntityType}-${rel.sourceEntityId}`,
    target: `${rel.targetEntityType}-${rel.targetEntityId}`,
    type: 'smoothstep',
    animated: false,
    label: rel.relationshipType.replace(/_/g, ' '),
    data: {
      relationship: rel,
    },
    style: {
      stroke: '#94a3b8',
      strokeWidth: 2,
    },
    labelStyle: {
      fontSize: 10,
      fontWeight: 500,
      fill: '#64748b',
    },
    labelBgStyle: {
      fill: '#ffffff',
      fillOpacity: 0.9,
    },
  }));

  return { nodes, edges };
}

/**
 * Apply dagre layout algorithm to position nodes automatically
 */
export function getLayoutedElements(
  nodes: Node[],
  edges: Edge[],
  direction: 'TB' | 'LR' = 'TB'
): { nodes: Node[]; edges: Edge[] } {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  const nodeWidth = 200;
  const nodeHeight = 80;

  dagreGraph.setGraph({
    rankdir: direction,
    nodesep: 100,
    ranksep: 150,
    marginx: 50,
    marginy: 50,
  });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      targetPosition: direction === 'TB' ? Position.Top : Position.Left,
      sourcePosition: direction === 'TB' ? Position.Bottom : Position.Right,
      position: {
        x: nodeWithPosition.x - nodeWidth / 2,
        y: nodeWithPosition.y - nodeHeight / 2,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
}

/**
 * Filter graph data by entity types and relationship types
 */
export function filterGraphData(
  nodes: Node[],
  edges: Edge[],
  entityTypeFilter: Set<string>,
  relationshipTypeFilter: Set<string>
): { nodes: Node[]; edges: Edge[] } {
  // Filter nodes by entity type
  const filteredNodes = nodes.filter((node) =>
    entityTypeFilter.size === 0 || entityTypeFilter.has(node.data.entityType)
  );

  const nodeIds = new Set(filteredNodes.map((n) => n.id));

  // Filter edges: both source and target must be in filtered nodes, and relationship type must match
  const filteredEdges = edges.filter((edge) => {
    const sourceInGraph = nodeIds.has(edge.source);
    const targetInGraph = nodeIds.has(edge.target);
    const relationshipTypeMatch =
      relationshipTypeFilter.size === 0 ||
      relationshipTypeFilter.has(edge.data?.relationship?.relationshipType);

    return sourceInGraph && targetInGraph && relationshipTypeMatch;
  });

  return { nodes: filteredNodes, edges: filteredEdges };
}
