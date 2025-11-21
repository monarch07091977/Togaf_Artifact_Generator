import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

async function testNotionMCP() {
  console.log("Testing Notion MCP CLI...");
  console.log("Current PATH:", process.env.PATH);
  console.log("Current working directory:", process.cwd());
  
  const inputJson = JSON.stringify({ query: "test" });
  const command = `/usr/local/bin/manus-mcp-cli tool call notion-search --server notion --input '${inputJson}'`;
  
  console.log("Command:", command);
  
  try {
    const { stdout, stderr } = await execAsync(command, {
      env: { ...process.env, PATH: '/usr/local/bin:/usr/bin:/bin' }
    });
    
    console.log("SUCCESS!");
    console.log("stdout:", stdout.substring(0, 200));
    if (stderr) {
      console.log("stderr:", stderr);
    }
  } catch (error) {
    console.error("ERROR:", error.message);
    console.error("stderr:", error.stderr);
    console.error("stdout:", error.stdout);
  }
}

testNotionMCP();
