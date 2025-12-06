import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Sparkles, Save, AlertCircle, CheckCircle2, Lightbulb, Link as LinkIcon } from "lucide-react";
import { useLocation, useRoute } from "wouter";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Streamdown } from "streamdown";
import { TOGAF_ARTIFACTS } from "../../../shared/togafArtifacts";
import { getPrerequisites } from "../../../shared/artifactPrerequisites";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Download } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Fallback questions if API call fails
const getFallbackQuestions = () => [
  {
    id: "scope",
    text: "What is the scope of this artifact?",
    placeholder: "Describe the boundaries and coverage...",
    context: "Defining scope helps establish clear boundaries for what this artifact covers and what it doesn't.",
    example: "Example: Enterprise-wide principles applicable to all IT initiatives."
  },
  {
    id: "stakeholders",
    text: "Who are the key stakeholders?",
    placeholder: "List primary stakeholders and their roles...",
    context: "Identifying stakeholders ensures the artifact addresses the right audience's concerns.",
    example: "Example: CIO, Enterprise Architects, Project Managers, Business Unit Leaders"
  },
  {
    id: "objectives",
    text: "What are the main objectives?",
    placeholder: "Define the goals and expected outcomes...",
    context: "Clear objectives help measure success and guide content creation.",
    example: "Example: Establish consistent decision-making framework, reduce technology fragmentation"
  },
];

export default function ArtifactEditor() {
  const [, params] = useRoute("/projects/:projectId/artifacts/:artifactId");
  const artifactId = params?.artifactId ? parseInt(params.artifactId) : 0;
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("guidance");
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const exportArtifact = trpc.export.artifact.useMutation({
    onSuccess: (data) => {
      window.open(data.url, '_blank');
      toast.success("Export ready! Opening download...");
    },
    onError: (error) => {
      toast.error("Export failed: " + error.message);
    },
  });
  const [isGenerating, setIsGenerating] = useState(false);

  const { data: artifact, isLoading, refetch } = trpc.artifacts.get.useQuery(
    { id: artifactId },
    { enabled: !!user && artifactId > 0 }
  );

  const { data: projectArtifacts } = trpc.artifacts.listByProject.useQuery(
    { projectId: artifact?.projectId || 0 },
    { enabled: !!artifact?.projectId }
  );

  const { data: responses } = trpc.questionnaire.getResponses.useQuery(
    { artifactId },
    { enabled: !!user && artifactId > 0 }
  );

  const { data: assumptions } = trpc.assumptions.listByArtifact.useQuery(
    { artifactId },
    { enabled: !!user && artifactId > 0 }
  );

  const { data: project } = trpc.projects.get.useQuery(
    { id: artifact?.projectId || 0 },
    { enabled: !!artifact }
  );

  // Get artifact definition ID
  const artifactDefId = artifact ? Object.keys(TOGAF_ARTIFACTS).find(
    (key) => TOGAF_ARTIFACTS[key].name === artifact.name
  ) : undefined;

  const { data: autoPopulatedData } = trpc.questionnaire.getAutoPopulated.useQuery(
    {
      artifactId,
      artifactDefId: artifactDefId || "",
      admPhase: artifact?.admPhase || "",
      projectId: artifact?.projectId || 0,
    },
    { enabled: !!artifact && !!artifactDefId }
  );

  // Generate TOGAF-specific questionnaire
  const { data: generatedQuestions, isLoading: questionsLoading } = trpc.questionnaire.generateQuestions.useQuery(
    {
      artifactDefId: artifactDefId || "",
      projectDescription: project?.description || undefined,
    },
    { enabled: !!artifactDefId && !!project, staleTime: Infinity } // Cache questionnaire
  );

  // Use generated questions or fallback
  const questions = generatedQuestions || getFallbackQuestions();

  const saveResponse = trpc.questionnaire.saveResponse.useMutation();
  const updateArtifact = trpc.artifacts.update.useMutation({
    onSuccess: () => {
      toast.success("Artifact saved successfully");
      refetch();
    },
  });

  const generateArtifact = trpc.artifacts.generate.useMutation({
    onSuccess: () => {
      toast.success("Artifact generated successfully!");
      setIsGenerating(false);
      refetch();
      setActiveTab("content");
    },
    onError: (error) => {
      toast.error("Generation failed: " + error.message);
      setIsGenerating(false);
    },
  });

  // Load existing responses and auto-populated data
  useEffect(() => {
    if (responses) {
      const answerMap: Record<string, string> = {};
      responses.forEach((r) => {
        answerMap[r.question] = r.answer || "";
      });
      setAnswers(answerMap);
    } else if (autoPopulatedData?.data) {
      // If no user responses, populate with auto-populated data
      const answerMap: Record<string, string> = {};
      Object.entries(autoPopulatedData.data).forEach(([key, value]) => {
        if (!value.isUserProvided) {
          answerMap[key] = value.value;
        }
      });
      setAnswers(answerMap);
    }
  }, [responses, autoPopulatedData]);

  const handleSaveAnswer = async (questionId: string, questionText: string, answer: string) => {
    await saveResponse.mutateAsync({
      artifactId,
      question: questionText,
      answer,
    });
  };

  const handleGenerate = async () => {
    if (!artifact || !project) return;

    // Save all current answers first
    for (const q of questions) {
      if (answers[q.id]) {
        await handleSaveAnswer(q.id, q.text, answers[q.id]);
      }
    }

    setIsGenerating(true);
    // Find artifact definition ID from name
    const artifactDefId = Object.keys(TOGAF_ARTIFACTS).find(
      (key) => TOGAF_ARTIFACTS[key].name === artifact.name
    );

    if (!artifactDefId) {
      toast.error("Artifact definition not found");
      setIsGenerating(false);
      return;
    }

    generateArtifact.mutate({
      artifactId,
      projectId: artifact.projectId,
      artifactDefId,
    });
  };

  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-64 bg-muted rounded"></div>
          <div className="h-96 bg-muted rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (!artifact) {
    return (
      <div className="container py-8">
        <Card>
          <CardContent className="py-16 text-center">
            <h3 className="text-lg font-semibold mb-2">Artifact not found</h3>
            <Button onClick={() => setLocation("/projects")}>Back to Projects</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => setLocation(`/projects/${artifact.projectId}`)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Project
        </Button>
      </div>

      <div className="mb-8">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h1 className="text-3xl font-bold tracking-tight">{artifact.name}</h1>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline">{artifact.type}</Badge>
              <Badge variant="outline">{artifact.admPhase}</Badge>
              <Badge
                variant={(artifact.status ?? "draft") === "approved" ? "default" : "secondary"}
                className="text-xs"
              >
                {(artifact.status ?? "draft").replace("_", " ")}
              </Badge>
            </div>
            {TOGAF_ARTIFACTS[artifact.type.toLowerCase().replace(/ /g, "-")] && (
              <p className="text-sm text-muted-foreground mt-3 max-w-3xl">
                {TOGAF_ARTIFACTS[artifact.type.toLowerCase().replace(/ /g, "-")].description}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" disabled={exportArtifact.isPending}>
                  <Download className="mr-2 h-4 w-4" />
                  {exportArtifact.isPending ? "Exporting..." : "Export"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => exportArtifact.mutate({ artifactId, format: "markdown" })}>
                  Export as Markdown
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => exportArtifact.mutate({ artifactId, format: "pdf" })}>
                  Export as PDF
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => exportArtifact.mutate({ artifactId, format: "word" })}>
                  Export as Word
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              size="lg"
              onClick={handleGenerate}
              disabled={isGenerating || !Object.keys(answers).length}
            >
              <Sparkles className="mr-2 h-4 w-4" />
              {isGenerating ? "Generating..." : "Generate with AI"}
            </Button>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="guidance">
            <Lightbulb className="mr-2 h-4 w-4" />
            Guidance
          </TabsTrigger>
          <TabsTrigger value="questionnaire">Questionnaire</TabsTrigger>
          <TabsTrigger value="content">Generated Content</TabsTrigger>
          <TabsTrigger value="assumptions">
            Assumptions
            {assumptions && assumptions.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {assumptions.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="guidance" className="space-y-6">
          {artifactDefId && TOGAF_ARTIFACTS[artifactDefId] && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>About This Artifact</CardTitle>
                  <CardDescription>{TOGAF_ARTIFACTS[artifactDefId].description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-sm mb-2">Purpose</h4>
                    <p className="text-sm text-muted-foreground">
                      {TOGAF_ARTIFACTS[artifactDefId].purpose}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm mb-2">How It's Used in ADM</h4>
                    <p className="text-sm text-muted-foreground">
                      {TOGAF_ARTIFACTS[artifactDefId].admUsage}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Prerequisites Section */}
              {artifactDefId && getPrerequisites(artifactDefId).length > 0 && (
                <Card className="border-blue-200 bg-blue-50/50">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <LinkIcon className="h-5 w-5 text-blue-600" />
                      <CardTitle className="text-blue-900">Prerequisite Artifacts</CardTitle>
                    </div>
                    <CardDescription className="text-blue-700">
                      These artifacts should be completed first as they provide input for this artifact
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {getPrerequisites(artifactDefId).map((prereqId) => {
                        const prereq = TOGAF_ARTIFACTS[prereqId];
                        if (!prereq) return null;
                        
                        // Check if prerequisite is completed in current project
                        const isCompleted = projectArtifacts?.some(
                          (a) => a.name === prereq.name && a.status === "approved"
                        );
                        
                        return (
                          <div
                            key={prereqId}
                            className="flex items-center justify-between p-3 bg-white rounded-lg border"
                          >
                            <div className="flex-1">
                              <p className="font-medium text-sm">{prereq.name}</p>
                              <p className="text-xs text-muted-foreground">{prereq.type}</p>
                            </div>
                            {isCompleted ? (
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Completed
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                                <AlertCircle className="h-3 w-3 mr-1" />
                                Pending
                              </Badge>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle>Typical Contents</CardTitle>
                  <CardDescription>
                    This artifact should typically include the following elements
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {TOGAF_ARTIFACTS[artifactDefId].typicalContents.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                        <span className="text-sm">{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Alert>
                <Lightbulb className="h-4 w-4" />
                <AlertTitle>Getting Started</AlertTitle>
                <AlertDescription>
                  Start by filling out the questionnaire in the next tab. The questions are designed to gather
                  the essential information needed for this artifact. Your answers will help the AI generate
                  comprehensive and contextually relevant content.
                </AlertDescription>
              </Alert>
            </>
          )}
        </TabsContent>

        <TabsContent value="questionnaire" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Artifact Questionnaire</CardTitle>
              <CardDescription>
                Answer these questions to provide context for AI generation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {questions.map((question) => {
                const autoData = autoPopulatedData?.data[question.id];
                const hasAutoData = autoData && !autoData.isUserProvided;
                
                return (
                  <div key={question.id} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor={question.id} className="text-base font-medium">{question.text}</Label>
                      {hasAutoData && (
                        <Badge variant="secondary" className="text-xs">
                          Auto-populated from {autoData.source}
                        </Badge>
                      )}
                    </div>
                    {question.context && (
                      <Alert className="bg-blue-50/50 border-blue-200">
                        <AlertDescription className="text-xs text-muted-foreground">
                          <strong>Why this matters:</strong> {question.context}
                        </AlertDescription>
                      </Alert>
                    )}
                    <Textarea
                      id={question.id}
                      placeholder={question.placeholder}
                      value={answers[question.id] || ""}
                      onChange={(e) => setAnswers({ ...answers, [question.id]: e.target.value })}
                      onBlur={() => {
                        if (answers[question.id]) {
                          handleSaveAnswer(question.id, question.text, answers[question.id]);
                        }
                      }}
                      rows={4}
                      className={hasAutoData ? "border-blue-300 bg-blue-50/50" : ""}
                    />
                    {question.example && !answers[question.id] && (
                      <p className="text-xs text-muted-foreground italic">
                        💡 {question.example}
                      </p>
                    )}
                    {hasAutoData && (
                      <p className="text-xs text-muted-foreground">
                        This field was automatically populated. You can edit it to override.
                      </p>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Alert>
            <Lightbulb className="h-4 w-4" />
            <AlertTitle>Tip</AlertTitle>
            <AlertDescription>
              Provide detailed answers to get more accurate and comprehensive artifact content. The AI will use your responses along with TOGAF best practices to generate professional documentation.
            </AlertDescription>
          </Alert>
        </TabsContent>

        <TabsContent value="content" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Generated Content</CardTitle>
              <CardDescription>
                AI-generated artifact content based on your questionnaire responses
              </CardDescription>
            </CardHeader>
            <CardContent>
              {artifact.content ? (
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <Streamdown>{artifact.content}</Streamdown>
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No content generated yet</p>
                  <p className="text-sm mt-2">
                    Complete the questionnaire and click "Generate with AI" to create content
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assumptions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Assumptions</CardTitle>
              <CardDescription>
                Assumptions made during artifact generation
              </CardDescription>
            </CardHeader>
            <CardContent>
              {assumptions && assumptions.length > 0 ? (
                <div className="space-y-4">
                  {assumptions.map((assumption) => (
                    <Alert key={assumption.id}>
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>
                        {assumption.assumption}
                      </AlertTitle>
                      {assumption.rationale && (
                        <AlertDescription className="mt-2">
                          <strong>Rationale:</strong> {assumption.rationale}
                        </AlertDescription>
                      )}
                    </Alert>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No assumptions recorded yet</p>
                  <p className="text-sm mt-2">
                    Assumptions will be automatically captured when you generate content
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

