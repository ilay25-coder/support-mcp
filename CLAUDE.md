# Support MCP Server — CLAUDE.md

## ⛔ ГЛОБАЛЬНЫЕ ПРАВИЛА (подробности → /srv/CLAUDE.md)
> **#0 Ошибки первым делом** — проверить ошибки ПЕРЕД любой задачей + `bash /root/.claude/hooks/guardian-check.sh`
> **#1 Автоклассификация** — вопрос / любое изменение=architect-first / крупное=волны (категорий "мелкий"/"средний" НЕТ) + чеклисты до и после кода
> **#2 Auto-Skills** — hook подсказал Skill → вызвать Skill tool (security, perf, pipeline, qa...)
> **TOOL USAGE** — MCP (docker, postgres, redis, playwright, context7) вместо Bash
> **Самоочистка** — удалять temp файлы после задачи
> **Размер файлов** — Backend: 400 | Frontend: 350 | CSS: 250 строк
> **Новый сервис** → `/master-architect` обязательно

## Назначение
MCP (Model Context Protocol) сервер для TehProf Support.
Позволяет любому AI-клиенту (Claude, GPT, Gemini) управлять системой поддержки через стандартный протокол.

## Stack
- **Runtime**: Node.js 20 + TypeScript strict
- **SDK**: `@modelcontextprotocol/sdk` v1.12+
- **Transport**: Streamable HTTP (MCP spec 2025-03-26)
- **Port**: 8101 (127.0.0.1)
- **Systemd**: `support-mcp.service`

## Структура
```
mcp-server/
├── src/
│   ├── index.ts              # HTTP server + MCP transport
│   ├── auth.ts               # API key validation
│   ├── types.ts              # TypeScript types + tier logic
│   ├── tool-registry.ts      # Tool registration + tier gating
│   ├── support-client.ts     # HTTP client → PHP backend
│   └── tools/
│       ├── free/             # Free tier tools
│       │   ├── knowledge.ts  # knowledge_search/read/list
│       │   ├── onboarding.ts # onboarding_guide/features
│       │   ├── demo.ts       # demo_create_ticket/view/workflow
│       │   ├── pricing.ts    # pricing_plans/calculate
│       │   └── system.ts     # system_health/info/tenant_info
│       ├── paid/             # Paid tier tools
│       │   ├── tickets.ts    # tickets_list/get/create/reply/update
│       │   ├── analytics.ts  # analytics_dashboard/sla/operators
│       │   ├── settings.ts   # settings_get/update/operators
│       │   ├── channels.ts   # channels_list/status/configure
│       │   └── automation.ts # automation_rules + webhooks
│       └── bitrix/
│           └── proxy.ts      # bitrix_contacts/deals/tasks/users
├── dist/                     # Compiled JS
├── package.json
└── tsconfig.json
```

## PHP Backend Endpoints
- `app/api/mcp-auth.php` — валидация API ключей (localhost only)
- `app/api/mcp-internal.php` — все MCP операции (localhost only)

## Тарифная модель
| Тариф | Доступные tools |
|-------|----------------|
| free | knowledge.*, onboarding.*, demo.*, pricing.*, system.*, settings_get, settings_update, settings_operators |
| starter | + tickets_list/get, analytics_dashboard, channels_list/status |
| pro | + tickets_create/reply/update, analytics_sla/operators, automation.*, webhooks_list |
| business | + bitrix.*, channels_configure |
| enterprise | Всё |

## Deploy
```bash
# Rebuild
cd /srv/apps/support/mcp-server && npm run build && systemctl restart support-mcp

# Статус
systemctl status support-mcp

# Логи
journalctl -u support-mcp -f
```

## Endpoints
- `https://support.tehprof.kz/mcp` — MCP endpoint
- `https://support.tehprof.kz/.well-known/mcp.json` — Server card (discovery)
- `https://support.tehprof.kz/mcp/health` — Health check

## Auth
- Anonymous: доступ к free-tier tools
- Bearer API key: доступ по тарифу тенанта
- API ключи создаются в admin панели → Settings → API Keys
