import { useState, useEffect, useRef } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";

const ENTITY_TYPE_LABELS: Record<string, string> = {
  businessCapability: "Business Capability",
  application: "Application",
  businessProcess: "Business Process",
  dataEntity: "Data Entity",
  requirement: "Requirement",
};

const ENTITY_TYPE_COLORS: Record<string, string> = {
  businessCapability: "bg-blue-100 text-blue-800",
  application: "bg-green-100 text-green-800",
  businessProcess: "bg-purple-100 text-purple-800",
  dataEntity: "bg-orange-100 text-orange-800",
  requirement: "bg-pink-100 text-pink-800",
};

export function GlobalSearch() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [, setLocation] = useLocation();

  // Debounced search query
  const { data: results = [], isLoading } = trpc.eaEntity.globalSearch.useQuery(
    { searchTerm, limit: 20 },
    { enabled: searchTerm.length >= 2 }
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Keyboard shortcuts (Cmd/Ctrl + K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || results.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % results.length);
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + results.length) % results.length);
        break;
      case "Enter":
        e.preventDefault();
        if (results[selectedIndex]) {
          handleSelectResult(results[selectedIndex]);
        }
        break;
      case "Escape":
        setIsOpen(false);
        inputRef.current?.blur();
        break;
    }
  };

  const handleSelectResult = (result: any) => {
    setLocation(`/projects/${result.projectId}/ea-entities?entityType=${result.entityType}&entityId=${result.id}`);
    setSearchTerm("");
    setIsOpen(false);
    inputRef.current?.blur();
  };

  const handleInputChange = (value: string) => {
    setSearchTerm(value);
    setSelectedIndex(0);
    setIsOpen(value.length >= 2);
  };

  return (
    <div ref={searchRef} className="relative w-full max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="text"
          placeholder="Search entities... (⌘K)"
          value={searchTerm}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => searchTerm.length >= 2 && setIsOpen(true)}
          className="pl-10 pr-4"
        />
      </div>

      {/* Autocomplete dropdown */}
      {isOpen && (
        <div className="absolute top-full mt-2 w-full bg-background border rounded-lg shadow-lg max-h-96 overflow-y-auto z-50">
          {isLoading && (
            <div className="p-4 text-sm text-muted-foreground text-center">
              Searching...
            </div>
          )}

          {!isLoading && results.length === 0 && searchTerm.length >= 2 && (
            <div className="p-4 text-sm text-muted-foreground text-center">
              No entities found
            </div>
          )}

          {!isLoading && results.length > 0 && (
            <div className="py-2">
              {results.map((result: any, index: number) => (
                <button
                  key={`${result.entityType}-${result.id}`}
                  onClick={() => handleSelectResult(result)}
                  className={`w-full px-4 py-3 text-left hover:bg-accent transition-colors ${
                    index === selectedIndex ? "bg-accent" : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{result.name}</div>
                      {result.description && (
                        <div className="text-sm text-muted-foreground truncate mt-1">
                          {result.description}
                        </div>
                      )}
                    </div>
                    <Badge
                      variant="secondary"
                      className={`shrink-0 ${ENTITY_TYPE_COLORS[result.entityType]}`}
                    >
                      {ENTITY_TYPE_LABELS[result.entityType]}
                    </Badge>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
