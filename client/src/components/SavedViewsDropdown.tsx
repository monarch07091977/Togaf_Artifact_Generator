import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  BookmarkIcon,
  Plus,
  Star,
  Share2,
  Trash2,
  Edit,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import type { FilterConfig } from "./FilterPanel";

interface SavedView {
  id: number;
  name: string;
  description: string | null;
  filters: FilterConfig;
  isDefault: boolean;
  isShared: boolean;
  isOwner: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface SavedViewsDropdownProps {
  projectId: number;
  currentFilters: FilterConfig;
  onLoadView: (filters: FilterConfig) => void;
}

export default function SavedViewsDropdown({
  projectId,
  currentFilters,
  onLoadView,
}: SavedViewsDropdownProps) {
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedView, setSelectedView] = useState<SavedView | null>(null);
  
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isDefault, setIsDefault] = useState(false);
  const [isShared, setIsShared] = useState(false);

  const utils = trpc.useUtils();

  const { data: viewsData, isLoading } = trpc.savedViews.list.useQuery({
    projectId,
  });

  const views = viewsData?.map(v => ({
    ...v,
    filters: v.filters as FilterConfig,
  }));

  const createView = trpc.savedViews.create.useMutation({
    onSuccess: () => {
      toast.success("View saved successfully");
      utils.savedViews.list.invalidate({ projectId });
      setSaveDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error("Failed to save view: " + error.message);
    },
  });

  const updateView = trpc.savedViews.update.useMutation({
    onSuccess: () => {
      toast.success("View updated successfully");
      utils.savedViews.list.invalidate({ projectId });
      setEditDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error("Failed to update view: " + error.message);
    },
  });

  const deleteView = trpc.savedViews.delete.useMutation({
    onSuccess: () => {
      toast.success("View deleted successfully");
      utils.savedViews.list.invalidate({ projectId });
      setDeleteDialogOpen(false);
      setSelectedView(null);
    },
    onError: (error) => {
      toast.error("Failed to delete view: " + error.message);
    },
  });

  const setDefaultView = trpc.savedViews.setDefault.useMutation({
    onSuccess: () => {
      toast.success("Default view updated");
      utils.savedViews.list.invalidate({ projectId });
    },
    onError: (error) => {
      toast.error("Failed to set default: " + error.message);
    },
  });

  const resetForm = () => {
    setName("");
    setDescription("");
    setIsDefault(false);
    setIsShared(false);
    setSelectedView(null);
  };

  const handleSaveNew = () => {
    createView.mutate({
      projectId,
      name,
      description,
      filters: currentFilters,
      isDefault,
      isShared,
    });
  };

  const handleUpdate = () => {
    if (!selectedView) return;
    updateView.mutate({
      id: selectedView.id,
      name,
      description,
      isDefault,
      isShared,
    });
  };

  const handleDelete = () => {
    if (!selectedView) return;
    deleteView.mutate({ id: selectedView.id });
  };

  const handleLoadView = (view: SavedView) => {
    onLoadView(view.filters);
    toast.success(`Loaded view: ${view.name}`);
  };

  const handleEditView = (view: SavedView) => {
    setSelectedView(view);
    setName(view.name);
    setDescription(view.description || "");
    setIsDefault(view.isDefault);
    setIsShared(view.isShared);
    setEditDialogOpen(true);
  };

  const handleDeleteView = (view: SavedView) => {
    setSelectedView(view);
    setDeleteDialogOpen(true);
  };

  const handleSetDefault = (view: SavedView) => {
    setDefaultView.mutate({ id: view.id });
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">
            <BookmarkIcon className="h-4 w-4 mr-2" />
            Saved Views
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80">
          <DropdownMenuLabel>Saved Views</DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          {isLoading ? (
            <div className="p-4 text-sm text-muted-foreground text-center">
              Loading views...
            </div>
          ) : !views || views.length === 0 ? (
            <div className="p-4 text-sm text-muted-foreground text-center">
              No saved views yet
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto">
              {views.map((view) => (
                <DropdownMenuItem
                  key={view.id}
                  className="flex items-start justify-between p-3 cursor-pointer"
                  onSelect={(e) => e.preventDefault()}
                >
                  <div className="flex-1 min-w-0" onClick={() => handleLoadView(view)}>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate">{view.name}</p>
                      {view.isDefault && (
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      )}
                      {view.isShared && (
                        <Share2 className="h-3 w-3 text-muted-foreground" />
                      )}
                    </div>
                    {view.description && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {view.description}
                      </p>
                    )}
                  </div>
                  {view.isOwner && (
                    <div className="flex items-center gap-1 ml-2">
                      {!view.isDefault && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSetDefault(view);
                          }}
                        >
                          <Star className="h-3 w-3" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditView(view);
                        }}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteView(view);
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </DropdownMenuItem>
              ))}
            </div>
          )}
          
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => setSaveDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Save Current View
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Save New View Dialog */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Current View</DialogTitle>
            <DialogDescription>
              Save your current filter configuration as a named view for quick access later.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">View Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., High Priority Requirements"
              />
            </div>
            <div>
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what this view shows..."
                rows={3}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isDefault"
                checked={isDefault}
                onCheckedChange={(checked) => setIsDefault(checked as boolean)}
              />
              <Label htmlFor="isDefault" className="text-sm font-normal cursor-pointer">
                Set as default view
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isShared"
                checked={isShared}
                onCheckedChange={(checked) => setIsShared(checked as boolean)}
              />
              <Label htmlFor="isShared" className="text-sm font-normal cursor-pointer">
                Share with team members
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveNew} disabled={!name.trim()}>
              Save View
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit View Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit View</DialogTitle>
            <DialogDescription>
              Update the name, description, or settings for this view.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">View Name</Label>
              <Input
                id="edit-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="edit-description">Description (Optional)</Label>
              <Textarea
                id="edit-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="edit-isDefault"
                checked={isDefault}
                onCheckedChange={(checked) => setIsDefault(checked as boolean)}
              />
              <Label htmlFor="edit-isDefault" className="text-sm font-normal cursor-pointer">
                Set as default view
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="edit-isShared"
                checked={isShared}
                onCheckedChange={(checked) => setIsShared(checked as boolean)}
              />
              <Label htmlFor="edit-isShared" className="text-sm font-normal cursor-pointer">
                Share with team members
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={!name.trim()}>
              Update View
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete View</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedView?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
