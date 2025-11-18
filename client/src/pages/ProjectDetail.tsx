import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Plus, FileText, Network, BarChart3 } from "lucide-react";
import { useLocation, useRoute } from "wouter";
import { ADM_PHASES } from "../../../shared/togafArtifacts";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { TOGAF_ARTIFACTS, getArtifactsByPhase } from "../../../shared/togafArtifacts";
import { ExternalLink, FileDown, Presentation } from "lucide-react";

export default function ProjectDetail() {
  const [, params] = useRoute("/projects/:id");
  const projectId = params?.id ? parseInt(params.id) : 0;
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [selectedPhase, setSelectedPhase] = useState<string>(ADM_PHASES[0]);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedArtifactDef, setSelectedArtifactDef] = useState<string>("");
  const [notionUrl, setNotionUrl] = useState<string | null>(null);
  const [canvaUrl, setCanvaUrl] = useState<string | null>(null);

  const createNotionProject = trpc.notion.createProject.useMutation({
    onSuccess: (data) => {
      toast.success("Project exported to Notion!");
      setNotionUrl(data.notionUrl);
    },
    onError: (error) => {
      toast.error("Failed to export to Notion: " + error.message);
    },
  });

  const createCanvaDeck = trpc.canva.createDeck.useMutation({
    onSuccess: (data) => {
      toast.success("Presentation deck created in Canva!");
      setCanvaUrl(data.editUrl);
    },
    onError: (error) => {
      toast.error("Failed to create Canva deck: " + error.message);
    },
  });

  const { data: project, isLoading: projectLoading } = trpc.projects.get.useQuery(
    { id: projectId },
    { enabled: !!user && projectId > 0 }
  );

  const { data: artifacts, refetch: refetchArtifacts } = trpc.artifacts.listByProject.useQuery(
    { projectId },
    { enabled: !!user && projectId > 0 }
  );

  const createArtifact = trpc.artifacts.create.useMutation({
    onSuccess: (data) => {
      toast.success("Artifact created successfully");
      setCreateDialogOpen(false);
      setSelectedArtifactDef("");
      refetchArtifacts();
      setLocation(`/artifacts/${data.id}`);
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
      phase: selectedPhase,
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

  const phaseArtifacts = artifacts?.filter((a) => a.phase === selectedPhase) || [];
  const availableArtifacts = getArtifactsByPhase(selectedPhase as any);

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
            <Badge variant={project.status === "completed" ? "default" : "secondary"} className="text-sm">
              {project.status.replace("_", " ")}
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
                onClick={() => createNotionProject.mutate({ projectId })}
                disabled={createNotionProject.isPending}
              >
                <FileDown className="mr-2 h-4 w-4" />
                {createNotionProject.isPending ? "Exporting..." : "Export to Notion"}
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
                onClick={() => createCanvaDeck.mutate({ projectId })}
                disabled={createCanvaDeck.isPending}
              >
                <Presentation className="mr-2 h-4 w-4" />
                {createCanvaDeck.isPending ? "Creating..." : "Create Presentation"}
              </Button>
            )}
          </div>
        </div>
      </div>

      <Tabs value={selectedPhase} onValueChange={setSelectedPhase} className="space-y-6">
        <div className="overflow-x-auto">
          <TabsList className="inline-flex w-auto">
            {ADM_PHASES.map((phase) => {
              const count = artifacts?.filter((a) => a.phase === phase).length || 0;
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
                        <div className="space-y-2">
                          <Label htmlFor="artifact-type">Artifact Type</Label>
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
                          {selectedArtifactDef && (
                            <p className="text-sm text-muted-foreground mt-2">
                              {TOGAF_ARTIFACTS[selectedArtifactDef].description}
                            </p>
                          )}
                        </div>
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
                        className="hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => setLocation(`/artifacts/${artifact.id}`)}
                      >
                        <CardHeader>
                          <div className="flex items-start justify-between gap-2">
                            <CardTitle className="text-base">{artifact.name}</CardTitle>
                            <Badge variant="outline" className="text-xs shrink-0">
                              {artifact.type}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                  artifact.status === "completed"
                                    ? "bg-green-100 text-green-800"
                                    : artifact.status === "in_progress"
                                    ? "bg-blue-100 text-blue-800"
                                    : "bg-gray-100 text-gray-800"
                                }`}
                              >
                                {artifact.status.replace("_", " ")}
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
    </div>
  );
}
