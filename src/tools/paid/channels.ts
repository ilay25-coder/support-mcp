/**
 * Channel management tools — starter+ tier.
 * Manage WhatsApp, Telegram, Email, MAX channels.
 */
import { registerTool } from '../../tool-registry.js';
import { supportGet, supportPost } from '../../support-client.js';

registerTool({
  name: 'channels_list',
  description: 'List all configured messaging channels (WhatsApp, Telegram, Email, MAX) with their connection status.',
  tier: 'starter',
  inputSchema: {
    type: 'object',
    properties: {},
  },
  handler: async (_, ctx) => {
    const res = await supportGet('mcp-internal.php', ctx, { action: 'list_channels' });
    if (!res.ok) return { error: res.error || 'Failed to fetch channels' };
    return res.data;
  },
});

registerTool({
  name: 'channels_status',
  description: 'Check connection status of a specific channel. Useful for diagnosing delivery issues.',
  tier: 'starter',
  inputSchema: {
    type: 'object',
    properties: {
      channel_type: { type: 'string', enum: ['whatsapp', 'telegram', 'telegram_chat', 'email', 'max_messenger'], description: 'Channel type to check' },
    },
    required: ['channel_type'],
  },
  handler: async (args, ctx) => {
    const res = await supportGet('mcp-internal.php', ctx, {
      action: 'channel_status',
      channel_type: args.channel_type,
    });
    if (!res.ok) return { error: res.error || 'Failed to check channel' };
    return res.data;
  },
});

registerTool({
  name: 'channels_configure',
  description: 'Configure a messaging channel. Set up webhook URLs, API keys, and channel-specific settings.',
  tier: 'business',
  inputSchema: {
    type: 'object',
    properties: {
      channel_type: { type: 'string', enum: ['whatsapp', 'telegram', 'telegram_chat', 'email', 'max_messenger'], description: 'Channel type' },
      config: { type: 'object', description: 'Channel configuration (varies by type)' },
    },
    required: ['channel_type', 'config'],
  },
  handler: async (args, ctx) => {
    const res = await supportPost('mcp-internal.php', ctx, {
      action: 'configure_channel',
      channel_type: args.channel_type,
      config: args.config,
    });
    if (!res.ok) return { error: res.error || 'Failed to configure channel' };
    return { message: 'Channel configured', data: res.data };
  },
});
