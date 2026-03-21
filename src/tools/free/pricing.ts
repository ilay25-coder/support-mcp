/**
 * Pricing tools — FREE tier.
 * AI shows plans, compares features, helps choose the right tier.
 */
import { registerTool } from '../../tool-registry.js';

const PLANS = [
  {
    name: 'Free',
    slug: 'free',
    price: '0 ₸/month',
    price_usd: '$0/month',
    best_for: 'Solo freelancers, testing the platform',
    limits: { tickets: 50, operators: 1, clients: 10, storage_mb: 100, channels: ['email', 'widget'] },
    highlights: ['Basic ticket management', 'Website widget', 'Knowledge base', 'AI MCP integration (read + configure)'],
  },
  {
    name: 'Starter',
    slug: 'starter',
    price: '9,900 ₸/month',
    price_usd: '~$20/month',
    best_for: 'Small IT teams (2-3 people)',
    limits: { tickets: 200, operators: 3, clients: 50, storage_mb: 500, channels: ['email', 'widget', 'whatsapp', 'telegram'] },
    highlights: ['Multi-channel (WhatsApp, Telegram)', 'SLA rules', 'Quick replies', 'Analytics dashboard'],
  },
  {
    name: 'Pro',
    slug: 'pro',
    price: '29,900 ₸/month',
    price_usd: '~$60/month',
    best_for: 'Growing IT companies (5-10 people)',
    limits: { tickets: 1000, operators: 10, clients: 200, storage_mb: 2000, channels: 'all' },
    highlights: ['Automation rules', 'Full analytics', 'AI assistant customization', 'Webhooks', 'Supervisor role'],
  },
  {
    name: 'Business',
    slug: 'business',
    price: '49,900 ₸/month',
    price_usd: '~$100/month',
    best_for: 'IT companies with CRM (10-25 people)',
    limits: { tickets: 5000, operators: 25, clients: 500, storage_mb: 10000, channels: 'all' },
    highlights: ['Bitrix24 CRM integration', 'Screen sharing', 'Multi-tenant collaboration', 'Custom bot avatar', 'MCP Bitrix proxy'],
  },
  {
    name: 'Enterprise',
    slug: 'enterprise',
    price: '79,900 ₸/month',
    price_usd: '~$160/month',
    best_for: 'Large IT outsourcers (25+ people)',
    limits: { tickets: 'unlimited', operators: 'unlimited', clients: 'unlimited', storage_mb: 50000, channels: 'all' },
    highlights: ['Unlimited everything', 'Custom integrations', 'Dedicated support', 'On-premise option', 'Bulk MCP operations'],
  },
];

registerTool({
  name: 'pricing_plans',
  description: 'Show all available pricing plans with features, limits, and prices. Helps users choose the right plan for their needs.',
  tier: 'free',
  inputSchema: {
    type: 'object',
    properties: {
      plan: { type: 'string', description: 'Specific plan to show details for (free/starter/pro/business/enterprise). Omit for all plans.' },
    },
  },
  handler: async (args, ctx) => {
    if (args.plan) {
      const plan = PLANS.find(p => p.slug === String(args.plan));
      if (!plan) return { error: 'Plan not found', available: PLANS.map(p => p.slug) };
      return {
        plan,
        is_current: ctx.tenantPlan === plan.slug,
        ...(ctx.tenantPlan !== plan.slug && { upgrade_note: 'Contact your administrator to change plans.' }),
      };
    }

    return {
      plans: PLANS,
      current_plan: ctx.tenantPlan,
      recommendation: getRecommendation(ctx.tenantPlan),
    };
  },
});

registerTool({
  name: 'pricing_calculate',
  description: 'Calculate which plan is best based on your team size and needs. Provides a personalized recommendation.',
  tier: 'free',
  inputSchema: {
    type: 'object',
    properties: {
      team_size: { type: 'number', description: 'Number of support operators' },
      monthly_tickets: { type: 'number', description: 'Expected monthly ticket volume' },
      need_whatsapp: { type: 'boolean', description: 'Need WhatsApp channel?' },
      need_telegram: { type: 'boolean', description: 'Need Telegram channel?' },
      need_crm: { type: 'boolean', description: 'Need CRM integration (Bitrix24)?' },
      need_automation: { type: 'boolean', description: 'Need automation rules?' },
    },
    required: ['team_size'],
  },
  handler: async (args) => {
    const team = Number(args.team_size) || 1;
    const tickets = Number(args.monthly_tickets) || 50;
    const needWa = Boolean(args.need_whatsapp);
    const needTg = Boolean(args.need_telegram);
    const needCrm = Boolean(args.need_crm);
    const needAuto = Boolean(args.need_automation);

    let recommended = 'free';
    const reasons: string[] = [];

    if (needCrm) { recommended = 'business'; reasons.push('CRM integration requires Business plan'); }
    else if (needAuto) { recommended = 'pro'; reasons.push('Automation rules require Pro plan'); }
    else if (needWa || needTg) { recommended = 'starter'; reasons.push('Messaging channels require Starter plan'); }

    if (team > 25) { recommended = 'enterprise'; reasons.push(`${team} operators exceeds Business limit (25)`); }
    else if (team > 10) { recommended = 'business'; reasons.push(`${team} operators exceeds Pro limit (10)`); }
    else if (team > 3) { recommended = 'pro'; reasons.push(`${team} operators exceeds Starter limit (3)`); }
    else if (team > 1) { recommended = 'starter'; reasons.push(`${team} operators exceeds Free limit (1)`); }

    if (tickets > 5000) { recommended = 'enterprise'; reasons.push(`${tickets} tickets/month exceeds Business limit`); }
    else if (tickets > 1000) { recommended = 'business'; }
    else if (tickets > 200) { recommended = 'pro'; }
    else if (tickets > 50) { recommended = 'starter'; }

    const plan = PLANS.find(p => p.slug === recommended)!;

    return {
      recommended_plan: recommended,
      price: plan.price,
      reasons,
      plan_details: plan,
      savings_tip: team <= 1 && tickets <= 50
        ? 'You can start with the Free plan and upgrade as you grow!'
        : `The ${recommended} plan covers your needs. Start with a free trial to test.`,
    };
  },
});

function getRecommendation(currentPlan: string): string {
  switch (currentPlan) {
    case 'free': return 'Upgrade to Starter to unlock WhatsApp, Telegram, and serve up to 50 clients.';
    case 'starter': return 'Upgrade to Pro for automation, webhooks, and AI assistant customization.';
    case 'pro': return 'Upgrade to Business for Bitrix24 CRM integration and screen sharing.';
    case 'business': return 'Upgrade to Enterprise for unlimited scale and dedicated support.';
    default: return 'You have the top-tier plan with all features unlocked!';
  }
}
