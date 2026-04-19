# TehProf Support MCP Server

AI-powered helpdesk & ticket management via [Model Context Protocol](https://modelcontextprotocol.io).

[![MCP](https://img.shields.io/badge/MCP-1.0-blue)](https://modelcontextprotocol.io)
[![Transport](https://img.shields.io/badge/transport-Streamable%20HTTP-green)]()
[![License](https://img.shields.io/badge/license-MIT-yellow)]()

## Quick Start

Connect to the remote MCP server — no installation needed:

```json
{
  "mcpServers": {
    "tehprof-support": {
      "url": "https://support.tehprof.kz/mcp",
      "transport": "streamable-http"
    }
  }
}
```

For authenticated access (unlocks more tools based on your plan):

```json
{
  "mcpServers": {
    "tehprof-support": {
      "url": "https://support.tehprof.kz/mcp",
      "transport": "streamable-http",
      "headers": {
        "Authorization": "Bearer YOUR_API_KEY"
      }
    }
  }
}
```

## Features

- **28 AI tools** for complete helpdesk management
- **Free tier** — 9 tools available without authentication
- **Tiered access** — tools unlock based on your subscription plan
- **Streamable HTTP** transport (MCP spec 2025-03-26)
- **Server discovery** via `.well-known/mcp.json`

## Tools by Tier

### Free (no API key needed)
| Tool | Description |
|------|-------------|
| `knowledge_search` | Search knowledge base articles |
| `knowledge_read` | Read a specific article |
| `knowledge_list` | List all articles by category |
| `onboarding_guide` | Step-by-step setup guide |
| `onboarding_features` | Feature comparison by plan |
| `demo_create_ticket` | Create a demo ticket in sandbox |
| `demo_view_ticket` | View demo ticket details |
| `demo_workflow` | See complete ticket lifecycle |
| `pricing_plans` | View all pricing plans |
| `pricing_calculate` | Get personalized plan recommendation |
| `system_health` | Check platform status |
| `system_info` | Platform capabilities and info |
| `system_tenant_info` | Your company details |
| `settings_get` | View tenant settings |
| `settings_update` | Configure available settings |
| `settings_operators` | List team operators |

### Starter ($20/mo)
| Tool | Description |
|------|-------------|
| `tickets_list` | List tickets with filters |
| `tickets_get` | Get ticket details + messages |
| `analytics_dashboard` | Support dashboard overview |
| `channels_list` | List messaging channels |
| `channels_status` | Check channel connection status |

### Pro ($60/mo)
| Tool | Description |
|------|-------------|
| `tickets_create` | Create new tickets |
| `tickets_reply` | Reply to tickets |
| `tickets_update` | Update ticket status/priority |
| `analytics_sla` | SLA compliance report |
| `analytics_operators` | Operator performance stats |
| `automation_rules_list` | List automation rules |
| `automation_rules_create` | Create new rules |
| `automation_rules_toggle` | Enable/disable rules |
| `webhooks_list` | List outgoing webhooks |

### Business ($100/mo)
| Tool | Description |
|------|-------------|
| `bitrix_contacts` | Search CRM contacts |
| `bitrix_deals` | List CRM deals |
| `bitrix_tasks` | List/filter tasks |
| `bitrix_task_create` | Create tasks linked to tickets |
| `bitrix_users` | List portal users |
| `channels_configure` | Configure messaging channels |

## Supported AI Clients

Works with any MCP-compatible AI client:

- **Claude Desktop** — Add to `claude_desktop_config.json`
- **Claude Code** — Add to `.mcp.json` or `~/.claude/settings.json`
- **Cursor** — Configure in MCP settings
- **Cline** — Configure in VS Code extension settings
- **Continue.dev** — Add to `config.json`
- **Custom agents** — Use `@modelcontextprotocol/sdk`

## Server Discovery

The server exposes a discovery endpoint:

```
GET https://support.tehprof.kz/.well-known/mcp.json
```

Returns server capabilities, authentication requirements, and tier descriptions.

## What is TehProf Support?

TehProf Support is a SaaS helpdesk platform for IT companies:

- **Multi-tenant** — each company gets isolated workspace
- **Multi-channel** — WhatsApp, Telegram, Email, Widget, MAX Messenger
- **Multi-CRM** — Bitrix24 (native), AmoCRM (coming soon), standalone
- **Multi-language** — Russian, Kazakh, English
- **AI assistant** — Bot "Dina" with GPT-powered ticket classification
- **Automation** — Trigger rules, webhooks, scheduled tasks
- **Analytics** — 6 dashboard sections with KPI tracking

## API Key

Get your API key from the Support admin panel:
1. Log in at https://support.tehprof.kz
2. Go to Settings → API Keys
3. Create a new MCP key
4. Use it in the `Authorization: Bearer <key>` header

## Links

- **Website**: https://support.tehprof.kz
- **MCP Endpoint**: https://support.tehprof.kz/mcp
- **Server Card**: https://support.tehprof.kz/.well-known/mcp.json
- **Knowledge Base**: https://support.tehprof.kz/help
- **Bitrix24 Marketplace**: https://www.bitrix24.kz/apps/app/tekhprof.app2/

## License

MIT
