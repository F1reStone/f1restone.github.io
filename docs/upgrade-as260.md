# Astro Rocket 2.6.0 迁移记录

日期：2026-09-08。工作分支 `as260`；本地起点 `main` / `8c7ee4d`；备份分支 `backup-before-as260-upgrade`。上游参考 [`v2.6.0`](https://github.com/hansmartensdev/Astro-Rocket/tree/v2.6.0)，提交 `d356f0e347209c7de5962c0f5991d8d1d96384ed`。

## 方法与主要抉择

采用逐项移植，没有进行整棵源码的 Git merge。先升级依赖并独立通过 check/build，再迁移功能。版本号表示采用 2.6.0 功能基线，源码仍是 FireStone 定制分支；没有推送、合并回 main、部署或修改 GitHub Actions。

后续经用户明确要求，已单独优化 GitHub Actions；该追加工作的范围和操作见 [CI 指南](ci.md)。

| 变化                         | 选择                                                                                                                                            |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| 2.6 Astro / MDX              | Astro 7.3.1、MDX 8.0.0；集成和依赖先升级，保留本地较新版本                                                                                      |
| TypeScript / Expressive Code | TS 6.0.3，暂不升 TS 7、Vitest 5；Expressive Code 三个包同步到 0.44.2                                                                            |
| 页面共享 View                | 提取 FireStone 原页面，保留设计、正文与交互；首页、关于、AI 由共享视图服务不同语言路由；博客/项目使用统一的 FireStone 视图                      |
| 英语发布                     | 正式配置继续关闭；完成基础设施并测试英语模式，不加入 nl，不继续声明 zh-TW 为支持语言                                                            |
| 未翻译内容                   | 按后续要求改为语言前缀页面，服务端回退到配置中的默认语言；横幅提示，canonical 指向原文，回退副本不参与索引。详见 [语言回退规则](locale-fallback.md)。 |
| 通用界面本地化               | Header、Footer、Cookie、搜索、主题、效果设置、表单、社交平台、ARIA 和错误状态使用实际字典；不替换 CSS 设计                                      |
| 2.4.1 LetterGlitch           | 移植离屏暂停与颜色预解析，保留视觉效果                                                                                                          |
| 2.3 新 CTA / newsletter 设计 | 不加入上游营销板块、不开启订阅。现有表单移植本地化、honeypot、可访问名称与未配置状态                                                            |
| 联系与订阅接口               | 本站静态输出且没有对应 API，取消指向不存在接口的默认 action；使用者须显式传入可用接口，未配置时禁用提交并显示说明。没有假成功、后端或适配器变更 |
| 2.2 Umami                    | 可选移植，但遵守本地严格 consent；撤销后阻止发送。需要同时配置 ID 和启用 consent UI，未配置时不启用                                             |
| 评论组件化                   | Comments 变为 dispatcher；Giscus 保留 FireStone 主题，补齐 Artalk/Cusdis 与语言映射；当前仍选 Giscus                                            |
| 主题选择器                   | 使用已有 selectorThemes，避免两个控件重复维护名单；仍只展示 FireStone                                                                           |
| 容器、部署、演示内容         | 保留静态 Cloudflare 方式；未移植不适用的 Docker/导出流程、演示文章及服务页                                                                      |

## 修复的实际问题

1. **关闭 i18n 仍跳转。** 旧 BaseLayout 无条件读取浏览器语言，英语访客会被送往不存在的页面。现在必须同时开启 i18n 和浏览器识别，并且只在首页执行。
2. **四位 locale 的大小写。** 内容 ID 中的 `zh-cn` 未被 canonical-id 工具剥离，产生 `/blog/zh-cn/...` 的错误语言链接。现在前缀匹配不区分大小写。
3. **内容路由。** 默认项目路由改为只读取默认语言，统一 slug 处理；语言路由也排除 soloPage。默认文章路由补齐 uid、PostLink 和冲突检查，英语文章补齐阅读时间的 body。
4. **面包屑。** 页面/布局提供真实标题与父级，不再查菜单或显示编码的 CJK 标签，不再生成 `/blog/tag` 中间死链；BaseLayout 只输出一份 BreadcrumbList，最后一项指向当前页。
5. **分享图片。** 首页去掉不存在的 `/og-default.svg`，使用 FireStone 默认 PNG；文章/项目分享卡在构建时生成 PNG，仓库内 Source Han 字体转轮廓后栅格化，不依赖系统中文字体。旧 SVG 端点保留兼容。
6. **元信息。** 修正默认页 og:locale、schema 图片双斜线；移除不真实的统一图片尺寸，补充 Twitter 图片替代文字，移除个人首页不适用的 ProfessionalService 声明。
7. **索引与语言声明。** noindex 组件库不进入 sitemap；404 不输出面包屑或语言替代链接；hreflang 只指向实际内容，提示参数不污染 canonical。
8. **站点地址。** 提前加载 `.env.local` / `.env`，检查全部 HTML 的 canonical 与 JSON-LD 地址一致；RSS、robots、sitemap 使用同一地址。
9. **RSS / llms.txt。** 增加语言 RSS，将作者姓名放到 dc:creator；动态 llms.txt 只列真实内容和导航目标。

## 验证与使用

完整操作见 [UPGRADE.md](../UPGRADE.md)。新增 `test:run`、`test:i18n` 和真实可运行的 Playwright 配置；`validate` 现在也运行单元测试。

- `pnpm test:run`：URL、翻译、阅读时间、内容校验、字典使用、面包屑等。
- `pnpm build` 后执行 `pnpm test:e2e`：检查构建文件、链接、schema、语言、图片，并操作移动菜单、搜索、主题与设置。
- `pnpm test:i18n`：临时双语内容验证不同 slug、草稿排除、阅读时间、Expressive Code、缺失翻译提示、Cookie/效果设置及严格 Umami；结束后恢复配置和内容。

已验证英语无文章时的 32 页构建，以及包含临时双语内容的 40 页构建。后者浏览器 8 项检查全部通过；正式中文构建的 5 项适用检查通过，其余 3 项由双语测试覆盖。99 项单元测试通过。测试内容会清理，正式构建仅发布中文页面。

Umami 配置项是 `PUBLIC_UMAMI_WEBSITE_ID` 和 `PUBLIC_UMAMI_SRC`（默认官方 Cloud 脚本）；本地额外要求 `PUBLIC_CONSENT_ENABLED=true`，不会照搬上游直接加载的策略。Artalk/Cusdis 未配置真实服务，因此仅验证其组件编译及配置接线，没有声称验证了第三方服务端。

核心页面正文和营销内容仍未翻译，这是本次范围约束。开放英语前应补内容、更新 nav.config.ts 中的 availableLocales 和语言对应关系，再运行两种模式的检查。缺失语言提示采用很小的客户端脚本读取 query，不复制原文页面，也不更改 canonical。

SEO 检查针对生成文件和浏览器行为，没有承诺 Lighthouse 4×100，也没有把 Lighthouse 分数等同于搜索排名。线上抓取、索引和站点验证需在部署后通过 Search Console 继续观察。
