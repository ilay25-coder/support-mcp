/**
 * Bitrix24 proxy tools — business+ tier.
 * Proxies requests to Bitrix24 through Support's existing OAuth integration.
 * This is secure: AI never sees OAuth tokens directly.
 */
import { registerTool } from '../../tool-registry.js';
import { supportGet, supportPost } from '../../support-client.js';

registerTool({
  name: 'bitrix_contacts',
  description: 'Search and list CRM contacts from Bitrix24. Uses your tenant\'s Bitrix24 integration.',
  tier: 'business',
  inputSchema: {
    type: 'object',
    properties: {
      search: { type: 'string', description: 'Search by name, phone, or email' },
      limit: { type: 'number', description: 'Max results (default 20)' },
    },
  },
  handler: async (args, ctx) => {
    const res = await supportGet('mcp-internal.php', ctx, {
      action: 'bitrix_contacts',
      search: args.search,
      limit: args.limit || 20,
    });
    if (!res.ok) return { error: res.error || 'Failed to fetch contacts. Is Bitrix24 connected?' };
    return res.data;
  },
});

registerTool({
  name: 'bitrix_deals',
  description: 'List CRM deals from Bitrix24. Filter by stage, responsible person, or search.',
  tier: 'business',
  inputSchema: {
    type: 'object',
    properties: {
      search: { type: 'string', description: 'Search by deal title' },
      stage: { type: 'string', description: 'Filter by stage (e.g. "NEW", "WON", "LOSE")' },
      limit: { type: 'number', description: 'Max results (default 20)' },
    },
  },
  handler: async (args, ctx) => {
    const res = await supportGet('mcp-internal.php', ctx, {
      action: 'bitrix_deals',
      ...args,
      limit: args.limit || 20,
    });
    if (!res.ok) return { error: res.error || 'Failed to fetch deals' };
    return res.data;
  },
});

registerTool({
  name: 'bitrix_tasks',
  description: 'List tasks from Bitrix24. Can filter by status and responsible user.',
  tier: 'business',
  inputSchema: {
    type: 'object',
    properties: {
      status: { type: 'string', enum: ['pending', 'in_progress', 'completed', 'deferred'], description: 'Task status filter' },
      responsible_id: { type: 'number', description: 'Bitrix24 user ID of responsible person' },
      limit: { type: 'number', description: 'Max results (default 20)' },
    },
  },
  handler: async (args, ctx) => {
    const res = await supportGet('mcp-internal.php', ctx, {
      action: 'bitrix_tasks',
      ...args,
      limit: args.limit || 20,
    });
    if (!res.ok) return { error: res.error || 'Failed to fetch tasks' };
    return res.data;
  },
});

registerTool({
  name: 'bitrix_task_create',
  description: 'Create a task in Bitrix24 linked to a support ticket. Syncs status updates between systems.',
  tier: 'business',
  inputSchema: {
    type: 'object',
    properties: {
      title: { type: 'string', description: 'Task title' },
      description: { type: 'string', description: 'Task description' },
      responsible_id: { type: 'number', description: 'Bitrix24 user ID to assign to' },
      ticket_id: { type: 'number', description: 'Support ticket ID to link with' },
      deadline: { type: 'string', description: 'Deadline in ISO format (e.g. "2026-04-01T18:00:00")' },
    },
    required: ['title'],
  },
  handler: async (args, ctx) => {
    const res = await supportPost('mcp-internal.php', ctx, {
      action: 'bitrix_create_task',
      ...args,
    });
    if (!res.ok) return { error: res.error || 'Failed to create task' };
    return { message: 'Bitrix24 task created', data: res.data };
  },
});

registerTool({
  name: 'bitrix_users',
  description: 'List Bitrix24 portal users (employees). Useful for finding who to assign tasks to.',
  tier: 'business',
  inputSchema: {
    type: 'object',
    properties: {
      active_only: { type: 'boolean', description: 'Show only active users (default: true)' },
    },
  },
  handler: async (args, ctx) => {
    const res = await supportGet('mcp-internal.php', ctx, {
      action: 'bitrix_users',
      active_only: args.active_only !== false ? '1' : '0',
    });
    if (!res.ok) return { error: res.error || 'Failed to fetch users' };
    return res.data;
  },
});
