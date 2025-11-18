import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  projects: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const { getProjectsByUserId } = await import("./db");
      return getProjectsByUserId(ctx.user.id);
    }),
    create: protectedProcedure
      .input(
        z.object({
          name: z.string().min(1),
          description: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { createProject } = await import("./db");
        const projectId = await createProject({
          userId: ctx.user.id,
          name: input.name,
          description: input.description,
          currentPhase: "Preliminary",
          status: "active",
        });
        return { id: projectId };
      }),
    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const { getProjectById } = await import("./db");
        return getProjectById(input.id);
      }),
    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          name: z.string().optional(),
          description: z.string().optional(),
          currentPhase: z.string().optional(),
          status: z.enum(["active", "on_hold", "completed"]).optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { updateProject } = await import("./db");
        const { id, ...data } = input;
        await updateProject(id, data);
        return { success: true };
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const { deleteProject } = await import("./db");
        await deleteProject(input.id);
        return { success: true };
      }),
  }),

  artifacts: router({
    listByProject: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ input }) => {
        const { getArtifactsByProjectId } = await import("./db");
        return getArtifactsByProjectId(input.projectId);
      }),
    listByPhase: protectedProcedure
      .input(
        z.object({
          projectId: z.number(),
          phase: z.string(),
        })
      )
      .query(async ({ input }) => {
        const { getArtifactsByPhase } = await import("./db");
        return getArtifactsByPhase(input.projectId, input.phase);
      }),
    create: protectedProcedure
      .input(
        z.object({
          projectId: z.number(),
          type: z.enum(["catalog", "matrix", "diagram"]),
          name: z.string(),
          phase: z.string(),
        })
      )
      .mutation(async ({ input }) => {
        const { createArtifact } = await import("./db");
        const artifactId = await createArtifact({
          ...input,
          status: "not_started",
        });
        return { id: artifactId };
      }),
    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const { getArtifactById } = await import("./db");
        return getArtifactById(input.id);
      }),
    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          content: z.string().optional(),
          generatedContent: z.string().optional(),
          status: z.enum(["not_started", "in_progress", "completed", "reviewed"]).optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { updateArtifact } = await import("./db");
        const { id, ...data } = input;
        await updateArtifact(id, data);
        return { success: true };
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const { deleteArtifact } = await import("./db");
        await deleteArtifact(input.id);
        return { success: true };
      }),
    generate: protectedProcedure
      .input(
        z.object({
          artifactId: z.number(),
          projectId: z.number(),
          artifactDefId: z.string(),
        })
      )
      .mutation(async ({ input }) => {
        const { getProjectById, getArtifactById, getQuestionnaireResponsesByArtifact, updateArtifact, createAssumption } = await import("./db");
        const { generateArtifact } = await import("./aiService");
        
        const project = await getProjectById(input.projectId);
        if (!project) throw new Error("Project not found");
        
        const artifact = await getArtifactById(input.artifactId);
        if (!artifact) throw new Error("Artifact not found");
        
        const responses = await getQuestionnaireResponsesByArtifact(input.artifactId);
        
        // TODO: Get related artifacts based on dependencies
        const relatedArtifacts: any[] = [];
        
        const result = await generateArtifact({
          artifactId: input.artifactDefId,
          projectName: project.name,
          projectDescription: project.description || "",
          questionnaireResponses: responses,
          relatedArtifacts,
        });
        
        // Save generated content
        await updateArtifact(input.artifactId, {
          generatedContent: result.content,
          status: "completed",
        });
        
        // Save assumptions
        for (const assumption of result.assumptions) {
          await createAssumption({
            artifactId: input.artifactId,
            description: assumption.description,
            rationale: assumption.rationale,
            impact: assumption.impact,
            status: "active",
            createdBy: "ai",
          });
        }
        
        return { success: true, content: result.content };
      }),
  }),

  questionnaire: router({
    saveResponse: protectedProcedure
      .input(
        z.object({
          artifactId: z.number(),
          questionId: z.string(),
          questionText: z.string(),
          answer: z.string(),
          source: z.enum(["user_input", "auto_populated", "ai_suggested"]),
        })
      )
      .mutation(async ({ input }) => {
        const { saveQuestionnaireResponse } = await import("./db");
        const responseId = await saveQuestionnaireResponse(input);
        return { id: responseId };
      }),
    getResponses: protectedProcedure
      .input(z.object({ artifactId: z.number() }))
      .query(async ({ input }) => {
        const { getQuestionnaireResponsesByArtifact } = await import("./db");
        return getQuestionnaireResponsesByArtifact(input.artifactId);
      }),
    getAutoPopulated: protectedProcedure
      .input(
        z.object({
          artifactId: z.number(),
          artifactDefId: z.string(),
          phase: z.string(),
          projectId: z.number(),
        })
      )
      .query(async ({ input }) => {
        const { getArtifactsByProjectId, getQuestionnaireResponsesByArtifact } = await import("./db");
        const { getRelevantSourceArtifacts, extractDataForAutoPopulation, mergeWithUserResponses } = await import("./artifactLinking");
        
        // Get all artifacts in the project
        const allArtifacts = await getArtifactsByProjectId(input.projectId);
        
        // Get relevant source artifacts
        const sourceArtifacts = getRelevantSourceArtifacts(
          input.artifactDefId,
          input.phase,
          allArtifacts
        );
        
        // Get responses for source artifacts
        const sourceResponses = new Map();
        for (const artifact of sourceArtifacts) {
          const responses = await getQuestionnaireResponsesByArtifact(artifact.id);
          sourceResponses.set(artifact.id, responses);
        }
        
        // Extract auto-populated data
        const autoPopulated = extractDataForAutoPopulation(
          input.artifactDefId,
          sourceArtifacts,
          sourceResponses
        );
        
        // Get current user responses
        const userResponses = await getQuestionnaireResponsesByArtifact(input.artifactId);
        
        // Merge with user responses
        const merged = mergeWithUserResponses(autoPopulated, userResponses);
        
        return { data: merged, sourceArtifacts: sourceArtifacts.map(a => ({ id: a.id, name: a.name, phase: a.phase })) };
      }),
    getSuggestions: protectedProcedure
      .input(
        z.object({
          question: z.string(),
          artifactName: z.string(),
          projectDescription: z.string(),
        })
      )
      .mutation(async ({ input }) => {
        const { generateQuestionSuggestions } = await import("./aiService");
        const suggestions = await generateQuestionSuggestions(input.question, {
          artifactName: input.artifactName,
          projectDescription: input.projectDescription,
        });
        return { suggestions };
      }),
  }),

  assumptions: router({
    listByArtifact: protectedProcedure
      .input(z.object({ artifactId: z.number() }))
      .query(async ({ input }) => {
        const { getAssumptionsByArtifact } = await import("./db");
        return getAssumptionsByArtifact(input.artifactId);
      }),
    create: protectedProcedure
      .input(
        z.object({
          artifactId: z.number(),
          description: z.string(),
          rationale: z.string().optional(),
          impact: z.enum(["low", "medium", "high"]),
        })
      )
      .mutation(async ({ input }) => {
        const { createAssumption } = await import("./db");
        const assumptionId = await createAssumption({
          ...input,
          status: "active",
          createdBy: "user",
        });
        return { id: assumptionId };
      }),
    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          description: z.string().optional(),
          rationale: z.string().optional(),
          impact: z.enum(["low", "medium", "high"]).optional(),
          status: z.enum(["active", "validated", "invalidated"]).optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { updateAssumption } = await import("./db");
        const { id, ...data } = input;
        await updateAssumption(id, data);
        return { success: true };
      }),
  }),

  expertise: router({
    ask: protectedProcedure
      .input(
        z.object({
          question: z.string(),
          artifactName: z.string(),
          phase: z.string(),
          projectDescription: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { provideDomainExpertise } = await import("./aiService");
        const answer = await provideDomainExpertise(input.question, {
          artifactName: input.artifactName,
          phase: input.phase,
          projectDescription: input.projectDescription,
        });
        return { answer };
      }),
  }),

  export: router({
    artifact: protectedProcedure
      .input(
        z.object({
          artifactId: z.number(),
          format: z.enum(["markdown", "pdf", "word"]),
        })
      )
      .mutation(async ({ input }) => {
        const { getArtifactById, getProjectById } = await import("./db");
        const { exportToMarkdown, exportToPDF, exportToWord } = await import("./exportService");
        
        const artifact = await getArtifactById(input.artifactId);
        if (!artifact) throw new Error("Artifact not found");
        
        const project = await getProjectById(artifact.projectId);
        if (!project) throw new Error("Project not found");
        
        let url: string;
        if (input.format === "markdown") {
          const markdown = await exportToMarkdown(artifact, project);
          const { storagePut } = await import("./storage");
          const fileName = `${artifact.name.replace(/[^a-zA-Z0-9]/g, '_')}.md`;
          const result = await storagePut(
            `exports/${project.id}/${fileName}`,
            Buffer.from(markdown),
            'text/markdown'
          );
          url = result.url;
        } else if (input.format === "pdf") {
          url = await exportToPDF(artifact, project);
        } else {
          url = await exportToWord(artifact, project);
        }
        
        return { url };
      }),
    deliverable: protectedProcedure
      .input(
        z.object({
          projectId: z.number(),
          format: z.enum(["markdown", "pdf", "word"]),
        })
      )
      .mutation(async ({ input }) => {
        const { getProjectById, getArtifactsByProjectId } = await import("./db");
        const { exportDeliverable } = await import("./exportService");
        
        const project = await getProjectById(input.projectId);
        if (!project) throw new Error("Project not found");
        
        const artifacts = await getArtifactsByProjectId(input.projectId);
        const completedArtifacts = artifacts.filter(a => a.status === "completed" && a.generatedContent);
        
        if (completedArtifacts.length === 0) {
          throw new Error("No completed artifacts to export");
        }
        
        const url = await exportDeliverable(completedArtifacts, project, input.format);
        return { url };
      }),
  }),

  canva: router({
    createPresentation: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const { getProjectById, updateProject, getArtifactsByProjectId } = await import("./db");
        const { createCanvaPresentation } = await import("./canvaService");
        
        const project = await getProjectById(input.projectId);
        if (!project) throw new Error("Project not found");
        if (project.userId !== ctx.user.id) throw new Error("Unauthorized");
        
        // Get first artifact for presentation
        const artifacts = await getArtifactsByProjectId(input.projectId);
        if (artifacts.length === 0) {
          throw new Error("No artifacts found. Create artifacts first.");
        }
        
        const canvaResult = await createCanvaPresentation(artifacts[0], project.name);
        
        // Save Canva URL to database
        await updateProject(input.projectId, {
          canvaDesignUrl: canvaResult.editUrl,
          canvaSyncedAt: new Date(),
        });
        
        return { canvaUrl: canvaResult.editUrl };
      }),
    createDeck: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .mutation(async ({ input }) => {
        const { getProjectById, getArtifactsByProjectId } = await import("./db");
        const { createPresentationDeck } = await import("./canvaService");
        
        const project = await getProjectById(input.projectId);
        if (!project) throw new Error("Project not found");
        
        const artifacts = await getArtifactsByProjectId(input.projectId);
        const completedArtifacts = artifacts.filter(a => a.status === "completed" && a.generatedContent);
        
        if (completedArtifacts.length === 0) {
          throw new Error("No completed artifacts to include in deck");
        }
        
        const result = await createPresentationDeck(completedArtifacts, project.name);
        return result;
      }),
    exportDesign: protectedProcedure
      .input(
        z.object({
          designId: z.string(),
          format: z.enum(["pdf", "pptx", "png", "jpg"]),
        })
      )
      .mutation(async ({ input }) => {
        const { exportCanvaDesign } = await import("./canvaService");
        const result = await exportCanvaDesign(input.designId, input.format);
        return result;
      }),
  }),

  notion: router({  
    exportProject: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ input, ctx }) => {
        const { getProjectById, getArtifactsByProjectId } = await import("./db");
        const { ADM_PHASES } = await import("../shared/togafArtifacts");
        
        const project = await getProjectById(input.projectId);
        if (!project) throw new Error("Project not found");
        if (project.userId !== ctx.user.id) throw new Error("Unauthorized");
        
        const artifacts = await getArtifactsByProjectId(input.projectId);
        
        // Generate Markdown content for Notion
        let markdown = `# [TOGAF] ${project.name}\n\n`;
        markdown += `## Project Overview\n`;
        markdown += `${project.description || 'No description provided'}\n\n`;
        markdown += `**Current Phase:** ${project.currentPhase}\n`;
        markdown += `**Status:** ${project.status}\n`;
        markdown += `**Created:** ${new Date(project.createdAt).toLocaleDateString()}\n\n`;
        markdown += `---\n\n`;
        markdown += `## ADM Phases\n\n`;
        
        for (const phase of ADM_PHASES) {
          markdown += `### ${phase}\n\n`;
          const phaseArtifacts = artifacts.filter(a => a.phase === phase);
          if (phaseArtifacts.length > 0) {
            phaseArtifacts.forEach(artifact => {
              markdown += `#### ${artifact.name} (${artifact.type})\n`;
              markdown += `**Status:** ${artifact.status}\n\n`;
              if (artifact.content) {
                markdown += artifact.content + '\n\n';
              }
            });
          } else {
            markdown += `*No artifacts yet*\n\n`;
          }
        }
        
        return { markdown, projectName: project.name };
      }),
    createArtifact: protectedProcedure
      .input(
        z.object({
          artifactId: z.number(),
          projectNotionUrl: z.string(),
        })
      )
      .mutation(async ({ input }) => {
        const { getArtifactById } = await import("./db");
        const { createArtifactInNotion } = await import("./notionService");
        
        const artifact = await getArtifactById(input.artifactId);
        if (!artifact) throw new Error("Artifact not found");
        
        const notionUrl = await createArtifactInNotion(
          artifact,
          input.projectNotionUrl
        );
        return { notionUrl };
      }),
    updateArtifact: protectedProcedure
      .input(
        z.object({
          artifactId: z.number(),
          notionUrl: z.string(),
        })
      )
      .mutation(async ({ input }) => {
        const { getArtifactById } = await import("./db");
        const { updateArtifactInNotion } = await import("./notionService");
        
        const artifact = await getArtifactById(input.artifactId);
        if (!artifact) throw new Error("Artifact not found");
        
        await updateArtifactInNotion(input.notionUrl, artifact);
        return { success: true };
      }),
    createDatabase: protectedProcedure
      .input(z.object({ projectName: z.string() }))
      .mutation(async ({ input }) => {
        const { createTOGAFDatabaseInNotion } = await import("./notionService");
        const databaseUrl = await createTOGAFDatabaseInNotion(input.projectName);
        return { databaseUrl };
      }),
  }),
});

export type AppRouter = typeof appRouter;
