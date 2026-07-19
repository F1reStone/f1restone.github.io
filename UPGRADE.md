# “FireStone 网站”对上游 Astro Rocket 主题的升级/合并指南

当从上游 [Astro Rocket](https://github.com/hansmartensdev/astro-rocket) 合并新版本时，按照本文档的规则和检查清单执行。

## 前置准备

### 1. 创建备份分支

```bash
git checkout -b backup-before-astroX-upgrade
git checkout main
```

### 2. 升级依赖

```bash
# 先跑 Astro 官方升级工具
npx @astrojs/upgrade

# 再升级兼容范围内的其他插件
pnpm up
```

### 3. 版本策略

| 规则 | 说明 |
|------|------|
| Astro 核心 | 以X.Y.Z为例，大版本（X）跟随上游 — 中小版本可用官方工具升级（Y.Z） |
| ESLint / TypeScript 等包括格式检查的依赖 | **绝不自行升级大版本**。上游升了才跟，上游没升绝对不升 |
| 其他插件 | 仅升小版本（`pnpm up` 不加 `--latest`） |
| 独占依赖 | `astro-expressive-code`、`@expressive-code/plugin-frames` 等上游不用的包，保持兼容范围最新即可 |

---

## 合并策略

### 核心原则

```
我方页面 > 上游页面
我方组件 > 上游组件（但是有新功能/特性除外，可以选择性移植）
上游未改动组件 > 我方未改动组件
上游新增功能 > 保留（除非冲突）
```

### 文件分类处理

#### A 类：我们的实际页面 — 以我们为准

这些文件中的页面和版式设计**绝不**接受上游覆盖：

| 文件 | 原因 |
|------|------|
| `src/pages/index.astro` | FireStone 首页，完全自定义 |
| `src/pages/about.astro` | FireStone 关于页 |
| `src/pages/ai.astro` | FireStone AI 页面 |
| `src/pages/blog/*` | 博客路由（zh-CN 过滤、自定义 Hero） |
| `src/pages/projects/*` | 项目路由（soloPage 过滤、自定义样式） |
| `src/pages/404.astro` | 自定义 404 页 |
| `src/pages/og/*` | 自定义 OG 图片 |
| `src/pages/projects/sparkforge.astro` | Solo 项目页 |

**处理方法**：
```bash
git checkout --ours <file>
git add <file>
```

然后手动融合上游的 i18n 改进（见下文"融合上游改进"）。

#### B 类：我们的定制组件 — 以我们为准

| 文件 | 定制内容 |
|------|----------|
| `src/components/layout/Header.astro` | 二级 Logo、移动端 Logo 轮播、hdr-glass-pill、中文 CTA、自定义滚动行为 |
| `src/components/layout/Footer.astro` | 中文页脚链接组、法律链接带图标+Cookie 操作 |
| `src/components/layout/SearchModal.astro` | FireStone 自定义搜索 UI：毛玻璃面板、品牌色图标辉光、平滑高度过渡、移动端防软键盘 |
| `src/components/blog/ArticleHero.astro` | 沉浸式全屏 Hero、invert-section、毛玻璃背景 |
| `src/components/blog/Comments.astro` | 中文 Giscus 配置、自定义主题 |
| `src/components/projects/ProjectHero.astro` | 项目 Logo 支持、自定义 meta 行 |
| `src/components/patterns/ContactForm.astro` | 中文表单 |

**处理方法**：同上 `--ours`，然后融合上游改进。

#### C 类：上游未改动组件 — 以上游为准

这些文件我们没有深度定制，直接用上游版本获得最新功能和修复：

| 文件 | 说明 |
|------|------|
| `src/components/ui/primitives/Icon/Icon.astro` | 图标映射 — **但必须合并我们的 `iconMap` 条目！** |
| `src/components/ui/primitives/Icon/Icon.tsx` | React 版图标 |
| `src/components/blog/ShareButtons.astro` | 分享按钮 |
| `src/components/blog/Pagination.astro` | 分页 |
| `src/components/seo/SEO.astro` | SEO 元标签 |
| `src/components/hero/Hero.astro` | Hero 布局 |
| `src/lib/*` (未改动的) | 工具库 |

**处理方法**：
```bash
git checkout --theirs <file>
git add <file>
```

然后检查并恢复任何丢失的中文定制。

#### D 类：新增文件 — 直接保留

上游新增的文件（测试、新组件、API 端点等）直接保留。无需操作。

#### E 类：上游删除、我们保留的文件 — 确认是否需要

如果上游删除了某个文件但我们需要它，从备份恢复：
```bash
git show backup-before-astroX-upgrade:<path> > <path>
```

---

## 融合上游改进

当以上游为准的文件替换后，或者以我们为准的文件需要融入 i18n 改进时，按下列模式操作：

### i18n 改进（最常出现）

1. **导入补充**：添加 `localizedPath`、`getLocales`、`getPostTranslations` 等
2. **面包屑**：href 从硬编码 `/` 改为 `localizedPath('/', locale)`
3. **OG 图片路径**：使用 `getPostSlug(slug, locale)` 替代手动 split
4. **languageAlternates**：计算后传给 Header（需先在 Header 的 Props 中添加此属性）
5. **localeAlternates**：传给 BaseLayout

### 字典更新

每次合并后检查 `src/i18n/zh-CN.json` 是否缺上游新增的键：

- 上游 `en.json` / `en-US.json` 中的新键
- 新组件引用的 `t()` 键
- `nav.items.*` 翻译
- `blog.share`、`blog.shareOn`、`blog.copyLink` 等

### Icon 映射合并

`Icon.astro` 中的 `iconMap` 需要同时包含：

- 上游的图标（github, x-twitter, instagram, bluesky, brand-* 等）
- FireStone 的中文平台图标（bilibili, zhihu, neteasecloudmusic, weibo, youtube 等）
- FireStone 的 `brand-claude: simple-icons:anthropic` 映射（上游用 `simple-icons:claude`）

---

## 构建验证清单

每次合并后必须全部通过：

- [ ] `npx astro check` — 0 errors
- [ ] `npx astro build` — 构建成功
- [ ] `pnpm dev` — 本地验证关键页面
  - [ ] 首页 (`/`)
  - [ ] 博客列表 (`/blog`)
  - [ ] 博客文章 (`/blog/<slug>`)
  - [ ] 项目列表 (`/projects`)
  - [ ] 项目详情 (`/projects/<slug>`)
  - [ ] 关于页 (`/about`)
  - [ ] AI 页 (`/ai`)
  - [ ] SparkForge 页 (`/projects/sparkforge`)
  - [ ] 搜索弹窗 (Cmd+K)
  - [ ] 深色/浅色模式切换

---

## 常见陷阱与排查

### 1. 语法错误：多余的 `}` 或 `];`

**症状**：`Declaration or statement expected` 在对象/数组末尾

**原因**：合并冲突解决后遗留了上游版本的闭合符号（例如 `cusdis` 块后多了一个 `}`）

**排查**：检查 `site.config.ts`、`nav.config.ts` 等配置文件的结构完整性

### 2. Astro 7 Rust 编译器：HTML 注释问题

**症状**：`[CompilerError] Unexpected token` 在 `.astro` 文件中

**原因**：Astro 7 的 Rust 编译器对 HTML 注释中的 `<html>`、`</html>` 等标签名敏感

**修复**：将多行 HTML 注释中包含 HTML 标签示例的部分简化为纯文本

### 3. 大小写不匹配导致 slug 提取失败

**症状**：`Missing parameter: slug` 在 OG 图片路由中

**原因**：`post.id` 中的 locale 是大写 `zh-CN/` 但 `post.data.locale` 可能是小写 `zh-cn`。`getPostSlug` 的正则需要 `i` 标志

**修复**：
```ts
// src/lib/blog.ts
export function getPostSlug(postId: string, locale: string = defaultLocale): string {
  return postId.replace(new RegExp(`^${locale}/`, 'i'), '');  // ← 注意 'i' 标志
}
```

### 4. 类型不匹配：NavConfigItem vs ResolvedNavItem

**症状**：`Property 'order' is missing in type 'ResolvedNavItem'`

**原因**：`getNavItems()` / `getFooterNavItems()` 返回 `ResolvedNavItem[]`（只有 `{label, href, external}`），但 Header/Footer 中 `.map()` 回调参数类型注为 `NavConfigItem`（有 `order` 等字段）

**修复**：将回调参数类型改为 `ResolvedNavItem`

### 5. 类型不匹配：Dictionary 类型与 glob 加载

**症状**：`Argument of type 'Record<string, unknown>' is not assignable...`

**原因**：`import.meta.glob` 返回 `Record<string, unknown>`，但 `Dictionary` 类型是具体的 JSON 结构类型

**修复**：将 `Dictionary` 改为 `Record<string, unknown>`（失去严格类型但兼容 glob 自动加载）

### 6. 未闭合的 `<div>` 标签

**症状**：`Expected corresponding JSX closing tag for 'div'`

**原因**：从备份恢复的布局文件有 `<div class="min-h-screen">` 包裹内容+Footer，但 Footer 在 BaseLayout 的 slot 中，外层 `<div>` 需要手动闭合

**修复**：在 `<Footer />` 之前添加 `</div>`

### 7. `i18nConfig` 类型/值冲突

**症状**：`'i18nConfig' refers to a value, but is being used as a type here`

**原因**：`site.config.ts` 中 `export { i18nConfig }` 会导致 TypeScript 在此文件中将 `i18nConfig` 同时视为值和类型

**修复**：移除 `export { i18nConfig }`（无人从 site.config 导入它；i18n 统一从 `@/i18n` 导入）

### 8. legalLinks 丢失 icon 和 action

**症状**：页脚法律链接没有图标，Cookie 首选项按钮失效

**原因**：`getLegalLinks()` 调用了 `resolveNavItem()` 返回 `ResolvedNavItem` 类型（只有 `{label, href, external}`），丢失了 `LegalLink` 的 `icon` 和 `action` 字段

**修复**：修改 `getLegalLinks()` 返回 `LegalLink[]`，手动合并 `resolveNavItem` 的结果并保留原始字段

### 9. 供应链安全检查阻止安装

**症状**：`ERR_PNPM_MINIMUM_RELEASE_AGE_VIOLATION`

**原因**：Astro 新版本发布不到 24 小时

**临时绕过**：`pnpm config set minimumReleaseAge 0 --location project`，等 24 小时后删除

---

## FireStone 代码风格速览

### 样式分层

| 复杂度 | 实现方式 | 示例 |
|--------|----------|------|
| 布局、间距、颜色 | Tailwind 工具类 | `flex items-center gap-3 px-5` |
| 简单悬停 | Tailwind 状态变体 | `hover:bg-secondary hover:text-foreground` |
| 发光、模糊 | 全局 CSS 类 | `.hdr-glass-pill`、`.hdr-logo-glow` |
| 动画/关键帧 | scoped `<style>` | `@keyframes logo-fade-main` |
| GPU 加速效果 | `will-change` + `translateZ(0)` | `.hdr-logo-glow` |
| 可变字重锁定 | `::after` 伪元素 + `data-text` | `.interactive-glow-center` |

### 关键 CSS 类（位于 `src/styles/global.css`）

- `.hdr-glass-pill` — 液金玻璃按钮（backdrop-filter + box-shadow）
- `.hdr-logo-glow` — Logo 悬停辉光（drop-shadow + color-mix）
- `.interactive-glow-center` / `.interactive-glow-left` — 可变字重过渡
- `.hdr-social-link` — 社交媒体 SVG 图标辉光
- `.invert-section` — 反色区域（暗底白字 ↔ 亮底黑字）
- `[data-reveal]` / `[data-reveal-children]` — 滚动入场动画

### 组件模式

```astro
---
// 1. 导入
import { cn } from '@/lib/cn';
import siteConfig from '@/config/site.config';

// 2. Props 接口（含 JSDoc）
interface Props {
  title: string;
  size?: 'sm' | 'md' | 'lg';
  class?: string;
}

// 3. 解构 + 默认值
const { title, size = 'md', class: className } = Astro.props;
---

<!-- 4. 模板：Tailwind 工具类 + cn() 合并条件类 -->
<div class:list={cn('base-classes', variantClasses, className)}>
  <slot />
</div>

<!-- 5. 复杂效果用 scoped style -->
<style>
  .custom-effect {
    will-change: transform;
    transform: translateZ(0);
    transition: filter 300ms var(--ease-default);
  }
</style>
```

### 中文/国际化

- 默认语言：`zh-CN`
- 所有用户可见文本使用中文
- i18n 字典文件：`src/i18n/zh-CN.json`
- 面包屑、按钮标签等使用中文硬编码（`'首页'`、`'返回「博客」'`），待后续升级
- i18n 配置中 `enabled: false`，仅 `zh-CN` 一个 locale 激活路由

### 品牌设计令牌

```css
/* 主品牌色 */
--brand-500: oklch(62.5% 0.22 289);  /* 紫色 */
/* 强调色 */
color: var(--color-brand-500);  /* 通过 Tailwind: text-brand-500 */
/* 自定义缓动 */
--ease-default: cubic-bezier(0.4, 0, 0.2, 1);
--ease-bouncy: cubic-bezier(0.22, 1.6, 0.36, 1);
```
修改时可能会疏忽此文档的内容，以最新版本颜色主题（firestone.css）为准

---

## 快速参考命令

```bash
# 查看冲突文件
git diff --name-only --diff-filter=U

# 以我们为准
git checkout --ours <file> && git add <file>

# 以上游为准
git checkout --theirs <file> && git add <file>

# 从备份恢复
git show backup-before-astroX-upgrade:<path> > <path>

# 查看某个文件在备份分支的版本
git show backup-before-astroX-upgrade:<path>

# 对比当前与备份分支
git diff backup-before-astroX-upgrade HEAD -- <path>

# 查看所有合并改动的文件
git diff backup-before-astroX-upgrade HEAD --name-only

# 类型检查
npx astro check

# 构建（绕过 pnpm 供应链检查）
npx astro build
```
