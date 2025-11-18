import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Sparkles, Save, AlertCircle, CheckCircle2, Lightbulb } from "lucide-react";
import { useLocation, useRoute } from "wouter";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Streamdown } from "streamdown";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Sample questionnaire for artifacts
const getQuestionnaireForArtifact = (artifactName: string) => {
  // This would be expanded with specific questions for each artifact type
  const baseQuestions = [
    {
      id: "scope",
      text: "What is the scope of this artifact?",
      placeholder: "Describe the boundaries and coverage...",
    },
    {
      id: "stakeholders",
      text: "Who are the key stakeholders?",
      placeholder: "List primary stakeholders and their roles...",
    },
    {
      id: "objectives",
      text: "What are the main objectives?",
      placeholder: "Define the goals and expected outcomes...",
    },
    {
      id: "constraints",
      text: "What constraints or limitations exist?",
      placeholder: "Describe technical, business, or regulatory constraints...",
    },
  ];

  return baseQuestions;
};

export default function ArtifactEditor() {
  const [, params] = useRoute("/artifacts/:id");
  const artifactId = params?.id ? parseInt(params.id) : 0;
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("questionnaire");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isGenerating, setIsGenerating] = useState(false);

  const { data: artifact, isLoading, refetch } = trpc.artifacts.get.useQuery(
    { id: artifactId },
    { enabled: !!user && artifactId > 0 }
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

  // Load existing responses
  useEffect(() => {
    if (responses) {
      const answerMap: Record<string, string> = {};
      responses.forEach((r) => {
        answerMap[r.questionId] = r.answer || "";
      });
      setAnswers(answerMap);
    }
  }, [responses]);

  const handleSaveAnswer = async (questionId: string, questionText: string, answer: string) => {
    await saveResponse.mutateAsync({
      artifactId,
      questionId,
      questionText,
      answer,
      source: "user_input",
    });
  };

  const handleGenerate = async () => {
    if (!artifact || !project) return;

    // Save all current answers first
    const questions = getQuestionnaireForArtifact(artifact.name);
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

  const questions = getQuestionnaireForArtifact(artifact.name);

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
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{artifact.name}</h1>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline">{artifact.type}</Badge>
              <Badge variant="outline">{artifact.phase}</Badge>
              <Badge
                variant={artifact.status === "completed" ? "default" : "secondary"}
                className="text-xs"
              >
                {artifact.status.replace("_", " ")}
              </Badge>
            </div>
          </div>
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

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
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

        <TabsContent value="questionnaire" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Artifact Questionnaire</CardTitle>
              <CardDescription>
                Answer these questions to provide context for AI generation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {questions.map((question) => (
                <div key={question.id} className="space-y-2">
                  <Label htmlFor={question.id}>{question.text}</Label>
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
                  />
                </div>
              ))}
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
              {artifact.generatedContent ? (
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <Streamdown>{artifact.generatedContent}</Streamdown>
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
                      <AlertTitle className="flex items-center gap-2">
                        {assumption.description}
                        <Badge
                          variant={
                            assumption.impact === "high"
                              ? "destructive"
                              : assumption.impact === "medium"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {assumption.impact} impact
                        </Badge>
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

// Import TOGAF_ARTIFACTS at the top
import { TOGAF_ARTIFACTS } from "../../../shared/togafArtifacts";
