import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, ArrowLeft, CheckCircle2, AlertCircle, TrendingUp, FileText } from "lucide-react";
import { toast } from "sonner";
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";

export default function AssessmentDetail() {
  const { projectId, assessmentId } = useParams<{ projectId: string; assessmentId: string }>();
  const [, navigate] = useLocation();
  const assessmentIdNum = parseInt(assessmentId || "0");
  const projectIdNum = parseInt(projectId || "0");

  const [responses, setResponses] = useState<Record<number, { answerValue: number; answerLabel: string }>>({});
  const [activeTab, setActiveTab] = useState<string>("questions");

  const utils = trpc.useUtils();

  const { data: assessment, isLoading: assessmentLoading } = trpc.capabilityAssessment.getAssessment.useQuery(
    { assessmentId: assessmentIdNum },
    { enabled: !!assessmentIdNum }
  );

  const { data: questions, isLoading: questionsLoading } = trpc.capabilityAssessment.getQuestions.useQuery(
    { assessmentId: assessmentIdNum },
    { enabled: !!assessmentIdNum }
  );

  const { data: existingResponses } = trpc.capabilityAssessment.getResponses.useQuery(
    { assessmentId: assessmentIdNum },
    { enabled: !!assessmentIdNum }
  );

  const { data: results } = trpc.capabilityAssessment.getAssessmentResults.useQuery(
    { assessmentId: assessmentIdNum },
    { enabled: !!assessmentIdNum && !!assessment?.assessmentCompletedAt }
  );

  const generateQuestionsMutation = trpc.capabilityAssessment.generateQuestions.useMutation({
    onSuccess: () => {
      toast.success("Assessment questions generated successfully");
      utils.capabilityAssessment.getQuestions.invalidate({ assessmentId: assessmentIdNum });
    },
    onError: (error) => {
      toast.error(`Failed to generate questions: ${error.message}`);
    },
  });

  const submitResponsesMutation = trpc.capabilityAssessment.submitResponses.useMutation({
    onSuccess: () => {
      toast.success("Responses saved successfully");
      utils.capabilityAssessment.getResponses.invalidate({ assessmentId: assessmentIdNum });
    },
    onError: (error) => {
      toast.error(`Failed to save responses: ${error.message}`);
    },
  });

  const calculateMaturityMutation = trpc.capabilityAssessment.calculateMaturity.useMutation({
    onSuccess: () => {
      toast.success("Maturity score calculated");
      utils.capabilityAssessment.getAssessment.invalidate({ assessmentId: assessmentIdNum });
    },
    onError: (error) => {
      toast.error(`Failed to calculate maturity: ${error.message}`);
    },
  });

  const generateNarrativeMutation = trpc.capabilityAssessment.generateNarrative.useMutation({
    onSuccess: () => {
      toast.success("Assessment completed with AI-powered insights");
      utils.capabilityAssessment.getAssessment.invalidate({ assessmentId: assessmentIdNum });
      utils.capabilityAssessment.getAssessmentResults.invalidate({ assessmentId: assessmentIdNum });
      setActiveTab("results");
    },
    onError: (error) => {
      toast.error(`Failed to generate narrative: ${error.message}`);
    },
  });

  // Load existing responses into state
  useEffect(() => {
    if (existingResponses) {
      const responseMap: Record<number, { answerValue: number; answerLabel: string }> = {};
      existingResponses.forEach((r) => {
        responseMap[r.questionId] = {
          answerValue: r.answerValue,
          answerLabel: r.answerLabel || "",
        };
      });
      setResponses(responseMap);
    }
  }, [existingResponses]);

  const handleGenerateQuestions = () => {
    generateQuestionsMutation.mutate({ assessmentId: assessmentIdNum });
  };

  const handleAnswerChange = (questionId: number, value: number, label: string) => {
    setResponses((prev) => ({
      ...prev,
      [questionId]: { answerValue: value, answerLabel: label },
    }));
  };

  const handleSaveResponses = () => {
    const responsesArray = Object.entries(responses).map(([questionId, response]) => ({
      questionId: parseInt(questionId),
      answerValue: response.answerValue,
      answerLabel: response.answerLabel,
    }));

    if (responsesArray.length === 0) {
      toast.error("Please answer at least one question");
      return;
    }

    submitResponsesMutation.mutate({
      assessmentId: assessmentIdNum,
      responses: responsesArray,
    });
  };

  const handleCompleteAssessment = async () => {
    // First save any pending responses
    if (Object.keys(responses).length > 0) {
      const responsesArray = Object.entries(responses).map(([questionId, response]) => ({
        questionId: parseInt(questionId),
        answerValue: response.answerValue,
        answerLabel: response.answerLabel,
      }));

      await submitResponsesMutation.mutateAsync({
        assessmentId: assessmentIdNum,
        responses: responsesArray,
      });
    }

    // Calculate maturity
    await calculateMaturityMutation.mutateAsync({ assessmentId: assessmentIdNum });

    // Generate narrative
    await generateNarrativeMutation.mutateAsync({ assessmentId: assessmentIdNum });
  };

  if (assessmentLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!assessment) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Assessment Not Found</h2>
          <p className="text-muted-foreground">The assessment you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  const answeredCount = Object.keys(responses).length;
  const totalQuestions = questions?.length || 0;
  const progress = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0;
  const allQuestionsAnswered = answeredCount === totalQuestions && totalQuestions > 0;

  const getMaturityColor = (level: string | null) => {
    switch (level) {
      case "initial":
        return "bg-red-100 text-red-800 border-red-200";
      case "developing":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "defined":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "managed":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "optimizing":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getMaturityLabel = (level: string | null) => {
    if (!level) return "Not Assessed";
    return level.charAt(0).toUpperCase() + level.slice(1);
  };

  // Prepare chart data
  const dimensionScores = results?.dimensionScores || {};
  const radarData = [
    { dimension: "Process", score: dimensionScores.process || 0, fullMark: 5 },
    { dimension: "People", score: dimensionScores.people || 0, fullMark: 5 },
    { dimension: "Technology", score: dimensionScores.technology || 0, fullMark: 5 },
    { dimension: "Data", score: dimensionScores.data || 0, fullMark: 5 },
    { dimension: "Governance", score: dimensionScores.governance || 0, fullMark: 5 },
  ];

  const barData = [
    { name: "Process", score: dimensionScores.process || 0 },
    { name: "People", score: dimensionScores.people || 0 },
    { name: "Technology", score: dimensionScores.technology || 0 },
    { name: "Data", score: dimensionScores.data || 0 },
    { name: "Governance", score: dimensionScores.governance || 0 },
  ];

  const likertOptions = [
    { value: 1, label: "1 - Never / Not at all" },
    { value: 2, label: "2 - Rarely / Minimal" },
    { value: 3, label: "3 - Sometimes / Moderate" },
    { value: 4, label: "4 - Often / Substantial" },
    { value: 5, label: "5 - Always / Optimized" },
  ];

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(`/projects/${projectId}/assessments`)}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold mb-1">{assessment.capability?.name}</h1>
          <p className="text-muted-foreground">{assessment.capability?.description}</p>
        </div>
        {assessment.maturityLevel && (
          <Badge variant="outline" className={`${getMaturityColor(assessment.maturityLevel)} text-lg px-4 py-2`}>
            {getMaturityLabel(assessment.maturityLevel)}
          </Badge>
        )}
      </div>

      {/* Progress Card */}
      {!assessment.assessmentCompletedAt && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Assessment Progress</CardTitle>
            <CardDescription>
              {answeredCount} of {totalQuestions} questions answered
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Progress value={progress} className="h-2" />
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="questions">
            <FileText className="h-4 w-4 mr-2" />
            Questions
          </TabsTrigger>
          <TabsTrigger value="results" disabled={!assessment.assessmentCompletedAt}>
            <TrendingUp className="h-4 w-4 mr-2" />
            Results
          </TabsTrigger>
        </TabsList>

        {/* Questions Tab */}
        <TabsContent value="questions" className="space-y-6">
          {!questions || questions.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No Questions Generated</h3>
                <p className="text-muted-foreground mb-6">
                  Generate AI-powered assessment questions to begin evaluating this capability
                </p>
                <Button
                  onClick={handleGenerateQuestions}
                  disabled={generateQuestionsMutation.isPending}
                >
                  {generateQuestionsMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating Questions...
                    </>
                  ) : (
                    "Generate Questions"
                  )}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Group questions by dimension */}
              {["process", "people", "technology", "data", "governance"].map((dimension) => {
                const dimensionQuestions = questions.filter((q) => q.dimensionCode === dimension);
                if (dimensionQuestions.length === 0) return null;

                return (
                  <div key={dimension}>
                    <h2 className="text-xl font-semibold mb-4 capitalize">{dimension} Maturity</h2>
                    <div className="space-y-4">
                      {dimensionQuestions.map((question) => (
                        <Card key={question.id}>
                          <CardHeader>
                            <CardTitle className="text-base font-medium">{question.questionText}</CardTitle>
                            <CardDescription>Weight: {question.weight}</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              {likertOptions.map((option) => (
                                <label
                                  key={option.value}
                                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                                    responses[question.id]?.answerValue === option.value
                                      ? "border-primary bg-primary/5"
                                      : "border-border hover:bg-muted/50"
                                  }`}
                                >
                                  <input
                                    type="radio"
                                    name={`question-${question.id}`}
                                    value={option.value}
                                    checked={responses[question.id]?.answerValue === option.value}
                                    onChange={() => handleAnswerChange(question.id, option.value, option.label)}
                                    className="h-4 w-4"
                                  />
                                  <span className="text-sm">{option.label}</span>
                                  {responses[question.id]?.answerValue === option.value && (
                                    <CheckCircle2 className="h-4 w-4 text-primary ml-auto" />
                                  )}
                                </label>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                );
              })}

              {/* Action Buttons */}
              <div className="flex items-center gap-4 justify-end sticky bottom-0 bg-background border-t pt-4">
                <Button
                  variant="outline"
                  onClick={handleSaveResponses}
                  disabled={submitResponsesMutation.isPending || Object.keys(responses).length === 0}
                >
                  {submitResponsesMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Progress"
                  )}
                </Button>
                <Button
                  onClick={handleCompleteAssessment}
                  disabled={
                    !allQuestionsAnswered ||
                    calculateMaturityMutation.isPending ||
                    generateNarrativeMutation.isPending
                  }
                >
                  {calculateMaturityMutation.isPending || generateNarrativeMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "Complete Assessment"
                  )}
                </Button>
              </div>
            </>
          )}
        </TabsContent>

        {/* Results Tab */}
        <TabsContent value="results" className="space-y-6">
          {results && (
            <>
              {/* Overall Score Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Overall Maturity Score</CardTitle>
                  <CardDescription>Based on {totalQuestions} assessment questions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-8">
                    <div className="text-center">
                      <div className="text-5xl font-bold text-primary mb-2">
                        {results.assessment.maturityScore}
                      </div>
                      <div className="text-sm text-muted-foreground">out of 5.0</div>
                    </div>
                    <div className="flex-1">
                      <Badge
                        variant="outline"
                        className={`${getMaturityColor(results.assessment.maturityLevel)} text-lg px-4 py-2`}
                      >
                        {getMaturityLabel(results.assessment.maturityLevel)}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Dimension Scores - Radar Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Dimension Scores - Radar View</CardTitle>
                  <CardDescription>Maturity across 5 dimensions</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <RadarChart data={radarData}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="dimension" />
                      <PolarRadiusAxis angle={90} domain={[0, 5]} />
                      <Radar
                        name="Maturity Score"
                        dataKey="score"
                        stroke="#3b82f6"
                        fill="#3b82f6"
                        fillOpacity={0.6}
                      />
                      <Tooltip />
                    </RadarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Dimension Scores - Bar Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Dimension Scores - Bar View</CardTitle>
                  <CardDescription>Detailed comparison across dimensions</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={barData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis domain={[0, 5]} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="score" fill="#3b82f6" name="Maturity Score" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Narrative */}
              {results.assessment.maturityNarrative && (
                <Card>
                  <CardHeader>
                    <CardTitle>Assessment Narrative</CardTitle>
                    <CardDescription>AI-generated insights and analysis</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                      {results.assessment.maturityNarrative}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Strengths */}
              {results.assessment.keyStrengths && Array.isArray(results.assessment.keyStrengths) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      Key Strengths
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {(results.assessment.keyStrengths as string[]).map((strength, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-green-600 mt-1">•</span>
                          <span className="text-sm">{strength}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Gaps */}
              {results.assessment.keyGaps && Array.isArray(results.assessment.keyGaps) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-orange-600" />
                      Key Gaps
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {(results.assessment.keyGaps as string[]).map((gap, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-orange-600 mt-1">•</span>
                          <span className="text-sm">{gap}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Recommendations */}
              {results.assessment.recommendations && Array.isArray(results.assessment.recommendations) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-blue-600" />
                      Recommendations
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {(results.assessment.recommendations as string[]).map((rec, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-blue-600 mt-1">{index + 1}.</span>
                          <span className="text-sm">{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
