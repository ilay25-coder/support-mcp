/**
 * Onboarding tools — FREE tier.
 * AI guides new users through setup, explains features per plan.
 */
import { registerTool } from '../../tool-registry.js';
import { TIER_ORDER, type TenantPlan } from '../../types.js';

const FEATURES_BY_TIER: Record<TenantPlan, string[]> = {
  free: [
    'Up to 50 tickets/month',
    '1 operator',
    '10 clients',
    'Email channel',
    'Basic widget for your website',
    'Knowledge base (read)',
    'Bot assistant "Dina" (default settings)',
    'MCP AI integration (read + configure free features)',
  ],
  starter: [
    'Up to 200 tickets/month',
    '3 operators',
    '50 clients',
    '+ WhatsApp channel',
    '+ Telegram channel',
    '+ Basic analytics dashboard',
    '+ SLA rules',
    '+ Quick replies',
    '+ MCP: ticket management',
  ],
  pro: [
    'Up to 1000 tickets/month',
    '10 operators + 1 supervisor',
    '200 clients',
    '+ All messaging channels',
    '+ Full analytics (6 tabs)',
    '+ Custom bot name',
    '+ AI assistant configuration',
    '+ Automation rules',
    '+ Outgoing webhooks',
    '+ MCP: full ticket CRUD + analytics',
  ],
  business: [
    'Up to 5000 tickets/month',
    '25 operators + 3 supervisors',
    '500 clients',
    '+ Bitrix24 CRM integration',
    '+ Custom bot avatar',
    '+ Multi-tenant collaboration',
    '+ Screen sharing',
    '+ MCP: Bitrix24 proxy + automation',
  ],
  enterprise: [
    'Unlimited tickets',
    'Unlimited operators',
    'Unlimited clients',
    '+ Custom integrations',
    '+ Dedicated support',
    '+ On-premise option',
    '+ MCP: bulk operations + webhooks',
  ],
};

const SETUP_STEPS = [
  { step: 1, title: 'Create your account', description: 'Register at support.tehprof.kz or install from Bitrix24 Marketplace', applies_to: 'all' },
  { step: 2, title: 'Configure company profile', description: 'Set company name, logo, timezone, business hours', applies_to: 'all' },
  { step: 3, title: 'Set up your first operator', description: 'Add team members who will handle support tickets', applies_to: 'all' },
  { step: 4, title: 'Install website widget', description: 'Add the support widget to your website for customer access', applies_to: 'all' },
  { step: 5, title: 'Connect messaging channels', description: 'Connect WhatsApp, Telegram, or email for omnichannel support', applies_to: 'starter+' },
  { step: 6, title: 'Configure SLA rules', description: 'Set response time targets and escalation rules', applies_to: 'starter+' },
  { step: 7, title: 'Set up automation', description: 'Create auto-assignment rules, triggers, and webhooks', applies_to: 'pro+' },
  { step: 8, title: 'Connect CRM', description: 'Link Bitrix24 for syncing contacts, deals, and tasks', applies_to: 'business+' },
];

registerTool({
  name: 'onboarding_guide',
  description: 'Get step-by-step setup guide for TehProf Support. Shows what to configure based on your current plan, with tips on what to set up first.',
  tier: 'free',
  inputSchema: {
    type: 'object',
    properties: {
      focus: { type: 'string', description: 'Focus area: "quickstart", "channels", "automation", "crm", "widget". Default: "quickstart"' },
    },
  },
  handler: async (args, ctx) => {
    const plan = ctx.tenantPlan;
    const tierLevel = TIER_ORDER[plan];

    const planApplies = (req: string) => {
      if (req === 'all') return true;
      const minTier = req.replace('+', '') as TenantPlan;
      return tierLevel >= TIER_ORDER[minTier];
    };

    const steps = SETUP_STEPS.map(s => ({
      ...s,
      available: planApplies(s.applies_to),
      upgrade_needed: !planApplies(s.applies_to) ? s.applies_to.replace('+', '') : undefined,
    }));

    return {
      plan,
      setup_steps: steps,
      tip: plan === 'free'
        ? 'Start with steps 1-4 to get your support system running. Upgrade to Starter to connect WhatsApp and Telegram.'
        : `Your ${plan} plan supports steps 1-${steps.filter(s => s.available).length}. Complete them in order for best results.`,
    };
  },
});

registerTool({
  name: 'onboarding_features',
  description: 'List all features available on your current plan and what you get by upgrading. Great for understanding the full potential of TehProf Support.',
  tier: 'free',
  inputSchema: {
    type: 'object',
    properties: {
      compare_with: { type: 'string', description: 'Plan to compare with (e.g. "pro", "business"). Shows what you gain by upgrading.' },
    },
  },
  handler: async (args, ctx) => {
    const current = ctx.tenantPlan;
    const currentFeatures = FEATURES_BY_TIER[current];

    const result: Record<string, unknown> = {
      current_plan: current,
      your_features: currentFeatures,
    };

    if (args.compare_with) {
      const comparePlan = String(args.compare_with) as TenantPlan;
      if (FEATURES_BY_TIER[comparePlan]) {
        result.compare_plan = comparePlan;
        result.additional_features = FEATURES_BY_TIER[comparePlan];
        result.upgrade_tip = `Upgrading from ${current} to ${comparePlan} adds ${FEATURES_BY_TIER[comparePlan].length} new features.`;
      }
    } else {
      // Show next tier
      const tiers = Object.keys(TIER_ORDER) as TenantPlan[];
      const nextIdx = TIER_ORDER[current] + 1;
      const nextTier = tiers.find(t => TIER_ORDER[t] === nextIdx);
      if (nextTier) {
        result.next_plan = nextTier;
        result.next_plan_features = FEATURES_BY_TIER[nextTier];
        result.upgrade_tip = `Upgrade to ${nextTier} to unlock ${FEATURES_BY_TIER[nextTier].length} additional features.`;
      }
    }

    return result;
  },
});
