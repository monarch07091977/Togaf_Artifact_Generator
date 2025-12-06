import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface CustomNodeData {
  label: string;
  entityType: string;
  entityId: number;
  entity: any;
  color: string;
  typeLabel: string;
}

function CustomEntityNode({ data }: NodeProps<CustomNodeData>) {
  return (
    <Card className="min-w-[200px] shadow-md hover:shadow-lg transition-shadow border-2" style={{ borderColor: data.color }}>
      <Handle type="target" position={Position.Top} className="w-3 h-3" />
      
      <div className="p-3 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <Badge 
            className="text-xs font-semibold" 
            style={{ backgroundColor: data.color, color: 'white' }}
          >
            {data.typeLabel}
          </Badge>
          <span className="text-xs text-muted-foreground">#{data.entityId}</span>
        </div>
        
        <div className="font-medium text-sm leading-tight line-clamp-2">
          {data.label}
        </div>
        
        {data.entity.description && (
          <div className="text-xs text-muted-foreground line-clamp-2">
            {data.entity.description}
          </div>
        )}
      </div>
      
      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
    </Card>
  );
}

export default memo(CustomEntityNode);
