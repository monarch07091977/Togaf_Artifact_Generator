import { useState } from "react";
import { useRoute } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Info,
  Play,
  Loader2,
  AlertCircle,
  ShieldAlert,
} from "lucide-react";
import { toast } from "sonner";

const SEVERITY_CONFIG = {
  info: {
    icon: Info,
    color: "bg-blue-100 text-blue-800",
    badgeVariant: "secondary" as const,
  },
  warning: {
    icon: AlertTriangle,
    color: "bg-yellow-100 text-yellow-800",
    badgeVariant: "secondary" as const,
  },
  error: {
    icon: XCircle,
    color: "bg-red-100 text-red-800",
    badgeVariant: "destructive" as const,
  },
  critical: {
    icon: ShieldAlert,
    color: "bg-purple-100 text-purple-800",
    badgeVariant: "destructive" as const,
  },
};

export default function ValidationDashboard() {
  const [, params] = useRoute("/projects/:id/validation");
  const projectId = parseInt(params?.id || "0");
  const [isRunning, setIsRunning] = useState(false);

  const utils = trpc.useUtils();

  const { data: rules, isLoading: rulesLoading } = trpc.validation.listRules.useQuery({
    projectId,
  });

  const { data: violations, isLoading: violationsLoading } = trpc.validation.listViolations.useQuery({
    projectId,
    status: "open",
  });

  const { data: stats } = trpc.validation.getViolationStats.useQuery({
    projectId,
  });

  const runValidation = trpc.validation.runValidation.useMutation({
    onSuccess: (result) => {
      toast.success(`Validation complete: ${result.totalViolations} violations found`);
      utils.validation.listViolations.invalidate({ projectId });
      utils.validation.getViolationStats.invalidate({ projectId });
      setIsRunning(false);
    },
    onError: (error) => {
      toast.error("Validation failed: " + error.message);
      setIsRunning(false);
    },
  });

  const handleRunValidation = () => {
    setIsRunning(true);
    runValidation.mutate({ projectId });
  };

  const activeRules = rules?.filter(r => r.isActive) || [];
  const openViolations = violations || [];

  // Group violations by severity
  const violationsBySeverity = openViolations.reduce((acc, v) => {
    const severity = (v as any).severity || "warning";
    if (!acc[severity]) acc[severity] = [];
    acc[severity].push(v);
    return acc;
  }, {} as Record<string, any[]>);

  if (rulesLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Validation Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Monitor EA repository quality and compliance
          </p>
        </div>
        <Button
          onClick={handleRunValidation}
          disabled={isRunning || activeRules.length === 0}
          size="lg"
        >
          {isRunning ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Running...
            </>
          ) : (
            <>
              <Play className="h-4 w-4 mr-2" />
              Run Validation
            </>
          )}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Rules
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{activeRules.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {rules?.length || 0} total configured
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Open Violations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">
              {stats?.byStatus?.open || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Require attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Resolved
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {stats?.byStatus?.resolved || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Successfully fixed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Ignored
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-600">
              {stats?.byStatus?.ignored || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Marked as exceptions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Violations by Severity */}
      {openViolations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Violations by Severity</CardTitle>
            <CardDescription>
              Distribution of open violations across severity levels
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(SEVERITY_CONFIG).map(([severity, config]) => {
                const count = stats?.bySeverity?.[severity] || 0;
                const Icon = config.icon;
                return (
                  <div key={severity} className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${config.color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{count}</div>
                      <div className="text-sm text-muted-foreground capitalize">
                        {severity}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs defaultValue="violations" className="space-y-4">
        <TabsList>
          <TabsTrigger value="violations">
            Violations ({openViolations.length})
          </TabsTrigger>
          <TabsTrigger value="rules">
            Rules ({rules?.length || 0})
          </TabsTrigger>
        </TabsList>

        {/* Violations Tab */}
        <TabsContent value="violations" className="space-y-4">
          {violationsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : openViolations.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <CheckCircle2 className="h-12 w-12 text-green-500 mb-4" />
                <p className="text-lg font-medium">No violations found!</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Your EA repository is compliant with all active rules
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {openViolations.map((violation: any) => {
                const severityConfig = SEVERITY_CONFIG[violation.severity as keyof typeof SEVERITY_CONFIG] || SEVERITY_CONFIG.warning;
                const SeverityIcon = severityConfig.icon;
                const details = violation.violationDetails as any;

                return (
                  <Card key={violation.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <div className={`p-2 rounded-lg ${severityConfig.color}`}>
                            <SeverityIcon className="h-5 w-5" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <CardTitle className="text-lg">
                                {violation.entityName}
                              </CardTitle>
                              <Badge variant="outline">{violation.entityType}</Badge>
                              <Badge variant={severityConfig.badgeVariant}>
                                {violation.severity}
                              </Badge>
                            </div>
                            <CardDescription>{violation.ruleName}</CardDescription>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <p className="text-sm font-medium mb-1">Issue:</p>
                        <p className="text-sm text-muted-foreground">{details.message}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-medium mb-1">Expected:</p>
                          <p className="text-sm text-muted-foreground">{details.expected}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium mb-1">Actual:</p>
                          <p className="text-sm text-muted-foreground">{details.actual}</p>
                        </div>
                      </div>
                      {details.suggestions && details.suggestions.length > 0 && (
                        <div>
                          <p className="text-sm font-medium mb-2">Suggestions:</p>
                          <ul className="list-disc list-inside space-y-1">
                            {details.suggestions.map((suggestion: string, i: number) => (
                              <li key={i} className="text-sm text-muted-foreground">
                                {suggestion}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      <div className="flex gap-2 pt-2">
                        <Button variant="outline" size="sm">
                          View Entity
                        </Button>
                        <Button variant="outline" size="sm">
                          AI Fix Suggestions
                        </Button>
                        <Button variant="outline" size="sm">
                          Mark Resolved
                        </Button>
                        <Button variant="ghost" size="sm">
                          Ignore
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Rules Tab */}
        <TabsContent value="rules" className="space-y-4">
          {rules && rules.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium">No validation rules configured</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Create rules to start monitoring your EA repository quality
                </p>
                <Button className="mt-4">Create First Rule</Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {rules?.map((rule) => (
                <Card key={rule.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <CardTitle className="text-lg">{rule.name}</CardTitle>
                          <Badge variant={rule.isActive ? "default" : "secondary"}>
                            {rule.isActive ? "Active" : "Inactive"}
                          </Badge>
                          <Badge variant="outline">{rule.severity}</Badge>
                        </div>
                        {rule.description && (
                          <CardDescription>{rule.description}</CardDescription>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{rule.ruleType.replace(/_/g, " ")}</Badge>
                      <span className="text-sm text-muted-foreground">
                        Last updated: {new Date(rule.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
