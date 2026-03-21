/**
 * Automation tools — pro+ tier.
 * Manage automation rules, triggers, and webhooks.
 */
import { registerTool } from '../../tool-registry.js';
import { supportGet, supportPost } from '../../support-client.js';

registerTool({
  name: 'automation_rules_list',
  description: 'List automation rules: auto-assignment, auto-reply, escalation, notification triggers.',
  tier: 'pro',
  inputSchema: {
    type: 'object',
    properties: {
      active_only: { type: 'boolean', description: 'Show only active rules (default: false)' },
    },
  },
  handler: async (args, ctx) => {
    const res = await supportGet('mcp-internal.php', ctx, {
      action: 'list_automation_rules',
      active_only: args.active_only ? '1' : '0',
    });
    if (!res.ok) return { error: res.error || 'Failed to fetch rules' };
    return res.data;
  },
});

registerTool({
  name: 'automation_rules_create',
  description: 'Create a new automation rule. Define trigger event, conditions, and actions.',
  tier: 'pro',
  inputSchema: {
    type: 'object',
    properties: {
      name: { type: 'string', description: 'Rule name' },
      event: {
        type: 'string',
        enum: ['ticket_created', 'ticket_updated', 'ticket_status_changed', 'message_received', 'sla_breach'],
        description: 'Trigger event',
      },
      conditions: {
        type: 'object',
        description: 'Conditions object (e.g. {"priority": "critical", "status": "new"})',
      },
      actions: {
        type: 'array',
        description: 'Actions array (e.g. [{"type": "assign", "operator_id": 5}, {"type": "notify", "channel": "telegram"}])',
      },
    },
    required: ['name', 'event', 'actions'],
  },
  handler: async (args, ctx) => {
    const res = await supportPost('mcp-internal.php', ctx, {
      action: 'create_automation_rule',
      ...args,
    });
    if (!res.ok) return { error: res.error || 'Failed to create rule' };
    return { message: 'Automation rule created', data: res.data };
  },
});

registerTool({
  name: 'automation_rules_toggle',
  description: 'Enable or disable an automation rule.',
  tier: 'pro',
  inputSchema: {
    type: 'object',
    properties: {
      rule_id: { type: 'number', description: 'Rule ID' },
      active: { type: 'boolean', description: 'true to enable, false to disable' },
    },
    required: ['rule_id', 'active'],
  },
  handler: async (args, ctx) => {
    const res = await supportPost('mcp-internal.php', ctx, {
      action: 'toggle_automation_rule',
      rule_id: args.rule_id,
      active: args.active,
    });
    if (!res.ok) return { error: res.error || 'Failed to toggle rule' };
    return { message: `Rule ${args.active ? 'enabled' : 'disabled'}`, data: res.data };
  },
});

registerTool({
  name: 'webhooks_list',
  description: 'List configured outgoing webhooks with their event subscriptions and delivery stats.',
  tier: 'pro',
  inputSchema: {
    type: 'object',
    properties: {},
  },
  handler: async (_, ctx) => {
    const res = await supportGet('mcp-internal.php', ctx, { action: 'list_webhooks' });
    if (!res.ok) return { error: res.error || 'Failed to fetch webhooks' };
    return res.data;
  },
});
