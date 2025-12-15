# AI Agent Implementation

This module implements an AI agent that can interact with workspace data using natural language.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                           Frontend (Next.js)                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────────┐     ┌─────────────────┐     ┌───────────────┐ │
│  │   AgentPanel    │────▶│  useAgentChat   │────▶│ TOOL_EXECUTORS│ │
│  │  (UI Component) │     │    (Hook)       │     │  (GraphQL)    │ │
│  └─────────────────┘     └────────┬────────┘     └───────────────┘ │
│                                   │                                 │
└───────────────────────────────────┼─────────────────────────────────┘
                                    │ HTTP + SSE Streaming
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                          Backend (Fastify)                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │                   Agent Plugin (/api/agent)                     ││
│  │  ┌──────────────┐                                               ││
│  │  │ chatHandler  │ ───────▶ OpenAI API (with streaming)          ││
│  │  └──────────────┘                                               ││
│  └─────────────────────────────────────────────────────────────────┘│
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

## Key Files

### Frontend (es-erp)

- `src/lib/agent/tools.ts` - Tool definitions and executors
- `src/lib/agent/useAgentChat.ts` - Chat hook with streaming support
- `src/app/studio/[workspace_id]/components/AgentPanel/AgentPlaceholder.tsx` - UI

### Backend (es-erp-api)

- `src/plugins/agent/index.ts` - Fastify plugin registration
- `src/plugins/agent/handlers/chat.ts` - Chat handler with SSE streaming

## Flow

1. **User sends message** → `AgentPanel` → `useAgentChat.sendMessage()`
2. **Request to backend** → `POST /api/agent/chat` with auth token
3. **Backend proxies to OpenAI** → Streams response via SSE
4. **If tool call requested** → Frontend executes GraphQL query locally
5. **Tool result sent back** → OpenAI generates final response
6. **Response displayed** → Real-time token streaming in UI

## Streaming

The agent supports Server-Sent Events (SSE) streaming:

- **Text responses**: Tokens appear as they're generated
- **Tool calls**: Non-streaming (need complete response to execute)

Enable/disable with the `stream` option:

```typescript
const { messages, sendMessage } = useAgentChat({
  workspaceId,
  stream: true, // default
});
```

## Adding New Tools

1. **Add GraphQL query** in `tools.ts`:

```typescript
graphql(`
  query AgentListContacts($workspaceId: String!) {
    listContacts(workspaceId: $workspaceId) {
      id
      name
    }
  }
`);
```

2. **Run codegen**: `npm run codegen`

3. **Add tool definition** to `AGENT_TOOLS`:

```typescript
{
  type: "function" as const,
  function: {
    name: "list_contacts",
    description: "Get all contacts in the workspace",
    parameters: {
      type: "object",
      properties: {},
      required: [],
    },
  },
}
```

4. **Add executor** to `TOOL_EXECUTORS`:

```typescript
list_contacts: async (args, apolloClient) => {
  const result = await apolloClient.query({
    query: AgentListContactsDocument,
    variables: { workspaceId: args.workspaceId },
    fetchPolicy: "network-only",
  });
  return result.data.listContacts;
};
```

## Environment Variables

### Frontend

No additional env vars needed - uses existing config.

### Backend (es-erp-api)

```
OPENAI_API_KEY=sk-...
```

## Security

- **Authentication**: All requests require valid JWT token
- **Workspace scoping**: LLM is unaware of workspace - injected by frontend
- **Tool execution**: Runs in user's context with their permissions
- **API key**: Stored securely on backend only
