import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Projects from "./pages/Projects";
import ProjectDetail from "./pages/ProjectDetail";
import ArtifactEditor from "./pages/ArtifactEditor";
import EAEntityBrowser from "./pages/EAEntityBrowser";
import AuditHistory from "./pages/AuditHistory";
import Dashboard from "./pages/Dashboard";
import ValidationDashboard from "./pages/ValidationDashboard";
import AIGenerationWizard from "./pages/AIGenerationWizard";
import AssessmentDashboard from "./pages/AssessmentDashboard";
import CapabilitySelection from "./pages/CapabilitySelection";
import AssessmentDetail from "./pages/AssessmentDetail";

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path="/projects" component={Projects} />
      <Route path="/projects/:id" component={ProjectDetail} />
      <Route path="/projects/:projectId/artifacts/:artifactId" component={ArtifactEditor} />
      <Route path="/projects/:projectId/ea-entities" component={EAEntityBrowser} />
      <Route path="/projects/:projectId/audit-history" component={AuditHistory} />
      <Route path="/projects/:id/dashboard" component={Dashboard} />
      <Route path="/projects/:projectId/validation" component={ValidationDashboard} />
      <Route path="/projects/:projectId/ai-generate" component={AIGenerationWizard} />
      <Route path="/projects/:projectId/assessments" component={AssessmentDashboard} />
      <Route path="/projects/:projectId/assessments/new" component={CapabilitySelection} />
      <Route path="/projects/:projectId/assessments/:assessmentId" component={AssessmentDetail} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
