/**
 * Knowledge base tools — FREE tier.
 * AI can search docs, read articles, list FAQ.
 */
import { registerTool } from '../../tool-registry.js';
import { readDocsFile, listDocs } from '../../support-client.js';

registerTool({
  name: 'knowledge_search',
  description: 'Search the Support knowledge base for articles about features, setup guides, and troubleshooting. Returns matching article titles and snippets.',
  tier: 'free',
  inputSchema: {
    type: 'object',
    properties: {
      query: { type: 'string', description: 'Search query (e.g. "how to setup widget", "SLA configuration")' },
    },
    required: ['query'],
  },
  handler: async (args) => {
    const query = String(args.query).toLowerCase();
    const docs = await listDocs();

    const matches = docs.filter(d =>
      d.slug.toLowerCase().includes(query) ||
      d.category.toLowerCase().includes(query)
    );

    if (matches.length === 0) {
      return {
        message: 'No articles found. Try broader search terms.',
        available_categories: [...new Set(docs.map(d => d.category))],
        total_articles: docs.length,
      };
    }

    return {
      results: matches.slice(0, 10).map(m => ({
        slug: m.slug,
        category: m.category,
        read_with: `Use knowledge_read tool with slug "${m.slug}" to read full article`,
      })),
      total_matches: matches.length,
    };
  },
});

registerTool({
  name: 'knowledge_read',
  description: 'Read a specific knowledge base article by slug. Returns full markdown content of the article.',
  tier: 'free',
  inputSchema: {
    type: 'object',
    properties: {
      slug: { type: 'string', description: 'Article slug (e.g. "guides/quickstart-admin", "tools/widgets")' },
    },
    required: ['slug'],
  },
  handler: async (args) => {
    const content = await readDocsFile(String(args.slug));
    if (!content) {
      const docs = await listDocs();
      return {
        error: 'Article not found',
        available: docs.slice(0, 20).map(d => d.slug),
      };
    }
    return { slug: args.slug, content };
  },
});

registerTool({
  name: 'knowledge_list',
  description: 'List all available knowledge base articles grouped by category. Use this to explore what documentation is available.',
  tier: 'free',
  inputSchema: {
    type: 'object',
    properties: {
      category: { type: 'string', description: 'Filter by category (e.g. "guides", "tools", "faq"). Omit to list all.' },
    },
  },
  handler: async (args) => {
    const docs = await listDocs();
    const category = args.category ? String(args.category).toLowerCase() : null;

    const filtered = category
      ? docs.filter(d => d.category.toLowerCase() === category)
      : docs;

    const grouped: Record<string, string[]> = {};
    for (const d of filtered) {
      (grouped[d.category] ??= []).push(d.slug);
    }

    return {
      categories: grouped,
      total: filtered.length,
    };
  },
});
