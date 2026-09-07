import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import en from '@/i18n/en-US.json';
import zh from '@/i18n/zh-CN.json';
import ts from 'typescript';

function flatten(value: unknown, prefix = ''): Record<string, string> {
  if (typeof value === 'string') return { [prefix]: value };
  if (!value || typeof value !== 'object') return {};
  return Object.assign(
    {},
    ...Object.entries(value).map(([key, child]) =>
      flatten(child, prefix ? `${prefix}.${key}` : key)
    )
  );
}

describe('shared UI dictionaries', () => {
  const dictionaries = [flatten(zh), flatten(en)];
  it('keeps the two dictionary structures aligned', () => {
    expect(Object.keys(dictionaries[0]).sort()).toEqual(Object.keys(dictionaries[1]).sort());
  });
  it('resolves every literal translation used by components and layouts in both languages', () => {
    const missing: string[] = [];
    for (const directory of ['components', 'layouts']) {
      const root = resolve('src', directory);
      for (const file of readdirSync(root, { recursive: true })) {
        if (typeof file !== 'string' || !/\.(astro|tsx?)$/.test(file)) continue;
        const source = readFileSync(join(root, file), 'utf8');
        const script = file.endsWith('.astro') ? source.split('---')[1] || '' : source;
        const parsed = ts.createSourceFile(
          file,
          script,
          ts.ScriptTarget.Latest,
          true,
          ts.ScriptKind.TSX
        );
        if (
          !parsed.statements.some(
            (statement) =>
              ts.isImportDeclaration(statement) &&
              statement.moduleSpecifier.getText().includes('@/i18n')
          )
        )
          continue;
        for (const [, key] of source.matchAll(/\bt\(\s*['"]([\w.]+)['"]/g)) {
          for (let index = 0; index < dictionaries.length; index++)
            if (!dictionaries[index][key])
              missing.push(`${file}: ${index === 0 ? 'zh-CN' : 'en-US'} ${key}`);
        }
      }
    }
    expect([...new Set(missing)]).toEqual([]);
  });
});
