/**
 * TehProf Support MCP Server
 *
 * Streamable HTTP transport for remote AI clients.
 * Auth: Bearer API key → validates against Support backend.
 * Anonymous access: free-tier tools (knowledge, onboarding, demo, pricing).
 */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { createServer, type IncomingMessage, type ServerResponse } from 'http';
import { extractBearerToken, validateApiKey, ANONYMOUS_CONTEXT } from './auth.js';
import { getToolsForTier, executeTool } from './tool-registry.js';
import type { AuthContext } from './types.js';

// Import tool registrations
import './tools/free/knowledge.js';
import './tools/free/onboarding.js';
import './tools/free/demo.js';
import './tools/free/pricing.js';
import './tools/free/system.js';
import './tools/paid/tickets.js';
import './tools/paid/analytics.js';
import './tools/paid/settings.js';
import './tools/paid/channels.js';
import './tools/paid/automation.js';
import './tools/bitrix/proxy.js';

const PORT = parseInt(process.env.MCP_PORT || '8101', 10);
const HOST = process.env.MCP_HOST || '127.0.0.1';

/** Active sessions mapped by session ID */
const sessions = new Map<string, { transport: StreamableHTTPServerTransport; auth: AuthContext }>();

/** Create a new MCP server instance for a session */
function createMcpServer(auth: AuthContext): McpServer {
  const server = new McpServer({
    name: 'TehProf Support',
    version: '1.0.0',
  });

  // Register tools dynamically based on tier
  const toolDefs = getToolsForTier(auth.tenantPlan);
  for (const tool of toolDefs) {
    server.tool(
      tool.name,
      tool.description,
      async (args: Record<string, unknown>) => {
        return executeTool(tool.name, args, auth) as never;
      }
    );
  }

  return server;
}

/** Handle CORS preflight */
function handleCors(res: ServerResponse): void {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, MCP-Session-Id, MCP-Protocol-Version');
  res.setHeader('Access-Control-Expose-Headers', 'MCP-Session-Id');
}

/** Read request body */
function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
    req.on('error', reject);
  });
}

/** Main HTTP handler */
async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  handleCors(res);

  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);

  // Health check
  if (url.pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true, sessions: sessions.size }));
    return;
  }

  // .well-known/mcp.json — server card for discovery
  if (url.pathname === '/.well-known/mcp.json') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(getServerCard()));
    return;
  }

  // MCP endpoint
  if (url.pathname !== '/mcp') {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found. Use /mcp endpoint.' }));
    return;
  }

  // Authenticate
  const token = extractBearerToken(req.headers.authorization || null);
  let auth: AuthContext;

  if (token) {
    const validated = await validateApiKey(token);
    if (!validated) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Invalid API key' }));
      return;
    }
    auth = validated;
  } else {
    auth = ANONYMOUS_CONTEXT;
  }

  const sessionId = req.headers['mcp-session-id'] as string | undefined;

  if (req.method === 'POST') {
    if (sessionId && sessions.has(sessionId)) {
      // Existing session
      const session = sessions.get(sessionId)!;
      await session.transport.handleRequest(req, res);
    } else {
      // New session
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => crypto.randomUUID(),
        onsessioninitialized: (sid) => {
          sessions.set(sid, { transport, auth });
        },
      });

      transport.onclose = () => {
        const sid = [...sessions.entries()].find(([, v]) => v.transport === transport)?.[0];
        if (sid) sessions.delete(sid);
      };

      const server = createMcpServer(auth);
      await server.connect(transport);
      await transport.handleRequest(req, res);
    }
  } else if (req.method === 'GET') {
    // SSE stream for notifications
    if (sessionId && sessions.has(sessionId)) {
      const session = sessions.get(sessionId)!;
      await session.transport.handleRequest(req, res);
    } else {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Missing or invalid MCP-Session-Id header' }));
    }
  } else if (req.method === 'DELETE') {
    // Close session
    if (sessionId && sessions.has(sessionId)) {
      const session = sessions.get(sessionId)!;
      await session.transport.handleRequest(req, res);
      sessions.delete(sessionId);
    } else {
      res.writeHead(404);
      res.end();
    }
  } else {
    res.writeHead(405);
    res.end();
  }
}

/** Server card for .well-known/mcp.json discovery */
function getServerCard() {
  return {
    name: 'TehProf Support',
    description: 'AI-powered helpdesk & ticket management platform. Manage support tickets, knowledge base, analytics, and CRM integrations via MCP.',
    url: 'https://support.tehprof.kz/mcp',
    version: '1.0.0',
    transport: 'streamable-http',
    authentication: {
      type: 'bearer',
      description: 'API key from Support admin panel. Anonymous access provides free-tier tools (knowledge base, onboarding, demo, pricing).',
    },
    capabilities: {
      tools: true,
      resources: false,
      prompts: false,
    },
    tiers: {
      free: 'Knowledge base, onboarding guides, demo sandbox, pricing info. AI can read and configure free-plan features.',
      starter: 'Basic ticket management, dashboard analytics.',
      pro: 'Full ticket CRUD, operator management, detailed analytics, AI assistant settings.',
      business: 'Bitrix24 CRM integration, multi-channel management, automation rules.',
      enterprise: 'Bulk operations, webhooks, custom tools.',
    },
    contact: 'support@tehprof.kz',
    homepage: 'https://support.tehprof.kz',
  };
}

// Start server
const server = createServer(handler);
server.listen(PORT, HOST, () => {
  console.log(`[MCP] TehProf Support MCP Server running on http://${HOST}:${PORT}`);
  console.log(`[MCP] Endpoint: http://${HOST}:${PORT}/mcp`);
  console.log(`[MCP] Server card: http://${HOST}:${PORT}/.well-known/mcp.json`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('[MCP] Shutting down...');
  for (const [sid, session] of sessions) {
    session.transport.close?.();
    sessions.delete(sid);
  }
  server.close();
});
