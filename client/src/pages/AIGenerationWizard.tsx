import { useState } from "react";
import { useLocation, useRoute } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Sparkles, ArrowLeft, ArrowRight, Check } from "lucide-react";

interface ProjectContext {
  name: string;
  description: string;
  industry: string;
  scope: string;
  businessDrivers: string[];
  businessGoals: string[];
  stakeholders: string[];
  constraints: string[];
  technicalPreferences: string[];
  detailLevel: "high" | "medium" | "low";
}

export default function AIGenerationWizard() {
  const [, params] = useRoute("/projects/:projectId/ai-generate");
  const [, setLocation] = useLocation();
  const projectId = params?.projectId ? parseInt(params.projectId) : 0;

  const [step, setStep] = useState(1);
  const [context, setContext] = useState<ProjectContext>({
    name: "",
    description: "",
    industry: "",
    scope: "",
    businessDrivers: [],
    businessGoals: [],
    stakeholders: [],
    constraints: [],
    technicalPreferences: [],
    detailLevel: "medium",
  });

  const [currentInput, setCurrentInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationResult, setGenerationResult] = useState<any>(null);

  const generateMutation = trpc.aiGeneration.generateArtifacts.useMutation();
  const commitMutation = trpc.aiGeneration.commitGeneration.useMutation();

  const addToList = (field: keyof ProjectContext, value: string) => {
    if (value.trim()) {
      setContext((prev) => ({
        ...prev,
        [field]: [...(prev[field] as string[]), value.trim()],
      }));
      setCurrentInput("");
    }
  };

  const removeFromList = (field: keyof ProjectContext, index: number) => {
    setContext((prev) => ({
      ...prev,
      [field]: (prev[field] as string[]).filter((_, i) => i !== index),
    }));
  };

  const handleGenerate = async () => {
    if (!context.name || !context.description) {
      toast.error("Please provide project name and description");
      return;
    }

    setIsGenerating(true);
    try {
      const result = await generateMutation.mutateAsync({
        projectId,
        context,
      });

      setGenerationResult(result);
      setStep(5); // Move to preview step
      toast.success("Artifacts generated successfully!");
    } catch (error) {
      console.error("Generation failed:", error);
      toast.error("Failed to generate artifacts. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCommit = async () => {
    if (!generationResult) return;

    try {
      const result = await commitMutation.mutateAsync({
        projectId,
        generationResult,
      });

      toast.success(
        `Successfully created ${result.entitiesCreated} entities and ${result.relationshipsCreated} relationships!`
      );
      setLocation(`/projects/${projectId}`);
    } catch (error) {
      console.error("Commit failed:", error);
      toast.error("Failed to save generated artifacts. Please try again.");
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <Card>
            <CardHeader>
              <CardTitle>Project Context</CardTitle>
              <CardDescription>
                Provide basic information about your project
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Project Name *</Label>
                <Input
                  id="name"
                  value={context.name}
                  onChange={(e) => setContext({ ...context, name: e.target.value })}
                  placeholder="e.g., Customer Portal Modernization"
                />
              </div>
              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={context.description}
                  onChange={(e) => setContext({ ...context, description: e.target.value })}
                  placeholder="Describe the project purpose, scope, and objectives..."
                  rows={4}
                />
              </div>
              <div>
                <Label htmlFor="industry">Industry</Label>
                <Input
                  id="industry"
                  value={context.industry}
                  onChange={(e) => setContext({ ...context, industry: e.target.value })}
                  placeholder="e.g., Financial Services, Healthcare, Retail"
                />
              </div>
              <div>
                <Label htmlFor="scope">Scope</Label>
                <Textarea
                  id="scope"
                  value={context.scope}
                  onChange={(e) => setContext({ ...context, scope: e.target.value })}
                  placeholder="Define the boundaries and scope of this architecture..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        );

      case 2:
        return (
          <Card>
            <CardHeader>
              <CardTitle>Business Drivers & Goals</CardTitle>
              <CardDescription>
                Define what's driving this initiative and what you want to achieve
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Business Drivers</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    value={currentInput}
                    onChange={(e) => setCurrentInput(e.target.value)}
                    placeholder="e.g., Improve customer experience"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        addToList("businessDrivers", currentInput);
                      }
                    }}
                  />
                  <Button
                    type="button"
                    onClick={() => addToList("businessDrivers", currentInput)}
                  >
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {context.businessDrivers.map((driver, i) => (
                    <div
                      key={i}
                      className="bg-secondary text-secondary-foreground px-3 py-1 rounded-full text-sm flex items-center gap-2"
                    >
                      {driver}
                      <button
                        onClick={() => removeFromList("businessDrivers", i)}
                        className="hover:text-destructive"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label>Business Goals</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    value={currentInput}
                    onChange={(e) => setCurrentInput(e.target.value)}
                    placeholder="e.g., Reduce operational costs by 20%"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        addToList("businessGoals", currentInput);
                      }
                    }}
                  />
                  <Button
                    type="button"
                    onClick={() => addToList("businessGoals", currentInput)}
                  >
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {context.businessGoals.map((goal, i) => (
                    <div
                      key={i}
                      className="bg-secondary text-secondary-foreground px-3 py-1 rounded-full text-sm flex items-center gap-2"
                    >
                      {goal}
                      <button
                        onClick={() => removeFromList("businessGoals", i)}
                        className="hover:text-destructive"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        );

      case 3:
        return (
          <Card>
            <CardHeader>
              <CardTitle>Stakeholders & Constraints</CardTitle>
              <CardDescription>
                Identify key stakeholders and any constraints to consider
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Key Stakeholders</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    value={currentInput}
                    onChange={(e) => setCurrentInput(e.target.value)}
                    placeholder="e.g., CIO, Business Users, IT Operations"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        addToList("stakeholders", currentInput);
                      }
                    }}
                  />
                  <Button
                    type="button"
                    onClick={() => addToList("stakeholders", currentInput)}
                  >
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {context.stakeholders.map((stakeholder, i) => (
                    <div
                      key={i}
                      className="bg-secondary text-secondary-foreground px-3 py-1 rounded-full text-sm flex items-center gap-2"
                    >
                      {stakeholder}
                      <button
                        onClick={() => removeFromList("stakeholders", i)}
                        className="hover:text-destructive"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label>Constraints</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    value={currentInput}
                    onChange={(e) => setCurrentInput(e.target.value)}
                    placeholder="e.g., Budget limit $500K, 6-month timeline"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        addToList("constraints", currentInput);
                      }
                    }}
                  />
                  <Button
                    type="button"
                    onClick={() => addToList("constraints", currentInput)}
                  >
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {context.constraints.map((constraint, i) => (
                    <div
                      key={i}
                      className="bg-secondary text-secondary-foreground px-3 py-1 rounded-full text-sm flex items-center gap-2"
                    >
                      {constraint}
                      <button
                        onClick={() => removeFromList("constraints", i)}
                        className="hover:text-destructive"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        );

      case 4:
        return (
          <Card>
            <CardHeader>
              <CardTitle>Generation Options</CardTitle>
              <CardDescription>
                Configure how the AI should generate your artifacts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="detailLevel">Detail Level</Label>
                <Select
                  value={context.detailLevel}
                  onValueChange={(value: any) =>
                    setContext({ ...context, detailLevel: value })
                  }
                >
                  <SelectTrigger id="detailLevel">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">High - Comprehensive (10-15 entities per type)</SelectItem>
                    <SelectItem value="medium">Medium - Balanced (5-10 entities per type)</SelectItem>
                    <SelectItem value="low">Low - Minimal (3-5 entities per type)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Technical Preferences (Optional)</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    value={currentInput}
                    onChange={(e) => setCurrentInput(e.target.value)}
                    placeholder="e.g., Cloud-native, Microservices, API-first"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        addToList("technicalPreferences", currentInput);
                      }
                    }}
                  />
                  <Button
                    type="button"
                    onClick={() => addToList("technicalPreferences", currentInput)}
                  >
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {context.technicalPreferences.map((pref, i) => (
                    <div
                      key={i}
                      className="bg-secondary text-secondary-foreground px-3 py-1 rounded-full text-sm flex items-center gap-2"
                    >
                      {pref}
                      <button
                        onClick={() => removeFromList("technicalPreferences", i)}
                        className="hover:text-destructive"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4">
                <Button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="w-full"
                  size="lg"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating Artifacts...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Generate TOGAF Artifacts
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      case 5:
        return (
          <Card>
            <CardHeader>
              <CardTitle>Preview Generated Artifacts</CardTitle>
              <CardDescription>
                Review the generated entities and relationships before committing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {generationResult && (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {generationResult.businessCapabilities.length}
                      </div>
                      <div className="text-sm text-muted-foreground">Business Capabilities</div>
                    </div>
                    <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {generationResult.applications.length}
                      </div>
                      <div className="text-sm text-muted-foreground">Applications</div>
                    </div>
                    <div className="bg-purple-50 dark:bg-purple-950 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                        {generationResult.dataEntities.length}
                      </div>
                      <div className="text-sm text-muted-foreground">Data Entities</div>
                    </div>
                    <div className="bg-orange-50 dark:bg-orange-950 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                        {generationResult.businessProcesses.length}
                      </div>
                      <div className="text-sm text-muted-foreground">Business Processes</div>
                    </div>
                    <div className="bg-red-50 dark:bg-red-950 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                        {generationResult.requirements.length}
                      </div>
                      <div className="text-sm text-muted-foreground">Requirements</div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-950 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-gray-600 dark:text-gray-400">
                        {generationResult.relationships.length}
                      </div>
                      <div className="text-sm text-muted-foreground">Relationships</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-semibold">Sample Entities:</h4>
                    <div className="space-y-1 text-sm">
                      {generationResult.businessCapabilities.slice(0, 3).map((cap: any, i: number) => (
                        <div key={i} className="flex items-start gap-2">
                          <Check className="h-4 w-4 text-green-600 mt-0.5" />
                          <span>
                            <strong>{cap.name}</strong> - {cap.description.substring(0, 100)}...
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 flex gap-2">
                    <Button
                      onClick={handleCommit}
                      disabled={commitMutation.isPending}
                      className="flex-1"
                      size="lg"
                    >
                      {commitMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Check className="mr-2 h-4 w-4" />
                          Commit to Project
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setGenerationResult(null);
                        setStep(4);
                      }}
                    >
                      Regenerate
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl py-8">
        <div className="mb-8">
          <Button variant="ghost" onClick={() => setLocation(`/projects/${projectId}`)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Project
          </Button>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Sparkles className="h-8 w-8 text-primary" />
            AI-Powered Artifact Generation
          </h1>
          <p className="text-muted-foreground mt-2">
            Generate comprehensive TOGAF artifacts using AI based on your project requirements
          </p>
        </div>

        {/* Progress Steps */}
        {step < 5 && (
          <div className="mb-8">
            <div className="flex items-center justify-between">
              {["Context", "Drivers", "Stakeholders", "Options"].map((label, index) => (
                <div key={index} className="flex items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                      step > index + 1
                        ? "bg-primary text-primary-foreground"
                        : step === index + 1
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {step > index + 1 ? <Check className="h-4 w-4" /> : index + 1}
                  </div>
                  <span className="ml-2 text-sm hidden md:inline">{label}</span>
                  {index < 3 && (
                    <div
                      className={`w-12 md:w-24 h-1 mx-2 ${
                        step > index + 1 ? "bg-primary" : "bg-muted"
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step Content */}
        <div className="mb-8">{renderStep()}</div>

        {/* Navigation */}
        {step < 5 && (
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => setStep(Math.max(1, step - 1))}
              disabled={step === 1}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Previous
            </Button>
            <Button
              onClick={() => setStep(Math.min(4, step + 1))}
              disabled={step === 4 || (step === 1 && (!context.name || !context.description))}
            >
              Next
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
