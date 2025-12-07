import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  ChevronDown, 
  ChevronUp, 
  X, 
  Filter,
  Save,
  Share2
} from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

export interface FilterConfig {
  maturityLevels?: string[];
  lifecycleStages?: string[];
  sensitivityLevels?: string[];
  priorities?: string[];
  requirementTypes?: string[];
  createdBy?: number;
  dateRange?: {
    start?: string;
    end?: string;
  };
  [key: string]: any; // Allow additional properties for flexibility
}

interface FilterPanelProps {
  entityType: 'businessCapability' | 'application' | 'businessProcess' | 'dataEntity' | 'requirement';
  filters: FilterConfig;
  onFiltersChange: (filters: FilterConfig) => void;
  onSaveView?: () => void;
  activeFilterCount: number;
}

const MATURITY_LEVELS = [
  { value: "initial", label: "Initial" },
  { value: "developing", label: "Developing" },
  { value: "defined", label: "Defined" },
  { value: "managed", label: "Managed" },
  { value: "optimizing", label: "Optimizing" },
];

const LIFECYCLE_STAGES = [
  { value: "plan", label: "Plan" },
  { value: "develop", label: "Develop" },
  { value: "active", label: "Active" },
  { value: "retiring", label: "Retiring" },
  { value: "retired", label: "Retired" },
];

const SENSITIVITY_LEVELS = [
  { value: "public", label: "Public" },
  { value: "internal", label: "Internal" },
  { value: "confidential", label: "Confidential" },
  { value: "restricted", label: "Restricted" },
];

const PRIORITIES = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "critical", label: "Critical" },
];

const REQUIREMENT_TYPES = [
  { value: "functional", label: "Functional" },
  { value: "non-functional", label: "Non-Functional" },
  { value: "constraint", label: "Constraint" },
  { value: "assumption", label: "Assumption" },
];

export default function FilterPanel({
  entityType,
  filters,
  onFiltersChange,
  onSaveView,
  activeFilterCount,
}: FilterPanelProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleCheckboxChange = (filterKey: keyof FilterConfig, value: string, checked: boolean) => {
    const currentValues = (filters[filterKey] as string[]) || [];
    const newValues = checked
      ? [...currentValues, value]
      : currentValues.filter(v => v !== value);
    
    onFiltersChange({
      ...filters,
      [filterKey]: newValues.length > 0 ? newValues : undefined,
    });
  };

  const clearAllFilters = () => {
    onFiltersChange({});
  };

  const hasActiveFilters = activeFilterCount > 0;

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            <CardTitle className="text-lg">Filters</CardTitle>
            {hasActiveFilters && (
              <Badge variant="secondary">{activeFilterCount} active</Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
              >
                <X className="h-4 w-4 mr-1" />
                Clear All
              </Button>
            )}
            {onSaveView && (
              <Button
                variant="outline"
                size="sm"
                onClick={onSaveView}
              >
                <Save className="h-4 w-4 mr-1" />
                Save View
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>
      
      {isOpen && (
        <CardContent className="space-y-4">
          {/* Business Capability Filters */}
          {entityType === 'businessCapability' && (
            <div className="space-y-3">
              <Label className="text-sm font-medium">Maturity Level</Label>
              <div className="grid grid-cols-2 gap-3">
                {MATURITY_LEVELS.map((level) => (
                  <div key={level.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`maturity-${level.value}`}
                      checked={filters.maturityLevels?.includes(level.value) || false}
                      onCheckedChange={(checked) =>
                        handleCheckboxChange('maturityLevels', level.value, checked as boolean)
                      }
                    />
                    <Label
                      htmlFor={`maturity-${level.value}`}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {level.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Application Filters */}
          {entityType === 'application' && (
            <div className="space-y-3">
              <Label className="text-sm font-medium">Lifecycle Stage</Label>
              <div className="grid grid-cols-2 gap-3">
                {LIFECYCLE_STAGES.map((stage) => (
                  <div key={stage.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`lifecycle-${stage.value}`}
                      checked={filters.lifecycleStages?.includes(stage.value) || false}
                      onCheckedChange={(checked) =>
                        handleCheckboxChange('lifecycleStages', stage.value, checked as boolean)
                      }
                    />
                    <Label
                      htmlFor={`lifecycle-${stage.value}`}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {stage.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Data Entity Filters */}
          {entityType === 'dataEntity' && (
            <div className="space-y-3">
              <Label className="text-sm font-medium">Sensitivity Level</Label>
              <div className="grid grid-cols-2 gap-3">
                {SENSITIVITY_LEVELS.map((level) => (
                  <div key={level.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`sensitivity-${level.value}`}
                      checked={filters.sensitivityLevels?.includes(level.value) || false}
                      onCheckedChange={(checked) =>
                        handleCheckboxChange('sensitivityLevels', level.value, checked as boolean)
                      }
                    />
                    <Label
                      htmlFor={`sensitivity-${level.value}`}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {level.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Requirement Filters */}
          {entityType === 'requirement' && (
            <>
              <div className="space-y-3">
                <Label className="text-sm font-medium">Priority</Label>
                <div className="grid grid-cols-2 gap-3">
                  {PRIORITIES.map((priority) => (
                    <div key={priority.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`priority-${priority.value}`}
                        checked={filters.priorities?.includes(priority.value) || false}
                        onCheckedChange={(checked) =>
                          handleCheckboxChange('priorities', priority.value, checked as boolean)
                        }
                      />
                      <Label
                        htmlFor={`priority-${priority.value}`}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {priority.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-medium">Type</Label>
                <div className="grid grid-cols-2 gap-3">
                  {REQUIREMENT_TYPES.map((type) => (
                    <div key={type.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`type-${type.value}`}
                        checked={filters.requirementTypes?.includes(type.value) || false}
                        onCheckedChange={(checked) =>
                          handleCheckboxChange('requirementTypes', type.value, checked as boolean)
                        }
                      />
                      <Label
                        htmlFor={`type-${type.value}`}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {type.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Active Filters Display */}
          {hasActiveFilters && (
            <div className="pt-4 border-t">
              <Label className="text-sm font-medium mb-2 block">Active Filters</Label>
              <div className="flex flex-wrap gap-2">
                {filters.maturityLevels?.map(level => (
                  <Badge key={level} variant="secondary">
                    Maturity: {level}
                    <button
                      className="ml-1"
                      onClick={() => handleCheckboxChange('maturityLevels', level, false)}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
                {filters.lifecycleStages?.map(stage => (
                  <Badge key={stage} variant="secondary">
                    Lifecycle: {stage}
                    <button
                      className="ml-1"
                      onClick={() => handleCheckboxChange('lifecycleStages', stage, false)}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
                {filters.sensitivityLevels?.map(level => (
                  <Badge key={level} variant="secondary">
                    Sensitivity: {level}
                    <button
                      className="ml-1"
                      onClick={() => handleCheckboxChange('sensitivityLevels', level, false)}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
                {filters.priorities?.map(priority => (
                  <Badge key={priority} variant="secondary">
                    Priority: {priority}
                    <button
                      className="ml-1"
                      onClick={() => handleCheckboxChange('priorities', priority, false)}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
                {filters.requirementTypes?.map(type => (
                  <Badge key={type} variant="secondary">
                    Type: {type}
                    <button
                      className="ml-1"
                      onClick={() => handleCheckboxChange('requirementTypes', type, false)}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
