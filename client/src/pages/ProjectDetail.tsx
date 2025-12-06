import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Plus, FileText, Network, BarChart3, Trash2, Pencil } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useLocation, useRoute } from "wouter";
import { ADM_PHASES } from "../../../shared/togafArtifacts";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { TOGAF_ARTIFACTS, getArtifactsByPhase, ArtifactDefinition } from "../../../shared/togafArtifacts";
import { ExternalLink, FileDown, Presentation } from "lucide-react";

export default function ProjectDetail() {
  const [, params] = useRoute("/projects/:id");
  const projectId = params?.id ? parseInt(params.id) : 0;
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [selectedPhase, setSelectedPhase] = useState<string>(ADM_PHASES[0]);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedArtifactDef, setSelectedArtifactDef] = useState<string>("");
  const selectedArtifact: ArtifactDefinition | undefined = selectedArtifactDef ? TOGAF_ARTIFACTS[selectedArtifactDef] : undefined;
  const [notionUrl, setNotionUrl] = useState<string | null>(null);
  const [canvaUrl, setCanvaUrl] = useState<string | null>(null);
  const [deleteArtifactDialogOpen, setDeleteArtifactDialogOpen] = useState(false);
  const [artifactToDelete, setArtifactToDelete] = useState<number | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");

  const { data: project, isLoading: projectLoading, refetch: refetchProject } = trpc.projects.get.useQuery(
    { id: projectId },
    { enabled: !!user && projectId > 0 }
  );

  const { data: artifacts, refetch: refetchArtifacts } = trpc.artifacts.listByProject.useQuery(
    { projectId },
    { enabled: !!user && projectId > 0 }
  );
  
  // Initialize URLs from project data
  if (project && !notionUrl && project.notionPageUrl) {
    setNotionUrl(project.notionPageUrl);
  }
  if (project && !canvaUrl && project.canvaDesignUrl) {
    setCanvaUrl(project.canvaDesignUrl);
  }

  const [isExporting, setIsExporting] = useState(false);
  const utils = trpc.useUtils();
  
  const exportToNotion = async () => {
    if (!projectId || isExporting) return;
    
    setIsExporting(true);
    try {
      const data = await utils.client.notion.exportProject.query({ projectId });    
      // Download as Markdown file
      const blob = new Blob([data.markdown], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${data.projectName.replace(/[^a-z0-9]/gi, '_')}_notion_export.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success("Markdown file downloaded! Import it to Notion.");
    } catch (error) {
      toast.error("Failed to export: " + (error as Error).message);
    } finally {
      setIsExporting(false);
    }
  };

  const exportToCanva = () => {
    if (!projectId) return;
    toast.info("Canva export coming soon! Use PDF export for now.");
  };

  const updateProject = trpc.projects.update.useMutation({
    onSuccess: () => {
      toast.success("Project updated successfully");
      refetchProject();
      setEditDialogOpen(false);
    },
    onError: (error) => {
      toast.error("Failed to update project: " + error.message);
    },
  });

  const deleteArtifact = trpc.artifacts.delete.useMutation({
    onSuccess: () => {
      toast.success("Artifact deleted successfully");
      refetchProject();
      setDeleteArtifactDialogOpen(false);
      setArtifactToDelete(null);
    },
    onError: (error: any) => {
      toast.error("Failed to delete artifact: " + error.message);
    },
  });

  const createArtifact = trpc.artifacts.create.useMutation({
    onSuccess: (data) => {
      toast.success("Artifact created successfully");
      setCreateDialogOpen(false);
      setSelectedArtifactDef("");
      refetchArtifacts();
      setLocation(`/projects/${projectId}/artifacts/${data.id}`);
    },
    onError: (error) => {
      toast.error("Failed to create artifact: " + error.message);
    },
  });

  const handleCreateArtifact = () => {
    if (!selectedArtifactDef) {
      toast.error("Please select an artifact type");
      return;
    }
    const artifactDef = TOGAF_ARTIFACTS[selectedArtifactDef];
    createArtifact.mutate({
      projectId,
      type: artifactDef.type,
      name: artifactDef.name,
      admPhase: selectedPhase,
    });
  };

  if (projectLoading) {
    return (
      <div className="container py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-64 bg-muted rounded"></div>
          <div className="h-48 bg-muted rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="container py-8">
        <Card>
          <CardContent className="py-16 text-center">
            <h3 className="text-lg font-semibold mb-2">Project not found</h3>
            <Button onClick={() => setLocation("/projects")}>Back to Projects</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const phaseArtifacts = artifacts?.filter((a) => a.admPhase === selectedPhase) || [];
  // Get all artifacts for the phase, then filter out ones that are already created
  const allPhaseArtifacts = getArtifactsByPhase(selectedPhase as any);
  const createdArtifactTypes = new Set(phaseArtifacts.map(a => a.type));
  const availableArtifacts = allPhaseArtifacts.filter(artifact => !createdArtifactTypes.has(artifact.id));

  return (
    <div className="container py-8">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => setLocation("/projects")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Projects
        </Button>
      </div>

      <div className="mb-8">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
            <p className="text-muted-foreground mt-2">{project.description}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setEditName(project.name);
                setEditDescription(project.description || "");
                setEditDialogOpen(true);
              }}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Badge variant={project.status === "completed" ? "default" : "secondary"} className="text-sm">
              {(project.status || "active").replace("_", " ")}
            </Badge>
            {notionUrl ? (
              <Button variant="outline" asChild>
                <a href={notionUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  View in Notion
                </a>
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={exportToNotion}
              >
                <FileDown className="mr-2 h-4 w-4" />
                Export to Notion
              </Button>
            )}
            {canvaUrl ? (
              <Button variant="outline" asChild>
                <a href={canvaUrl} target="_blank" rel="noopener noreferrer">
                  <Presentation className="mr-2 h-4 w-4" />
                  Edit in Canva
                </a>
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={exportToCanva}
              >
                <Presentation className="mr-2 h-4 w-4" />
                Export for Canva
              </Button>
            )}
          </div>
        </div>
      </div>

      <Tabs value={selectedPhase} onValueChange={setSelectedPhase} className="space-y-6">
        <div className="overflow-x-auto">
          <TabsList className="inline-flex w-auto">
            {ADM_PHASES.map((phase) => {
              const count = artifacts?.filter((a) => a.admPhase === phase).length || 0;
              return (
                <TabsTrigger key={phase} value={phase} className="relative">
                  {phase}
                  {count > 0 && (
                    <Badge variant="secondary" className="ml-2 h-5 min-w-5 px-1">
                      {count}
                    </Badge>
                  )}
                </TabsTrigger>
              );
            })}
          </TabsList>
        </div>

        {ADM_PHASES.map((phase) => (
          <TabsContent key={phase} value={phase} className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{phase} Artifacts</CardTitle>
                    <CardDescription>
                      Create and manage artifacts for this ADM phase
                    </CardDescription>
                  </div>
                  <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Artifact
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Create New Artifact</DialogTitle>
                        <DialogDescription>
                          Select an artifact type for {selectedPhase}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        {availableArtifacts.length === 0 ? (
                          <div className="text-center py-8 text-muted-foreground">
                            <p className="font-medium mb-2">All artifacts created for this phase</p>
                            <p className="text-sm">You've created all available artifacts for {selectedPhase}.</p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <Label htmlFor="artifact-type">Artifact Type ({availableArtifacts.length} available)</Label>
                            <Select value={selectedArtifactDef} onValueChange={setSelectedArtifactDef}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select artifact type..." />
                              </SelectTrigger>
                              <SelectContent>
                                {availableArtifacts.map((artifact) => (
                                  <SelectItem key={artifact.id} value={artifact.id}>
                                    <div className="flex items-center gap-2">
                                      <Badge variant="outline" className="text-xs">
                                        {artifact.type}
                                      </Badge>
                                      {artifact.name}
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          {selectedArtifact && (
                            <Card className="bg-muted/50 mt-3">
                              <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-medium">About this Artifact</CardTitle>
                              </CardHeader>
                              <CardContent className="space-y-3 text-sm">
                                <div>
                                  <p className="font-medium text-foreground mb-1">Purpose:</p>
                                  <p className="text-muted-foreground">{selectedArtifact.purpose}</p>
                                </div>
                                <div>
                                  <p className="font-medium text-foreground mb-1">Typical Contents:</p>
                                  <ul className="list-disc list-inside text-muted-foreground space-y-0.5">
                                    {selectedArtifact.typicalContents.slice(0, 4).map((item, idx) => (
                                      <li key={idx} className="text-xs">{item}</li>
                                    ))}
                                    {selectedArtifact.typicalContents.length > 4 && (
                                      <li className="text-xs italic">And {selectedArtifact.typicalContents.length - 4} more...</li>
                                    )}
                                  </ul>
                                </div>
                                <div>
                                  <p className="font-medium text-foreground mb-1">ADM Usage:</p>
                                  <p className="text-muted-foreground text-xs">{selectedArtifact.admUsage}</p>
                                </div>
                              </CardContent>
                            </Card>
                          )}
                        </div>
                        )}
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleCreateArtifact} disabled={createArtifact.isPending}>
                          {createArtifact.isPending ? "Creating..." : "Create Artifact"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {phaseArtifacts.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No artifacts created for this phase yet</p>
                    <p className="text-sm mt-2">Click "Add Artifact" to get started</p>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {phaseArtifacts.map((artifact) => (
                      <Card
                        key={artifact.id}
                        className="hover:shadow-md transition-shadow cursor-pointer group"
                        onClick={() => setLocation(`/projects/${projectId}/artifacts/${artifact.id}`)}
                      >
                        <CardHeader>
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <CardTitle className="text-base">{artifact.name}</CardTitle>
                            </div>
                            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                              <Badge variant="outline" className="text-xs shrink-0">
                                {artifact.type}
                              </Badge>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setArtifactToDelete(artifact.id);
                                  setDeleteArtifactDialogOpen(true);
                                }}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                  (artifact.status ?? "draft") === "approved"
                                    ? "bg-green-100 text-green-800"
                                    : (artifact.status ?? "draft") === "in_progress"
                                    ? "bg-blue-100 text-blue-800"
                                    : "bg-gray-100 text-gray-800"
                                }`}
                              >
                                {artifact.status ?? "draft".replace("_", " ")}
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      <AlertDialog open={deleteArtifactDialogOpen} onOpenChange={setDeleteArtifactDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Artifact?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this artifact and all its content, questionnaire responses, and assumptions. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (artifactToDelete) {
                  deleteArtifact.mutate({ id: artifactToDelete });
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Project</DialogTitle>
            <DialogDescription>
              Update your project name and description
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Project Name *</Label>
              <input
                id="edit-name"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <textarea
                id="edit-description"
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => {
                if (!editName.trim()) {
                  toast.error("Project name is required");
                  return;
                }
                updateProject.mutate({
                  id: projectId,
                  name: editName,
                  description: editDescription,
                });
              }}
              disabled={updateProject.isPending}
            >
              {updateProject.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
