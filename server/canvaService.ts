import { exec } from "child_process";
import { promisify } from "util";
import { Artifact } from "../drizzle/schema";

const execAsync = promisify(exec);

/**
 * Execute MCP command for Canva
 */
async function executeMCP(toolName: string, input: any): Promise<any> {
  const inputJson = JSON.stringify(input).replace(/"/g, '\\"');
  const command = `manus-mcp-cli tool call ${toolName} --server canva --input "${inputJson}"`;
  
  try {
    const { stdout, stderr } = await execAsync(command);
    if (stderr && !stderr.includes('Tool call completed')) {
      console.error('Canva MCP stderr:', stderr);
    }
    
    // Parse the result from stdout
    const lines = stdout.split('\n');
    const resultLine = lines.find(line => line.includes('Result:'));
    if (resultLine) {
      const jsonStart = resultLine.indexOf('{');
      if (jsonStart !== -1) {
        return JSON.parse(resultLine.substring(jsonStart));
      }
    }
    
    return { success: true, output: stdout };
  } catch (error: any) {
    console.error('Canva MCP error:', error);
    throw new Error(`Canva integration failed: ${error.message}`);
  }
}

/**
 * Generate a presentation design from artifact content using Canva AI
 */
export async function generatePresentationFromArtifact(
  artifact: Artifact,
  projectName: string
): Promise<{ candidateId: string; designId?: string }> {
  const content = artifact.content || artifact.content || '';
  
  // Generate design using Canva AI
  const prompt = `Create a professional TOGAF enterprise architecture presentation for "${artifact.name}". 
Phase: ${artifact.admPhase}
Type: ${artifact.type}
Project: ${projectName}

Content to visualize:
${content.substring(0, 1000)}...

Style: Professional, corporate, clean design with diagrams and visual hierarchy.`;

  const generateResult = await executeMCP('generate-design', {
    user_intent: `Generate a presentation for TOGAF artifact: ${artifact.name}`,
    query: prompt
  });

  if (!generateResult.candidates || generateResult.candidates.length === 0) {
    throw new Error('No design candidates generated');
  }

  const candidateId = generateResult.candidates[0].id;

  // Convert candidate to editable design
  const designResult = await executeMCP('create-design-from-candidate', {
    user_intent: `Create editable design from generated candidate for ${artifact.name}`,
    candidate_id: candidateId
  });

  return {
    candidateId,
    designId: designResult.design?.id
  };
}

/**
 * Create a Canva presentation from artifact content
 */
export async function createCanvaPresentation(
  artifact: Artifact,
  projectName: string
): Promise<{ designId: string; editUrl: string; viewUrl: string }> {
  try {
    // Try AI generation first
    const { designId } = await generatePresentationFromArtifact(artifact, projectName);
    
    if (designId) {
      const designInfo = await executeMCP('get-design', {
        user_intent: `Get design info for ${artifact.name}`,
        design_id: designId
      });

      return {
        designId,
        editUrl: designInfo.urls?.edit_url || '',
        viewUrl: designInfo.urls?.view_url || ''
      };
    }
  } catch (error) {
    console.error('AI generation failed, falling back to template:', error);
  }

  // Fallback: Create a simple doc design
  // Note: Direct creation API is not available in MCP, so we use import
  throw new Error('Canva AI generation failed. Please create design manually in Canva.');
}

/**
 * Export Canva design to various formats
 */
export async function exportCanvaDesign(
  designId: string,
  format: 'pdf' | 'pptx' | 'png' | 'jpg'
): Promise<{ downloadUrl: string }> {
  // First check available formats
  const formatsResult = await executeMCP('get-export-formats', {
    user_intent: `Check export formats for design ${designId}`,
    design_id: designId
  });

  const availableFormats = formatsResult.export_formats || [];
  if (!availableFormats.some((f: any) => f.type === format)) {
    throw new Error(`Format ${format} is not available for this design`);
  }

  // Export the design
  const exportResult = await executeMCP('export-design', {
    user_intent: `Export design ${designId} as ${format}`,
    design_id: designId,
    format: {
      type: format,
      export_quality: 'pro'
    }
  });

  return {
    downloadUrl: exportResult.urls?.download_url || exportResult.url || ''
  };
}

/**
 * Create a folder for TOGAF project in Canva
 */
export async function createProjectFolder(projectName: string): Promise<string> {
  const result = await executeMCP('create-folder', {
    user_intent: `Create folder for TOGAF project: ${projectName}`,
    name: `[TOGAF] ${projectName}`,
    parent_folder_id: 'root'
  });

  return result.folder?.id || result.id;
}

/**
 * Move design to project folder
 */
export async function moveDesignToFolder(designId: string, folderId: string): Promise<void> {
  await executeMCP('move-item-to-folder', {
    user_intent: `Organize TOGAF artifacts in project folder`,
    item_id: designId,
    to_folder_id: folderId
  });
}

/**
 * Search for existing designs
 */
export async function searchDesigns(query: string): Promise<any[]> {
  const result = await executeMCP('search-designs', {
    user_intent: `Search for existing TOGAF designs: ${query}`,
    query,
    sort_by: 'relevance'
  });

  return result.items || [];
}

/**
 * Create a complete presentation deck from multiple artifacts
 */
export async function createPresentationDeck(
  artifacts: Artifact[],
  projectName: string
): Promise<{ designId: string; editUrl: string; viewUrl: string }> {
  // Combine all artifact content
  const combinedContent = artifacts.map(a => {
    const content = a.content || a.content || '';
    return `## ${a.name} (${a.admPhase})\n\n${content}\n\n---\n\n`;
  }).join('');

  const prompt = `Create a comprehensive TOGAF enterprise architecture presentation deck for project "${projectName}".

Include these sections:
${artifacts.map((a, idx) => `${idx + 1}. ${a.name} (${a.admPhase})`).join('\n')}

Content:
${combinedContent.substring(0, 2000)}...

Style: Professional corporate presentation with clear visual hierarchy, diagrams, and consistent branding.`;

  const generateResult = await executeMCP('generate-design', {
    user_intent: `Generate complete presentation deck for TOGAF project: ${projectName}`,
    query: prompt
  });

  if (!generateResult.candidates || generateResult.candidates.length === 0) {
    throw new Error('No design candidates generated');
  }

  const candidateId = generateResult.candidates[0].id;

  const designResult = await executeMCP('create-design-from-candidate', {
    user_intent: `Create editable presentation deck for ${projectName}`,
    candidate_id: candidateId
  });

  const designId = designResult.design?.id;
  if (!designId) {
    throw new Error('Failed to create design from candidate');
  }

  const designInfo = await executeMCP('get-design', {
    user_intent: `Get design info for presentation deck`,
    design_id: designId
  });

  return {
    designId,
    editUrl: designInfo.urls?.edit_url || '',
    viewUrl: designInfo.urls?.view_url || ''
  };
}
