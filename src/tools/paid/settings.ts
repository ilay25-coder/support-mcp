/**
 * Settings tools — tiered access.
 * free: read basic settings (what's available on free plan)
 * starter+: configure settings available on their tier
 */
import { registerTool } from '../../tool-registry.js';
import { supportGet, supportPost } from '../../support-client.js';

registerTool({
  name: 'settings_get',
  description: 'Get current tenant settings: company info, business hours, SLA rules, channels, widget config, bot settings. Shows which settings are available on your plan.',
  tier: 'free',
  inputSchema: {
    type: 'object',
    properties: {
      section: {
        type: 'string',
        enum: ['general', 'business_hours', 'sla', 'channels', 'widget', 'bot', 'notifications', 'all'],
        description: 'Settings section to retrieve (default: all)',
      },
    },
  },
  handler: async (args, ctx) => {
    if (ctx.tenantId === 0) {
      return {
        message: 'Settings require authentication. Provide an API key to view your settings.',
        demo: {
          general: { company_name: 'Your Company', timezone: 'Asia/Almaty' },
          business_hours: { mon_fri: '09:00-18:00', sat_sun: 'closed' },
          hint: 'Create an API key in Settings → API Keys to manage via AI.',
        },
      };
    }

    const res = await supportGet('mcp-internal.php', ctx, {
      action: 'get_settings',
      section: args.section || 'all',
    });

    if (!res.ok) return { error: res.error || 'Failed to fetch settings' };
    return res.data;
  },
});

registerTool({
  name: 'settings_update',
  description: 'Update tenant settings. Only settings available on your current plan can be modified. AI will suggest upgrades for locked settings.',
  tier: 'free',
  inputSchema: {
    type: 'object',
    properties: {
      section: {
        type: 'string',
        enum: ['general', 'business_hours', 'sla', 'bot', 'notifications'],
        description: 'Settings section to update',
      },
      values: {
        type: 'object',
        description: 'Key-value pairs to update (e.g. {"company_name": "New Name", "timezone": "Asia/Almaty"})',
      },
    },
    required: ['section', 'values'],
  },
  handler: async (args, ctx) => {
    if (ctx.tenantId === 0) {
      return { error: 'Settings update requires authentication. Provide an API key.' };
    }

    const res = await supportPost('mcp-internal.php', ctx, {
      action: 'update_settings',
      section: args.section,
      values: args.values,
    });

    if (!res.ok) return { error: res.error || 'Failed to update settings' };
    return { message: 'Settings updated successfully', data: res.data };
  },
});

registerTool({
  name: 'settings_operators',
  description: 'List operators in your team with their roles and status. On free plan: shows your single operator. Higher plans: full team management.',
  tier: 'free',
  inputSchema: {
    type: 'object',
    properties: {},
  },
  handler: async (_, ctx) => {
    if (ctx.tenantId === 0) {
      return { message: 'Operator list requires authentication.', hint: 'Provide an API key to see your team.' };
    }

    const res = await supportGet('mcp-internal.php', ctx, { action: 'list_operators' });
    if (!res.ok) return { error: res.error || 'Failed to fetch operators' };
    return res.data;
  },
});
