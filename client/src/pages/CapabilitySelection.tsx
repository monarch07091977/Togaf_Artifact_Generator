import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Search, ArrowLeft, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export default function CapabilitySelection() {
  const { projectId } = useParams<{ projectId: string }>();
  const [, navigate] = useLocation();
  const projectIdNum = parseInt(projectId || "0");

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIndustry, setSelectedIndustry] = useState<string>("all");
  const [selectedCapability, setSelectedCapability] = useState<number | null>(null);

  const { data: industries, isLoading: industriesLoading } = trpc.capabilityCatalog.listIndustries.useQuery();
  
  const { data: capabilities, isLoading: capabilitiesLoading } = trpc.capabilityCatalog.listCapabilities.useQuery({
    industry: selectedIndustry === "all" ? undefined : selectedIndustry,
    search: searchQuery || undefined,
  });

  const createAssessmentMutation = trpc.capabilityAssessment.createAssessment.useMutation({
    onSuccess: (data) => {
      toast.success(`Assessment created for ${data.capabilityName}`);
      navigate(`/projects/${projectId}/assessments/${data.id}`);
    },
    onError: (error) => {
      toast.error(`Failed to create assessment: ${error.message}`);
    },
  });

  const handleCreateAssessment = () => {
    if (!selectedCapability) {
      toast.error("Please select a capability");
      return;
    }

    createAssessmentMutation.mutate({
      projectId: projectIdNum,
      capabilityId: selectedCapability,
    });
  };

  const filteredCapabilities = capabilities || [];

  // Group capabilities by industry for display
  const capabilitiesByIndustry = filteredCapabilities.reduce((acc, cap) => {
    if (!acc[cap.industry]) {
      acc[cap.industry] = [];
    }
    acc[cap.industry].push(cap);
    return acc;
  }, {} as Record<string, typeof filteredCapabilities>);

  if (industriesLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

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
        <div>
          <h1 className="text-3xl font-bold">Select Capability</h1>
          <p className="text-muted-foreground">
            Choose a capability to assess its maturity level
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search capabilities..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Industry Tabs */}
      <Tabs value={selectedIndustry} onValueChange={setSelectedIndustry}>
        <TabsList className="w-full justify-start overflow-x-auto flex-wrap h-auto">
          <TabsTrigger value="all">All Industries</TabsTrigger>
          {industries?.map((industry) => (
            <TabsTrigger key={industry} value={industry}>
              {industry}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={selectedIndustry} className="mt-6">
          {capabilitiesLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredCapabilities.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <p className="text-muted-foreground">No capabilities found</p>
              </CardContent>
            </Card>
          ) : selectedIndustry === "all" ? (
            // Show grouped by industry when "All" is selected
            <div className="space-y-8">
              {Object.entries(capabilitiesByIndustry).map(([industry, caps]) => (
                <div key={industry}>
                  <h2 className="text-xl font-semibold mb-4">{industry}</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {caps.map((capability) => (
                      <Card
                        key={capability.id}
                        className={`cursor-pointer transition-all ${
                          selectedCapability === capability.id
                            ? "ring-2 ring-primary shadow-md"
                            : "hover:shadow-md"
                        }`}
                        onClick={() => setSelectedCapability(capability.id)}
                      >
                        <CardHeader>
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <CardTitle className="text-base mb-1">{capability.name}</CardTitle>
                              <CardDescription className="text-xs">{capability.referenceId}</CardDescription>
                            </div>
                            {selectedCapability === capability.id && (
                              <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                            )}
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground line-clamp-3 mb-3">
                            {capability.description}
                          </p>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">Level {capability.level}</Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // Show flat list when specific industry is selected
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCapabilities.map((capability) => (
                <Card
                  key={capability.id}
                  className={`cursor-pointer transition-all ${
                    selectedCapability === capability.id
                      ? "ring-2 ring-primary shadow-md"
                      : "hover:shadow-md"
                  }`}
                  onClick={() => setSelectedCapability(capability.id)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <CardTitle className="text-base mb-1">{capability.name}</CardTitle>
                        <CardDescription className="text-xs">{capability.referenceId}</CardDescription>
                      </div>
                      {selectedCapability === capability.id && (
                        <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-3 mb-3">
                      {capability.description}
                    </p>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">Level {capability.level}</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Action Buttons */}
      {selectedCapability && (
        <div className="sticky bottom-0 bg-background border-t pt-4 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {filteredCapabilities.find((c) => c.id === selectedCapability)?.name} selected
          </p>
          <Button
            onClick={handleCreateAssessment}
            disabled={createAssessmentMutation.isPending}
          >
            {createAssessmentMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              "Start Assessment"
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
