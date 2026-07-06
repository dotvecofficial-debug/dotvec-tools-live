import { getTool, tools, type ToolDefinition } from './tools';
import { readStore } from './store';

export async function getEffectiveTools(): Promise<ToolDefinition[]> {
  const store = await readStore();
  return tools.map((tool) => ({ ...tool, ...(store.toolOverrides[tool.slug] || {}) }));
}

export async function getEffectiveTool(slug: string): Promise<ToolDefinition | undefined> {
  const base = getTool(slug);
  if (!base) return undefined;
  const store = await readStore();
  return { ...base, ...(store.toolOverrides[slug] || {}) } as ToolDefinition;
}
