import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, TrendingUp, BarChart3, Target, AlertCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function AssessmentDashboard() {
  const { projectId } = useParams<{ projectId: string }>();
  const [, navigate] = useLocation();
  const projectIdNum = parseInt(projectId || "0");

  const { data: project, isLoading: projectLoading } = trpc.projects.get.useQuery(
    { id: projectIdNum },
    { enabled: !!projectIdNum }
  );

  const { data: assessments, isLoading: assessmentsLoading } = trpc.capabilityAssessment.listAssessments.useQuery(
    { projectId: projectIdNum },
    { enabled: !!projectIdNum }
  );

  const { data: stats } = trpc.capabilityCatalog.getCapabilityStats.useQuery();

  if (projectLoading || assessmentsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Project Not Found</h2>
          <p className="text-muted-foreground">The project you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  const completedAssessments = assessments?.filter((a) => a.assessmentCompletedAt) || [];
  const inProgressAssessments = assessments?.filter((a) => !a.assessmentCompletedAt) || [];

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

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Capability Assessments</h1>
          <p className="text-muted-foreground">
            Evaluate capability maturity across {stats?.total || 133} capabilities
          </p>
        </div>
        <Button onClick={() => navigate(`/projects/${projectId}/assessments/new`)}>
          <Plus className="h-4 w-4 mr-2" />
          Start Assessment
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Assessments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              <span className="text-2xl font-bold">{assessments?.length || 0}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-green-600" />
              <span className="text-2xl font-bold">{completedAssessments.length}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-orange-600" />
              <span className="text-2xl font-bold">{inProgressAssessments.length}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Available Capabilities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-purple-600" />
              <span className="text-2xl font-bold">{stats?.total || 133}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Assessments List */}
      <div className="space-y-6">
        {/* In Progress Assessments */}
        {inProgressAssessments.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-4">In Progress</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {inProgressAssessments.map((item) => (
                <Card
                  key={item.id}
                  className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => navigate(`/projects/${projectId}/assessments/${item.id}`)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-1">{item.capability?.name}</CardTitle>
                        <CardDescription className="line-clamp-2">
                          {item.capability?.description}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                        In Progress
                      </Badge>
                      {item.capability?.industry && (
                        <Badge variant="outline">{item.capability.industry}</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Started {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Completed Assessments */}
        {completedAssessments.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Completed</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {completedAssessments.map((item) => (
                <Card
                  key={item.id}
                  className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => navigate(`/projects/${projectId}/assessments/${item.id}`)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-1">{item.capability?.name}</CardTitle>
                        <CardDescription className="line-clamp-2">
                          {item.capability?.description}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge
                        variant="outline"
                        className={getMaturityColor(item.maturityLevel)}
                      >
                        {getMaturityLabel(item.maturityLevel)}
                      </Badge>
                      {item.capability?.industry && (
                        <Badge variant="outline">{item.capability.industry}</Badge>
                      )}
                    </div>
                    {item.maturityScore && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Score:</span>
                        <span className="text-lg font-semibold">{item.maturityScore} / 5.0</span>
                      </div>
                    )}
                    <p className="text-sm text-muted-foreground">
                      Completed {formatDistanceToNow(new Date(item.assessmentCompletedAt!), { addSuffix: true })}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {assessments?.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <BarChart3 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Assessments Yet</h3>
              <p className="text-muted-foreground mb-6">
                Start your first capability maturity assessment to evaluate organizational readiness
              </p>
              <Button onClick={() => navigate(`/projects/${projectId}/assessments/new`)}>
                <Plus className="h-4 w-4 mr-2" />
                Start Assessment
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
