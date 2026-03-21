/**
 * Demo tools — FREE tier.
 * AI can create demo tickets in a sandbox environment.
 * This lets potential users try the system before committing.
 */
import { registerTool } from '../../tool-registry.js';
import { supportPost, supportGet } from '../../support-client.js';
import { ANONYMOUS_CONTEXT } from '../../auth.js';

registerTool({
  name: 'demo_create_ticket',
  description: 'Create a demo ticket in sandbox mode to try out the support system. Demo tickets are auto-deleted after 24 hours. Great for testing workflows.',
  tier: 'free',
  inputSchema: {
    type: 'object',
    properties: {
      subject: { type: 'string', description: 'Ticket subject (e.g. "Test: Email not working")' },
      description: { type: 'string', description: 'Ticket description with details' },
      priority: { type: 'string', enum: ['low', 'normal', 'high', 'critical'], description: 'Priority level' },
    },
    required: ['subject'],
  },
  handler: async (args, ctx) => {
    const effectiveCtx = ctx.tenantId === 0 ? { ...ANONYMOUS_CONTEXT, tenantId: 1 } : ctx;

    const res = await supportPost('mcp-internal.php', effectiveCtx, {
      action: 'demo_create_ticket',
      subject: args.subject,
      description: args.description || 'Demo ticket created via MCP',
      priority: args.priority || 'normal',
    });

    if (!res.ok) {
      return { error: res.error || 'Failed to create demo ticket', hint: 'Demo tickets are limited to 5 per session.' };
    }

    return {
      message: 'Demo ticket created successfully!',
      ticket: res.data,
      next_steps: [
        'Use demo_view_ticket to see the ticket details',
        'In a real setup, operators would receive this ticket and respond',
        'Try tickets_list (requires starter+ plan) for full ticket management',
      ],
    };
  },
});

registerTool({
  name: 'demo_view_ticket',
  description: 'View a demo ticket to see how ticket details look. Shows status, priority, messages, and available actions.',
  tier: 'free',
  inputSchema: {
    type: 'object',
    properties: {
      ticket_id: { type: 'number', description: 'Demo ticket ID to view' },
    },
    required: ['ticket_id'],
  },
  handler: async (args, ctx) => {
    const effectiveCtx = ctx.tenantId === 0 ? { ...ANONYMOUS_CONTEXT, tenantId: 1 } : ctx;

    const res = await supportGet('mcp-internal.php', effectiveCtx, {
      action: 'demo_view_ticket',
      ticket_id: args.ticket_id,
    });

    if (!res.ok) {
      return { error: res.error || 'Ticket not found' };
    }

    return {
      ticket: res.data,
      tip: 'In production, operators see real-time updates, can reply, assign, and track SLA timers.',
    };
  },
});

registerTool({
  name: 'demo_workflow',
  description: 'Show a complete ticket lifecycle demo: creation → assignment → response → resolution. Explains how the support workflow works step by step.',
  tier: 'free',
  inputSchema: {
    type: 'object',
    properties: {},
  },
  handler: async () => {
    return {
      title: 'Support Ticket Lifecycle',
      steps: [
        {
          step: 1,
          name: 'Ticket Created',
          status: 'new',
          description: 'Client submits a ticket via widget, email, WhatsApp, Telegram, or admin panel.',
          who: 'Client or operator',
        },
        {
          step: 2,
          name: 'Auto-Assignment',
          status: 'new → assigned',
          description: 'Automation rules assign the ticket to the right operator based on category, priority, or load balancing.',
          who: 'System (automation)',
          requires: 'pro+ plan for automation, otherwise manual assignment',
        },
        {
          step: 3,
          name: 'Estimation',
          status: 'estimated',
          description: 'Operator estimates time and cost. Client approves the estimate.',
          who: 'Operator → Client approval',
        },
        {
          step: 4,
          name: 'In Progress',
          status: 'in_progress',
          description: 'Operator works on the issue. Real-time chat, file sharing, screen sharing available.',
          who: 'Operator',
        },
        {
          step: 5,
          name: 'Resolution',
          status: 'done',
          description: 'Operator marks as done. Client receives notification and can leave feedback.',
          who: 'Operator → Client feedback',
        },
        {
          step: 6,
          name: 'Closure',
          status: 'closed',
          description: 'Ticket auto-closes after inactivity or client confirms resolution.',
          who: 'System or client',
        },
      ],
      channels: ['Website Widget', 'WhatsApp (starter+)', 'Telegram (starter+)', 'Email', 'Admin Panel'],
      try_it: 'Use demo_create_ticket to create a test ticket and see it in action!',
    };
  },
});
