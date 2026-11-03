# 中文字体分包

站点使用 Source Han Sans CN（思源黑体）作为中文展示字体，以保留 `palt`
全角标点压缩和可变字体特性。完整字体约 8 MB，作为网页字体直接加载会严重影响速度。

## 流程

1. 将母版字体放在：
   `src/assets/fonts/source-han-sans-cn-variable.woff2`
2. `pnpm dev`、`pnpm build`、`pnpm check` 都会先执行
   `pnpm fonts:build`，自动生成：
   - `public/fonts/source-han-sans-cn/*.woff2`
   - `public/fonts/source-han-sans-cn/font.css`
   - `public/fonts/source-han-sans-cn/manifest.json`
3. `BaseLayout.astro` 在 DOMContentLoaded 后的两个帧异步加载 `font.css`，不阻塞首屏。
   生成文件已在 `.gitignore` 中忽略，不需要提交。GitHub Actions 的
   `pnpm build` 会自动完成同样的分包。

## 切换 minimal / full

默认模式是 `full`，写在 `scripts/build-font-subsets.mjs` 的 `defaultMode`：

```js
const defaultMode = 'full';
```

日常测试不需要改这个文件，可以用命令临时覆盖：

```powershell
pnpm fonts:build:minimal   # 只生成 minimal，不构建站点
pnpm fonts:build:full      # 只生成 full，不构建站点
pnpm build:minimal         # 以 minimal 构建站点
pnpm build:full            # 以 full 构建站点
pnpm dev:minimal           # 以 minimal 启动开发服务器
pnpm dev:full              # 以 full 启动开发服务器
```

也可以在 CI 或当前 shell 里用环境变量覆盖，优先级低于 `--mode`：

```powershell
$env:FONT_SUBSET_MODE = "minimal"
pnpm build
```

优先级为：`--mode` > `FONT_SUBSET_MODE` > `defaultMode`。如果只想永久改变默认值，
再修改 `defaultMode` 并重新构建。

- `minimal`：扫描 `src/` 中会出现的 CJK 字符，生成一个约 377 KiB 的字体。
  新增中文内容后，下一次构建会自动重新收集字符。
- `full`：把完整字体切成 unicode-range 分片，覆盖任意中文文本。构建耗时更长，
  生成文件约 12.5 MiB、310 个分片，但浏览器只下载当前页面实际用到的分片。

两种模式输出相同的 `font.css` 契约和字体族名
`Source Han Sans CN Variable`，页面组件、主题变量和 `font-feature-settings: 'palt'`
都不需要改。`fontFeature: true` 在两种模式下都会保留 OpenType 特性。

### full 模式的额外说明

- `full` 不是下载一个 12.5 MiB 的文件，而是按 unicode-range 拆成约 310 个分片。
  首次访问一篇中文页面时，浏览器按页面实际字符请求其中一部分。
- `full` 模式不生成单个可预加载文件，因此 `manifest.json` 的 `preload` 为
  `null`，`BaseLayout` 不会插入字体 preload。
- `minimal` 模式只有一个文件，`manifest.json` 会给出 `preload` 地址。
  `BaseLayout` 只对桌面端（`min-width: 1024px`）做
  `fetchpriority="low"` 的 preload；移动端实测这个 head preload 会让首页
  LCP 延后约 1 秒，所以移动端不走 preload。

## 关于首屏后的延迟

此前 `BaseLayout` 在 DOMContentLoaded 后等待 3.5 秒，再用
`requestIdleCallback` 加载字体 CSS。实测这层延迟没有保护 FCP/LCP：

- full 模式：延迟时字体约 7–9 秒才开始请求；去掉延迟后约 3.5–3.8 秒开始。
- minimal 模式：延迟时约 7–8 秒开始；去掉延迟后约 3.6–3.8 秒开始。
- 两种模式的 FCP/LCP 没有一致变差，CLS 仍为 0；字体字节数也不变。
- 延迟只是把换字时间推后，可能让用户在开始阅读后才看到 `palt` 换行。

因此现在只保留“DOMContentLoaded 后两帧”来避开首屏渲染，不再使用
`setTimeout(3500)` 或 `requestIdleCallback`。字体 CSS 仍然由 JS 动态插入，
不是 render-blocking。

## 字符集与覆盖

`minimal` 扫描 `src/` 下可能渲染的 CJK 字符，包括博客、项目、页面文案和
MDX 正文；当前约 1136 个字符，压缩后约 377 KiB。搜索结果的摘要来自这些
构建期内容，因此也在这个集合里。

它**不覆盖**用户运行时输入（搜索框、AI/对话、API 返回）和用户生成内容。
缺少的字符回退到系统 CJK 字体，不会出现 tofu，只是字体不统一。

`full` 覆盖完整字库，适合以后把搜索框、AI 输入等任意文本也统一为
Source Han；代价是每页首次会多几个到几十个分片请求。

## 性能对比

条件：同一份站点源码、分别以两种字体模式构建；同一台机器、Chromium 156、390×844 移动端、
4× CPU、1.47 Mbps、关闭 Cookie 弹窗；每种模式跑两轮。数字为实验室结果，
不是真实用户数据。

| 页面                           | 模式    |        FCP |        LCP | 字体请求 | 字体传输 |
| ------------------------------ | ------- | ---------: | ---------: | -------: | -------: |
| `/`                            | minimal |      1.09s | 2.28–2.29s |        2 |  382 KiB |
| `/`                            | full    | 1.08–1.09s | 2.31–2.66s |       26 |  838 KiB |
| `/blog/new-firestone-website/` | minimal |      1.08s |      1.72s |        2 |  382 KiB |
| `/blog/new-firestone-website/` | full    | 1.06–1.08s | 1.70–1.72s |       21 |  613 KiB |

结论：

- FCP/LCP 的差异在实验室噪声范围内，**full 没有明显拖慢首屏**。
- 主要差异是字体传输和请求数：首页 full 多约 456 KiB、24 个请求；
  博客页多约 231 KiB、19 个请求。
- 字体文件在移除延迟后约 3.5–3.8 秒开始请求；这比旧的 7–9 秒提前，
  但 FCP/LCP 没有因此变差。
- 上面的 full 数字是首访、无 CDN 缓存的结果。full 的分片可以被后续页面
  和回访复用；minimal 只有一个文件，也同样适合缓存。
- 如果以后更重视首访成本，可以切回 `minimal`；如果搜索框、AI 输入等
  任意文本必须统一使用 Source Han，当前默认的 `full` 在首屏指标上可以接受，
  但需要接受额外字体流量和请求数。

## 工具更新

分包逻辑只存在于 `scripts/build-font-subsets.mjs`，站点样式只依赖
`Source Han Sans CN Variable` 这个字体族名。升级或替换
`cn-font-split` 时，修改脚本和 `package.json` 即可，不需要改页面组件。

在 GitHub Actions 中直接访问 GitHub Releases 下载分包器原生二进制即可。
本地如果 GitHub 访问受限，可在运行前设置：

```powershell
$env:CN_FONT_SPLIT_GH_HOST = "https://ik.imagekit.io/github"
pnpm fonts:build
```

## 为什么没有使用 vite-plugin-font

`vite-plugin-font` 的 Vite/Astro 集成会把生成的 `result.css` 和
`metrics.css` 直接 `import` 进主 CSS bundle，中文字体仍会进入首屏关键请求。
本项目需要把中文字体延后到首屏之后，所以保留独立脚本 + 异步 `<link>`。
如果未来采用该插件，需要改成动态导入其 CSS，而不是直接静态导入。
