# AI Agent Implementation

This module implements an AI agent that can interact with workspace data using natural language.

## Architecture

The frontend agent behaves like an MCP client (similar to Cline), fetching available tools from the backend MCP server and executing them via MCP protocol.

```
┌─────────────────────────────────────────────────────────────────────┐
│                           Frontend (Next.js)                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────────┐     ┌─────────────────┐     ┌───────────────┐ │
│  │   AgentPanel    │────▶│  useAgentChat   │────▶│   McpClient   │ │
│  │  (UI Component) │     │    (Hook)       │     │               │ │
│  └─────────────────┘     └────────┬────────┘     └───────┬───────┘ │
│                                   │                       │         │
└───────────────────────────────────┼───────────────────────┼─────────┘
                                    │                       │
                     HTTP + SSE     │        MCP Protocol   │
                     Streaming      │        (JSON-RPC)     │
                                    ▼                       ▼
┌─────────────────────────────────────────────────────────────────────┐
│                          Backend (Fastify)                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌────────────────────────────┐   ┌────────────────────────────────┐│
│  │  Agent Plugin              │   │       MCP Server               ││
│  │  POST /api/agent/chat      │   │       POST /api/mcp            ││
│  │  ┌──────────────────────┐  │   │  ┌──────────────────────────┐  ││
│  │  │  chatHandler         │  │   │  │  Tools (GraphQL-based)   │  ││
│  │  │  (OpenAI proxy)      │  │   │  │  - list_projects         │  ││
│  │  └──────────────────────┘  │   │  │  - list_contacts         │  ││
│  └────────────────────────────┘   │  │  - list_workspaces       │  ││
│                                   │  │  - (add more here)       │  ││
│                                   │  └──────────────────────────┘  ││
│                                   └────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────┘
```

## Key Files

### Frontend (es-erp)

- `src/lib/agent/mcpClient.ts` - MCP client for communicating with backend MCP server
- `src/lib/agent/useAgentChat.ts` - Chat hook with streaming and tool execution (local + MCP)
- `src/lib/agent/localTools.ts` - Local frontend-only tools (no server round-trip)
- `src/lib/agent/fileParser.ts` - File parsing utilities for context
- `src/app/studio/[workspace_id]/components/AgentPanel/` - UI components

### Backend (es-erp-api)

- `src/plugins/agent/` - OpenAI proxy for chat completions
- `src/plugins/mcp/` - MCP server with tool definitions
  - `tools/` - Individual tool implementations (GraphQL-based)
  - `server-factory.ts` - MCP server factory
  - `index.ts` - Fastify plugin registration

## Flow

1. **Initialization**: `useAgentChat` creates an `McpClient` and fetches available tools from the MCP server
2. **User sends message** → `AgentPanel` → `useAgentChat.sendMessage()`
3. **Request to backend** → `POST /api/agent/chat` with auth token and MCP tools
4. **Backend proxies to OpenAI** → Streams response via SSE
5. **If tool call requested** → Frontend calls MCP server (`POST /api/mcp`) to execute
6. **Tool result sent back** → OpenAI generates final response
7. **Response displayed** → Real-time token streaming in UI

## MCP Integration

The frontend acts as an MCP client:

```typescript
// Initialize MCP client
const client = new McpClient(graphqlUrl, getAuthToken);
await client.initialize();

// Fetch available tools
const mcpTools = await client.listTools();
const openaiTools = mcpToolsToOpenAI(mcpTools);

// Execute a tool
const result = await client.callTool("list_projects", { workspaceId: "..." });
```

## Streaming

The agent supports Server-Sent Events (SSE) streaming:

- **Text responses**: Tokens appear as they're generated
- **Tool calls**: Non-streaming (need complete response to execute)

Enable/disable with the `stream` option:

```typescript
const { messages, sendMessage, availableTools, isInitialized } = useAgentChat({
  workspaceId,
  stream: true, // default
});
```

## Adding New Tools

Tools are defined in the **backend MCP server** (`es-erp-api/src/plugins/mcp/tools/`).

1. **Create a new tool file** (e.g., `create_project.ts`):

```typescript
import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { gql } from "graphql-request";
import { z } from "zod";
import type { Sdk } from "../generated/graphql";
import { McpTool } from "./types";

// GraphQL operation (picked up by codegen)
gql`
  mutation McpCreateProject($input: ProjectInput!) {
    createProject(input: $input) {
      id
      name
    }
  }
`;

export const createProjectTool: McpTool = {
  name: "create_project",
  description: "Create a new project in the workspace",
  inputSchema: {
    workspaceId: z.string().describe("The workspace ID"),
    name: z.string().describe("Project name"),
    project_code: z.string().describe("Unique project code"),
  },
  handler: async (sdk: Sdk, args): Promise<CallToolResult> => {
    const result = await sdk.McpCreateProject({
      input: {
        workspaceId: args.workspaceId,
        name: args.name,
        project_code: args.project_code,
      },
    });

    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
  },
};
```

2. **Register the tool** in `tools/index.ts`:

```typescript
import { createProjectTool } from "./create_project";

export const mcpTools: McpTool[] = [
  listProjectsTool,
  listContactsTool,
  listWorkspacesTool,
  createProjectTool, // Add here
];
```

3. **Run codegen** in es-erp-api: `npm run codegen`

The frontend will automatically pick up new tools on the next page load!

## Environment Variables

### Frontend

No additional env vars needed - uses existing config.

### Backend (es-erp-api)

```
OPENAI_API_KEY=sk-...
```

## Security

- **Authentication**: All requests require valid JWT token
- **MCP server**: Authenticates requests, uses user's GraphQL permissions
- **Tool execution**: Runs in user's context with their permissions
- **API key**: OpenAI key stored securely on backend only

## Local Tools (Frontend-Only)

The agent includes a local tool that executes entirely in the browser:

### `present_options` Tool

This tool enables interactive decision-making during conversations. When the AI needs user input, it calls this tool to show clickable options.

**How it works:**

1. AI calls `present_options` with a question and options
2. Hook pauses and sets `pendingUserOptions` state
3. UI renders the options as clickable buttons
4. User clicks an option
5. UI calls `selectOption(optionId)`
6. Hook resumes with the selected option
7. AI continues based on user's choice

**Example AI tool call:**

```json
{
  "question": "I found 3 projects. Which one would you like to work with?",
  "options": [
    { "id": "proj_123", "label": "Downtown Construction" },
    { "id": "proj_456", "label": "Airport Expansion" },
    { "id": "proj_789", "label": "Highway Repair" }
  ]
}
```

### UI Integration

The `useAgentChat` hook exposes:

```typescript
const {
  pendingUserOptions,  // { question, options, toolCallId } | null
  selectOption,        // (optionId: string) => void
  // ... other fields
} = useAgentChat({ workspaceId });

// In your UI component:
{pendingUserOptions && (
  <div className="user-options">
    <p>{pendingUserOptions.question}</p>
    <div className="options-grid">
      {pendingUserOptions.options.map((opt) => (
        <button
          key={opt.id}
          onClick={() => selectOption(opt.id)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  </div>
)}
```

### When AI Uses This Tool

The system prompt encourages using `present_options` for:

- Multiple matches found (choose which item)
- Ambiguous requests (clarify intent)
- Confirmation before changes
- Offering next steps after completing an action

This creates a guided, conversational experience where users click to proceed.

## Benefits of MCP Architecture

- ✅ **Single source of truth**: Tools defined once in backend, used by web app AND external AI assistants (Cline, Claude Desktop)
- ✅ **Cline-like behavior**: Frontend agent behaves like a proper MCP client
- ✅ **Easy to extend**: Add new tools in one place
- ✅ **Consistent authorization**: All tool calls go through GraphQL with user's auth
- ✅ **Hybrid local/server**: Frontend tools for browser operations, server tools for data
