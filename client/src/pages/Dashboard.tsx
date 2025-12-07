import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart3, 
  Network, 
  Activity, 
  TrendingUp,
  Database,
  GitBranch,
  Clock
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const ENTITY_TYPE_LABELS: Record<string, string> = {
  businessCapability: "Business Capabilities",
  application: "Applications",
  businessProcess: "Business Processes",
  dataEntity: "Data Entities",
  requirement: "Requirements",
};

const ENTITY_TYPE_COLORS: Record<string, string> = {
  businessCapability: "bg-blue-500",
  application: "bg-green-500",
  businessProcess: "bg-purple-500",
  dataEntity: "bg-orange-500",
  requirement: "bg-pink-500",
};

const RELATIONSHIP_TYPE_LABELS: Record<string, string> = {
  SUPPORTS: "Supports",
  USES: "Uses",
  REALIZES: "Realizes",
  IMPLEMENTS: "Implements",
  DEPENDS_ON: "Depends On",
  OWNS: "Owns",
  MANAGES: "Manages",
  TRIGGERS: "Triggers",
  FLOWS_TO: "Flows To",
  ORIGINATES_FROM: "Originates From",
};

export default function Dashboard() {
  const params = useParams();
  const projectId = parseInt(params.projectId || "0");

  const { data: analytics, isLoading: analyticsLoading } = trpc.analytics.getProjectAnalytics.useQuery({
    projectId,
  });

  const { data: topEntities, isLoading: topEntitiesLoading } = trpc.analytics.getTopConnectedEntities.useQuery({
    projectId,
    limit: 10,
  });

  const { data: recentActivity, isLoading: activityLoading } = trpc.analytics.getRecentActivity.useQuery({
    projectId,
    limit: 20,
    days: 30,
  });

  if (analyticsLoading) {
    return (
      <div className="container py-8 space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="container py-8">
        <p className="text-muted-foreground">No analytics data available</p>
      </div>
    );
  }

  const totalEntities = analytics.totalEntities;
  const totalRelationships = analytics.totalRelationships;
  const relationshipDensity = analytics.relationshipDensity;

  return (
    <div className="container py-8 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Dashboard Analytics</h1>
        <p className="text-muted-foreground">
          Comprehensive insights into your Enterprise Architecture repository
        </p>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Entities</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEntities}</div>
            <p className="text-xs text-muted-foreground">
              Across all entity types
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Relationships</CardTitle>
            <GitBranch className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRelationships}</div>
            <p className="text-xs text-muted-foreground">
              Total connections
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Relationship Density</CardTitle>
            <Network className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{relationshipDensity.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Avg. relationships per entity
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Entity Types</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Object.keys(analytics.entityCounts).length}</div>
            <p className="text-xs text-muted-foreground">
              Different entity types
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Entity Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Entity Distribution</CardTitle>
          <CardDescription>
            Breakdown of entities by type
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(analytics.entityCounts).map(([type, count]) => {
              const percentage = totalEntities > 0 ? ((count / totalEntities) * 100).toFixed(1) : 0;
              return (
                <div key={type} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{ENTITY_TYPE_LABELS[type]}</span>
                    <span className="text-muted-foreground">{count} ({percentage}%)</span>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div
                      className={`h-full ${ENTITY_TYPE_COLORS[type]}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Two Column Layout */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Relationship Type Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Relationship Types</CardTitle>
            <CardDescription>
              Distribution of relationship types
            </CardDescription>
          </CardHeader>
          <CardContent>
            {analytics.relationshipTypeDistribution.length === 0 ? (
              <p className="text-sm text-muted-foreground">No relationships yet</p>
            ) : (
              <div className="space-y-3">
                {analytics.relationshipTypeDistribution
                  .sort((a, b) => b.count - a.count)
                  .map((rel) => (
                    <div key={rel.type} className="flex items-center justify-between">
                      <Badge variant="outline">{RELATIONSHIP_TYPE_LABELS[rel.type] || rel.type}</Badge>
                      <span className="text-sm font-medium">{rel.count}</span>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Connected Entities */}
        <Card>
          <CardHeader>
            <CardTitle>Top Connected Entities</CardTitle>
            <CardDescription>
              Entities with the most relationships
            </CardDescription>
          </CardHeader>
          <CardContent>
            {topEntitiesLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12" />
                ))}
              </div>
            ) : !topEntities || topEntities.length === 0 ? (
              <p className="text-sm text-muted-foreground">No entities yet</p>
            ) : (
              <div className="space-y-3">
                {topEntities.map((entity, index) => (
                  <div key={`${entity.entityType}-${entity.entityId}`} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{entity.entityName}</p>
                        <p className="text-xs text-muted-foreground">
                          {ENTITY_TYPE_LABELS[entity.entityType]}
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary">{entity.relationshipCount} connections</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Activity
          </CardTitle>
          <CardDescription>
            Latest entity creations in the last 30 days
          </CardDescription>
        </CardHeader>
        <CardContent>
          {activityLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-16" />
              ))}
            </div>
          ) : !recentActivity || recentActivity.length === 0 ? (
            <p className="text-sm text-muted-foreground">No recent activity</p>
          ) : (
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-start gap-4 pb-4 border-b last:border-0">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-secondary">
                    <Clock className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{activity.entityName}</p>
                      <Badge variant="outline" className="text-xs">
                        {ENTITY_TYPE_LABELS[activity.entityType]}
                      </Badge>
                      <Badge 
                        variant={activity.action === 'deleted' ? 'destructive' : 'default'}
                        className="text-xs"
                      >
                        {activity.action}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
