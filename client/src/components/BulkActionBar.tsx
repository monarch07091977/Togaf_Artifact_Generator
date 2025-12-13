import { Button } from "@/components/ui/button";
import { X, Trash2, Edit, Link, Download, CheckSquare } from "lucide-react";

interface BulkActionBarProps {
  selectedCount: number;
  totalCount: number;
  onClearSelection: () => void;
  onSelectAll: () => void;
  onBulkDelete: () => void;
  onBulkUpdate: () => void;
  onBulkCreateRelationships: () => void;
  onExportCSV: () => void;
}

export function BulkActionBar({
  selectedCount,
  totalCount,
  onClearSelection,
  onSelectAll,
  onBulkDelete,
  onBulkUpdate,
  onBulkCreateRelationships,
  onExportCSV,
}: BulkActionBarProps) {
  if (selectedCount === 0) return null;

  const allSelected = selectedCount === totalCount;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
      <div className="bg-primary text-primary-foreground rounded-lg shadow-lg px-6 py-4 flex items-center gap-4">
        {/* Selection count */}
        <div className="flex items-center gap-2">
          <CheckSquare className="h-5 w-5" />
          <span className="font-medium">
            {selectedCount} {selectedCount === 1 ? "item" : "items"} selected
          </span>
        </div>

        {/* Divider */}
        <div className="h-6 w-px bg-primary-foreground/20" />

        {/* Select all button */}
        {!allSelected && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onSelectAll}
            className="text-primary-foreground hover:bg-primary-foreground/10"
          >
            Select all ({totalCount})
          </Button>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBulkUpdate}
            className="text-primary-foreground hover:bg-primary-foreground/10"
          >
            <Edit className="h-4 w-4 mr-2" />
            Update
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={onBulkCreateRelationships}
            className="text-primary-foreground hover:bg-primary-foreground/10"
          >
            <Link className="h-4 w-4 mr-2" />
            Link
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={onExportCSV}
            className="text-primary-foreground hover:bg-primary-foreground/10"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={onBulkDelete}
            className="text-primary-foreground hover:bg-primary-foreground/10 hover:bg-destructive/20"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>

        {/* Divider */}
        <div className="h-6 w-px bg-primary-foreground/20" />

        {/* Clear selection */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearSelection}
          className="text-primary-foreground hover:bg-primary-foreground/10"
        >
          <X className="h-4 w-4 mr-2" />
          Clear
        </Button>
      </div>
    </div>
  );
}
