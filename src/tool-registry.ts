/**
 * Tool registry — all MCP tools with tier gating.
 * Each tool declares its minimum tier.
 * On any tier, AI can USE all tools of that tier + see descriptions of higher-tier tools.
 */
import type { ToolDef, AuthContext, ToolTier } from './types.js';
import { hasTierAccess } from './types.js';

const tools: ToolDef[] = [];

/** Register a tool */
export function registerTool(tool: ToolDef): void {
  tools.push(tool);
}

/** Get all registered tools */
export function getAllTools(): ToolDef[] {
  return tools;
}

/**
 * Get tools list for MCP — all tools visible, but gated ones show upgrade hint.
 * This lets AI know about features on higher tiers and recommend upgrades.
 */
export function getToolsForTier(tenantPlan: ToolTier) {
  return tools.map(tool => {
    const accessible = hasTierAccess(tenantPlan, tool.tier);
    return {
      name: tool.name,
      description: accessible
        ? tool.description
        : `[Requires ${tool.tier}+ plan] ${tool.description} — Upgrade to ${tool.tier} to unlock this feature.`,
      inputSchema: tool.inputSchema,
      accessible,
      tier: tool.tier,
    };
  });
}

/**
 * Execute a tool — checks tier access before running.
 * Returns upgrade suggestion if tier insufficient.
 */
export async function executeTool(
  name: string,
  args: Record<string, unknown>,
  ctx: AuthContext
): Promise<{ content: Array<{ type: 'text'; text: string }>; isError?: boolean }> {
  const tool = tools.find(t => t.name === name);
  if (!tool) {
    return {
      content: [{ type: 'text', text: `Unknown tool: ${name}` }],
      isError: true,
    };
  }

  if (!hasTierAccess(ctx.tenantPlan, tool.tier)) {
    const features = tools
      .filter(t => t.tier === tool.tier)
      .map(t => `  - ${t.name}: ${t.description.split('.')[0]}`)
      .join('\n');

    return {
      content: [{
        type: 'text',
        text: [
          `⚡ This feature requires the "${tool.tier}" plan or higher.`,
          `Your current plan: "${ctx.tenantPlan}".`,
          '',
          `Upgrading to "${tool.tier}" unlocks:`,
          features,
          '',
          'To upgrade, contact your administrator or use pricing.plans tool for details.',
        ].join('\n'),
      }],
    };
  }

  try {
    const result = await tool.handler(args, ctx);
    const text = typeof result === 'string' ? result : JSON.stringify(result, null, 2);
    return { content: [{ type: 'text', text }] };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      content: [{ type: 'text', text: `Error: ${msg}` }],
      isError: true,
    };
  }
}
