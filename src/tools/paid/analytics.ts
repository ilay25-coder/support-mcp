/**
 * Analytics tools — starter+ tier.
 * Provides dashboard data, SLA metrics, operator performance.
 */
import { registerTool } from '../../tool-registry.js';
import { supportGet } from '../../support-client.js';

registerTool({
  name: 'analytics_dashboard',
  description: 'Get support dashboard overview: open tickets, SLA compliance, average response time, ticket volume trends.',
  tier: 'starter',
  inputSchema: {
    type: 'object',
    properties: {
      period: { type: 'string', enum: ['today', 'week', 'month', 'quarter'], description: 'Time period (default: week)' },
    },
  },
  handler: async (args, ctx) => {
    const res = await supportGet('mcp-internal.php', ctx, {
      action: 'analytics_dashboard',
      period: args.period || 'week',
    });
    if (!res.ok) return { error: res.error || 'Failed to fetch analytics' };
    return res.data;
  },
});

registerTool({
  name: 'analytics_sla',
  description: 'Get SLA compliance report: response time metrics, breach count, compliance percentage by priority.',
  tier: 'pro',
  inputSchema: {
    type: 'object',
    properties: {
      period: { type: 'string', enum: ['today', 'week', 'month', 'quarter'], description: 'Time period' },
    },
  },
  handler: async (args, ctx) => {
    const res = await supportGet('mcp-internal.php', ctx, {
      action: 'analytics_sla',
      period: args.period || 'month',
    });
    if (!res.ok) return { error: res.error || 'Failed to fetch SLA report' };
    return res.data;
  },
});

registerTool({
  name: 'analytics_operators',
  description: 'Get operator performance report: tickets handled, avg response time, resolution rate, customer satisfaction per operator.',
  tier: 'pro',
  inputSchema: {
    type: 'object',
    properties: {
      period: { type: 'string', enum: ['today', 'week', 'month', 'quarter'], description: 'Time period' },
      operator_id: { type: 'number', description: 'Specific operator ID (omit for all)' },
    },
  },
  handler: async (args, ctx) => {
    const res = await supportGet('mcp-internal.php', ctx, {
      action: 'analytics_operators',
      period: args.period || 'month',
      operator_id: args.operator_id,
    });
    if (!res.ok) return { error: res.error || 'Failed to fetch operator stats' };
    return res.data;
  },
});
