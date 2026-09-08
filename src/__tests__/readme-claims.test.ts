import { readFileSync, existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const readme = readFileSync('Astro-Rocket-README.md', 'utf8');
const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
const registry = JSON.parse(readFileSync('component-registry.json', 'utf8'));

// Guard author-facing promises against drifting away from the actual checkout.
describe('original-project documentation', () => {
  it('names the installed version ranges and pinned package manager accurately', () => {
    for (const [label, dependency] of [['Astro', 'astro'], ['Tailwind', 'tailwindcss'], ['TypeScript', 'typescript']]) {
      const version = (pkg.dependencies[dependency] ?? pkg.devDependencies[dependency]).replace(/^[~^]/, '');
      expect(readme).toContain(`${label}-${version}-`);
    }
    expect(readme).toContain(`**pnpm ${pkg.packageManager.split('@')[1]}**`);
    expect(readme).toContain(`Node.js ${pkg.engines.node.replace('>=', '')}+`);
  });

  it('documents runnable package scripts', () => {
    const commands = [...readme.matchAll(/\| `pnpm ([\w:-]+)` \|/g)].map(match => match[1]);
    expect(commands.length).toBeGreaterThan(5);
    for (const command of commands) expect(pkg.scripts, command).toHaveProperty(command);
  });

  it('lists component source files that exist', () => {
    const components = Object.values(registry.components) as { files: string[] }[];
    expect(components.length).toBeGreaterThan(20);
    for (const component of components) {
      for (const file of component.files) expect(existsSync(file), file).toBe(true);
    }
  });
});
