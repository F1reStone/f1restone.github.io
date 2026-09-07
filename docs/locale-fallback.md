# 语言回退与底部横幅

语言开关和默认语言由 `src/config/i18n.config.ts` 决定。新增页面不应再通过 Header/Footer 菜单推测是否存在，也不使用 `?requestedLocale=...`。

`src/lib/page-routes.ts` 在构建时收集 `.astro` 页面及其 `getStaticPaths()` 输出。`src/pages/[locale]/[...path].astro` 为缺少翻译的页面生成语言前缀地址，用 Astro rewrite 渲染默认语言页面。已有的翻译路由优先；未知页面仍然返回 404。接口、资源和 404 页面不生成语言副本。当前动态路由均直接返回静态路径；以后新增依赖 `paginate()` 参数的路由时，也需要扩展此收集器。

例如 `/en-US/blog/open-weights-and-american-ai-leadership/` 保留英语地址和通用界面，正文使用配置中的默认语言。文章若通过 uid 关联了不同 slug 的英语译文，旧 slug 的英语地址会渲染实际译文。首页、关于和 AI 页面在完成正文翻译前不保留英语包装路由；未来完成翻译后添加真实路由即可覆盖回退。

回退页面的 `html lang` 描述正文语言，提示横幅标注请求语言。canonical 指向原文；回退副本设置 noindex，不列入 sitemap、Pagefind 或 hreflang 翻译集合。语言切换菜单仍可进入对应语言前缀地址。

语言提示与 Cookie 横幅共享样式，语言在上、Cookie 在下。语言横幅立即进入，Cookie 保留配置中的 500ms 延迟；弹出时长 300ms，语言横幅让位时长 450ms，两者使用同一缓动曲线。让位动画仅在显隐变化时测量位置，由浏览器执行位移；生产 CSS 将毫秒压缩成秒时也会正确换算。减少动态效果模式下直接就位。普通高度不创建额外滚动容器，短屏允许堆叠区域滚动，以保持按钮可达。

确认按钮仅关闭语言提示，返回首页保留请求语言；Cookie 的严格同意策略独立运行。没有 JavaScript 时仍可阅读回退页面、看到提示并使用首页链接。

验证使用 `pnpm test:run`、构建后的 `pnpm test:e2e`，以及带临时中英译文和同意策略配置的 `pnpm test:i18n`。后者自动恢复配置并删除自身创建的内容。浏览器检查覆盖无 JS、移动端、CJK 地址、SEO、双横幅顺序与让位动画。
